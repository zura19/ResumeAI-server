import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { UserRepository } from './user.repository';
import { UserWithoutPassword } from 'src/common/interfaces/user-without-password.interface';
import { ProfileResponseDto } from './dtos/profile-response.dto';
import { User } from '@prisma/client';

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

  async getProfileData(user: User): Promise<ProfileResponseDto> {
    const id = user.id;

    const userData = {
      ...user,
      password: undefined,
    };

    const [resumesData, userTotalTransactions] = await Promise.all([
      await this.db.resume.findMany({
        where: {
          userId: id,
        },
        include: {
          personalInfo: true,
        },
      }),
      await this.db.payment.aggregate({
        where: {
          userId: id,
          status: 'SUCCEEDED',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);
    const resumes = resumesData.map((resume) => ({
      id: resume.id,
      title: resume.personalInfo?.fullName || '',
      type: resume.type,
      createdAt: resume.createdAt,
    }));

    const totals = {
      totalResumes: +resumes.length,
      totalAiCredits: +user.aiCreditsTotal,
      totalTransactions: Number(userTotalTransactions._sum.amount),
    };

    return { user: userData, resumes: resumes, totals };
  }
}
