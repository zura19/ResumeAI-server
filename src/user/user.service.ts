import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { UserRepository } from './user.repository';
import { UserWithoutPassword } from 'src/common/interfaces/user-without-password.interface';

@Injectable()
export class UserService {
  constructor(
    private db: DbService,
    private userRepo: UserRepository,
  ) {}

  async getUser(id: string): Promise<UserWithoutPassword> {
    try {
      const user = await this.userRepo.getById(id);
      if (!user) {
        throw new NotFoundException(`User with id: ${id} not found`);
      }
      return {
        ...user,
        password: undefined,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getAllUser(): Promise<UserWithoutPassword[]> {
    try {
      const users = await this.db.user.findMany();

      return users.map((user) => ({
        ...user,
        password: undefined,
      }));
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
