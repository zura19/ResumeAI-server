import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import { UserWithoutPassword } from 'src/common/interfaces/user-without-password.interface';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAllUser(): Promise<
    ApiResponse<{ users: UserWithoutPassword[] | [] }>
  > {
    const users = await this.userService.getAllUser();

    return { success: true, data: { users } };
  }

  @Get('/:id')
  async getUser(
    @Param('id') id: string,
  ): Promise<ApiResponse<{ user: UserWithoutPassword }>> {
    const user = await this.userService.getUser(id);

    return { data: { user } };
  }
}
