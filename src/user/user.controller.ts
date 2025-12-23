import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import { UserWithoutPassword } from 'src/common/interfaces/user-without-password.interface';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import { type User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

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

  @Get('/:id')
  async getUser(
    @Param('id') id: string,
  ): Promise<ApiResponse<{ user: UserWithoutPassword }>> {
    const user = await this.userService.getUser(id);

    return { data: { user } };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('ai/can-use-ai')
  async canUseAi(@UserDecorator() user: User): Promise<ApiResponse<any>> {
    const data = await this.userService.canUseAi(user.id);
    return { data };
  }
}
