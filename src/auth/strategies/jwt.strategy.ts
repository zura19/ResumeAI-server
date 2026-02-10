import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DbService } from 'src/db/db.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private db: DbService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.jwt;
        },
      ]),

      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      include: {
        subscription: { select: { plan: { select: { name: true } } } },
      },
    });

    if (!user) return null;
    return {
      ...user,
      plan: user.subscription?.plan.name,
      password: undefined,
      subscription: undefined,
    };
  }
}
