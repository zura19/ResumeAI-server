# Auth Module Documentation

## Purpose

The `src/auth/` module handles authentication for the backend. It supports:

- Email/password login
- User registration
- Google OAuth login
- Cookie-based JWT authentication
- Access-token refresh
- Logout
- Fetching the currently authenticated user

## High-Level Design

This module uses cookie-based auth with two JWTs:

- `jwt`: short-lived access token
- `refreshToken`: longer-lived refresh token

Protected routes use the access token only. When the access token expires, the client can call `/auth/refresh` to get new tokens if the refresh token is still valid.

## Main Files

- [src/auth/auth.controller.ts](/D:/Fullstack%20Project/resume%20builder/resume-builder-server/src/auth/auth.controller.ts)
- [src/auth/auth.service.ts](/D:/Fullstack%20Project/resume%20builder/resume-builder-server/src/auth/auth.service.ts)
- [src/auth/auth.repository.ts](/D:/Fullstack%20Project/resume%20builder/resume-builder-server/src/auth/auth.repository.ts)
- [src/auth/auth.module.ts](/D:/Fullstack%20Project/resume%20builder/resume-builder-server/src/auth/auth.module.ts)
- [src/auth/strategies/jwt.strategy.ts](/D:/Fullstack%20Project/resume%20builder/resume-builder-server/src/auth/strategies/jwt.strategy.ts)
- [src/auth/strategies/google.strategy.ts](/D:/Fullstack%20Project/resume%20builder/resume-builder-server/src/auth/strategies/google.strategy.ts)

## Endpoints

### `POST /auth/register`

Registers a new user with email and password.

Flow:

- Checks whether a user with the same email already exists
- Hashes the password with `argon2`
- Creates the user
- Sends a welcome email
- Returns the created user without the password

### `POST /auth/login`

Logs in a user with email and password.

Flow:

- Finds the user by email
- Validates password with `argon2`
- Generates access and refresh tokens
- Stores both tokens in `httpOnly` cookies
- Loads the user's subscription plan
- Returns user data plus `plan`

### `GET /auth/google`

Starts Google OAuth using Passport's `google` strategy.

### `GET /auth/google/callback`

Handles Google OAuth callback.

Flow:

- Gets the Google profile from Passport
- Finds the local user by email
- Creates the user if it does not exist
- Generates access and refresh tokens
- Stores both cookies
- Redirects to the frontend callback route

### `GET /auth/me`

Returns the currently authenticated user.

Behavior:

- Protected with `AuthGuard('jwt')`
- Reads the access token from the `jwt` cookie
- Returns the user loaded by `JwtStrategy`

### `POST /auth/refresh`

Refreshes the session when the access token is expired.

Flow:

- Reads `refreshToken` from cookies
- Verifies it with the refresh-token secret
- Ensures token type is `refresh`
- Loads the user
- Generates a new access token and a new refresh token
- Replaces both cookies
- Returns the user object

### `POST /auth/logout`

Logs out the user by clearing auth cookies.

Behavior:

- Clears `jwt`
- Clears `refreshToken`

## Cookies

### Access Token Cookie

- Cookie name: `jwt`
- Used for protected routes
- Read by `JwtStrategy`
- Intended lifetime in JWT: `15m`
- Set as `httpOnly`

### Refresh Token Cookie

- Cookie name: `refreshToken`
- Used only by `/auth/refresh`
- Intended lifetime in JWT: `30d`
- Set as `httpOnly`

### Cookie Options

Cookies are configured with:

- `httpOnly: true`
- `path: '/'`
- `secure: true` in production
- `sameSite: 'none'` in production
- `sameSite: 'lax'` outside production

## Strategies

### JWT Strategy

Defined in `src/auth/strategies/jwt.strategy.ts`.

Responsibilities:

- Extracts JWT from `req.cookies.jwt`
- Verifies token with `JWT_SECRET`
- Rejects non-access tokens
- Loads the user from the database
- Includes subscription plan in the returned user object

Important note:

- `ignoreExpiration` is `false`
- If the access token is expired, protected routes fail with `401`

### Google Strategy

Defined in `src/auth/strategies/google.strategy.ts`.

Responsibilities:

- Uses Google OAuth credentials from config
- Requests `email` and `profile`
- Builds a normalized user object from the Google profile

## Service Responsibilities

`AuthService` contains the main auth business logic:

- `register()`: create local user and send welcome email
- `login()`: validate credentials and issue cookies
- `googleLogin()`: issue cookies for Google-authenticated users
- `refreshSession()`: validate refresh token and rotate tokens
- `logout()`: clear cookies

## Repository Responsibilities

`AuthRepository` contains lower-level auth helpers:

- Hash password
- Compare password
- Generate access and refresh tokens
- Set auth cookies
- Verify refresh token
- Clear auth cookies

## Current Session Flow

1. User logs in.
2. Backend sets `jwt` and `refreshToken` cookies.
3. Client calls protected routes with cookies automatically.
4. If access token expires, protected route returns `401`.
5. Client calls `POST /auth/refresh`.
6. If refresh token is valid, backend rotates both tokens.
7. Client retries the failed request.
8. If refresh fails, client must treat the user as logged out.

## Expected Client Behavior

- Always send credentials with requests
- Call `/auth/me` on app startup
- If `/auth/me` returns `401`, call `/auth/refresh`
- Retry the failed protected request once after successful refresh
- Clear auth state and redirect to login if refresh fails

## Important Edge Cases

- If access token expires but refresh token is valid, session can be restored
- If refresh token is expired, user must log in again
- If user revisits the app after refresh-token expiry, `/auth/me` and `/auth/refresh` should both fail and the client should show logged-out state

## Notes

- This module uses Passport for auth strategies and guards
- Refresh-token behavior is implemented at the application level, which is normal with `passport-jwt`
- Returned user objects currently include `plan`, even though the shared response type appears to need cleanup for that field
