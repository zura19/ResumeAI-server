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
import { type Response } from 'express';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ user: UserWithoutPassword }>> {
    const user = await this.authService.login(body, res);
    return { data: { user }, message: 'Login successful' };
  }

  @Post('register')
  async register(
    @Body() body: RegisterDto,
  ): Promise<ApiResponse<{ user: UserWithoutPassword }>> {
    const user = await this.authService.register(body);
    return { data: { user }, message: 'Registration successful' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    return { message: 'Google authentication' };
  }

  @Get('google/callback')
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

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    this.authService.logout(res);
    return { data: { message: 'Logout successful' } };
  }
}
