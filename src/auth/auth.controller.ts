import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import { UserWithoutPassword } from 'src/common/interfaces/user-without-password.interface';
import { LoginDto } from './dtos/login.dto';
import { type Request, type Response } from 'express';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { hours, minutes, Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({
    default: { limit: 5, ttl: minutes(1), blockDuration: minutes(5) },
  })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.login(body, res);
    return { data: { user }, message: 'Login successful' };
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: hours(1), blockDuration: hours(1) } })
  async register(
    @Body() body: RegisterDto,
  ): Promise<ApiResponse<{ user: UserWithoutPassword }>> {
    const user = await this.authService.register(body);
    return { data: { user }, message: 'Registration successful' };
  }

  @Get('google')
  @Throttle({
    default: { limit: 10, ttl: minutes(1), blockDuration: minutes(5) },
  })
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    return { message: 'Google authentication' };
  }

  @Get('google/callback')
  @Throttle({
    default: { limit: 20, ttl: minutes(1), blockDuration: minutes(5) },
  })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const user = await this.authService.googleLogin(req);

    return res.redirect(process.env.CLIENT_URL! + '/google/callback');
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/me')
  async getMe(
    @UserDecorator() user,
  ): Promise<ApiResponse<{ user: UserWithoutPassword }>> {
    return { data: { user } };
  }

  @Post('refresh')
  @Throttle({
    default: { limit: 20, ttl: minutes(1), blockDuration: minutes(5) },
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.refreshSession(req, res);
    return { data: { user }, message: 'Session refreshed' };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    this.authService.logout(res);
    return { data: { message: 'Logout successful' } };
  }
}
