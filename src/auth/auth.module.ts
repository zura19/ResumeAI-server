import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { AuthRepository } from './auth.repository';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategies/google.strategy';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  imports: [
    JwtModule.register({}),
    // PassportModule.register({ defaultStrategy: 'jwt' }),
    UserModule,
    SubscriptionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy, GoogleStrategy],
})
export class AuthModule {}
