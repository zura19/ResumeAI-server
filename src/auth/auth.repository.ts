import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

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

  async generateJwt(
    id: string,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = { sub: id, email };
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwtService.signAsync(payload, {
      secret: secret,
      expiresIn: '30d',
    });
    return { access_token: token };
  }

  signJwt(res: Response, token: string) {
    const nodeEnv = this.config.get('NODE_ENV');
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: nodeEnv === 'prod',
      sameSite: nodeEnv === 'prod' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });
  }

  clearJwt(res: Response) {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: nodeEnv === 'prod',
      sameSite: nodeEnv === 'prod' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }
}
