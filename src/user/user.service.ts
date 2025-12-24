import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { UserRepository } from './user.repository';
import { UserWithoutPassword } from 'src/common/interfaces/user-without-password.interface';
import { ProfileResponseDto } from './dtos/profile-response.dto';
import { generate } from 'rxjs';
import { create } from 'domain';

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

  async canUseAi(id: string) {
    return await this.userRepo.canUseAi(id);
  }

  async getProfileData(id: string): Promise<ProfileResponseDto> {
    const user = await this.userRepo.getById(id);

    if (!user) {
      throw new NotFoundException(`User with id: ${id} not found`);
    }

    const userData = {
      ...user,
      password: undefined,
      aiLastUsedAt: undefined,
      aiUsed: undefined,
    };

    const resumesData = await this.db.resume.findMany({
      where: {
        userId: id,
      },
      include: {
        personalInfo: true,
      },
    });

    const resumes = resumesData.map((resume) => ({
      id: resume.id,
      title: resume.personalInfo?.fullName || '',
      type: resume.type,
      createdAt: resume.createdAt,
    }));

    return { user: userData, resumes: resumes };
  }
}
