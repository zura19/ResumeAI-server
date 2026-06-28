import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { JwtPayload } from './types/jwt-payload.interface';

@Injectable()
export class AuthRepository {
  constructor(
    private db: DbService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async hashPassword(password: string) {
    const hashedPassword = await argon.hash(password);
    return hashedPassword;
  }

  async comparePassword(password: string, hashedPassword: string) {
    const isMatch = await argon.verify(hashedPassword, password);
    return isMatch;
  }

  private getCookieOptions(maxAge: number) {
    const nodeEnv = this.config.get('NODE_ENV');

    return {
      httpOnly: true,
      secure: nodeEnv === 'prod',
      sameSite: nodeEnv === 'prod' ? ('none' as const) : ('lax' as const),
      maxAge,
      path: '/',
    };
  }

  private getAccessSecret() {
    return this.config.get<string>('JWT_SECRET')!;
  }

  private getRefreshSecret() {
    return (
      this.config.get<string>('JWT_REFRESH_SECRET') ??
      this.config.get<string>('JWT_SECRET')!
    );
  }

  async generateTokens(
    id: string,
    email: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const accessPayload: JwtPayload = { sub: id, email, type: 'access' };
    const refreshPayload: JwtPayload = { sub: id, email, type: 'refresh' };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.getAccessSecret(),
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.getRefreshSecret(),
      expiresIn: '30d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  signTokens(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('jwt', accessToken, this.getCookieOptions(1000 * 60 * 30));
    res.cookie(
      'refreshToken',
      refreshToken,
      this.getCookieOptions(1000 * 60 * 60 * 24 * 30),
    );
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.getRefreshSecret(),
      });

      if (payload.type !== 'refresh') {
        throw new ForbiddenException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }

  clearTokens(res: Response) {
    res.clearCookie('jwt', this.getCookieOptions(1000 * 60 * 30));
    res.clearCookie(
      'refreshToken',
      this.getCookieOptions(1000 * 60 * 60 * 24 * 30),
    );
  }
}
