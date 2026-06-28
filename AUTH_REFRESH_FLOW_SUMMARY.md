# Backend Auth Changes Summary

## What We Changed

Today we updated the backend auth flow so users can stay signed in after the access token expires, as long as the refresh token is still valid.

## Previous Behavior

- Login created a single JWT.
- That JWT was stored in the `jwt` cookie.
- Protected routes used that cookie through `passport-jwt`.
- When the JWT expired, `/auth/me` and other protected routes failed immediately.
- The frontend could still think the user was logged in if its local auth state was stale.

## New Behavior

- Login now issues two cookies:
- `jwt`: access token
- `refreshToken`: refresh token
- Access token lifetime is `15m`.
- Refresh token lifetime is `30d`.
- Protected routes still use `passport-jwt` with the `jwt` cookie.
- A new `POST /auth/refresh` endpoint was added.
- If `refreshToken` is valid, `/auth/refresh` generates fresh access and refresh tokens and resets both cookies.
- Logout now clears both cookies, not just the access-token cookie.

## Files Updated

- [src/auth/auth.repository.ts](/D:/Fullstack%20Project/resume%20builder/resume-builder-server/src/auth/auth.repository.ts)
- [src/auth/auth.service.ts](/D:/Fullstack%20Project/resume%20builder/resume-builder-server/src/auth/auth.service.ts)
- [src/auth/auth.controller.ts](/D:/Fullstack%20Project/resume%20builder/resume-builder-server/src/auth/auth.controller.ts)
- [src/auth/strategies/jwt.strategy.ts](/D:/Fullstack%20Project/resume%20builder/resume-builder-server/src/auth/strategies/jwt.strategy.ts)

## Technical Notes

- `generateJwt()` was replaced with token generation for both access and refresh tokens.
- `signJwt()` was replaced with logic that sets both cookies.
- `clearJwt()` was replaced with logic that clears both cookies.
- `/auth/refresh` reads the `refreshToken` cookie, validates it, and rotates tokens.
- The JWT strategy now accepts only access tokens for protected routes.

## Client-Side Expectation

- On app startup, client should call `/auth/me`.
- If `/auth/me` returns `401`, client should call `/auth/refresh`.
- If refresh succeeds, client should retry `/auth/me` or the failed protected request.
- If refresh fails, client should clear auth state and redirect user to login.

## Important Edge Cases

- If access token expires but refresh token is still valid, session can be restored silently.
- If both access and refresh tokens are expired, user must log in again.
- If a user returns after more than 30 days, refresh should fail and client should treat them as logged out.

## Notes

- We removed the temporary `sanitizeUser()` helper and restored inline response objects in `auth.service.ts`.
- We did not implement a Passport-specific refresh strategy.
- The refresh flow is application-level logic built on top of `passport-jwt`, which is the normal approach.
