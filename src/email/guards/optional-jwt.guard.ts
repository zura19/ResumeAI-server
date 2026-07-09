import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(
    error: unknown,
    user: TUser | false | null,
  ): TUser | null {
    if (error) {
      throw error;
    }

    return user || null;
  }
}
