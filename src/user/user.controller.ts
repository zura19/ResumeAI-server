import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import { UserWithoutPassword } from 'src/common/interfaces/user-without-password.interface';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import { type User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { ProfileResponseDto } from './dtos/profile-response.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAllUser(): Promise<
    ApiResponse<{ users: UserWithoutPassword[] | [] }>
  > {
    const users = await this.userService.getAllUser();

    return { data: { users } };
  }

  @Get('id/:id')
  async getUser(
    @Param('id') id: string,
  ): Promise<ApiResponse<{ user: UserWithoutPassword }>> {
    const user = await this.userService.getUser(id);

    return { data: { user } };
  }

  @Get('/profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(
    @UserDecorator() user: User,
  ): Promise<ApiResponse<ProfileResponseDto>> {
    const data = await this.userService.getProfileData(user.id);
    return { data };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('ai/can-use-ai')
  async canUseAi(@UserDecorator() user: User): Promise<ApiResponse<any>> {
    const data = await this.userService.canUseAi(user.id);
    return { data };
  }
}
