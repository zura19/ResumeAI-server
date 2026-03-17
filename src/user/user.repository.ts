import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlanName, Subscription, User } from '@prisma/client';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import { isSameDay } from 'src/common/lib/isSameDay';
import { DbService } from 'src/db/db.service';

@Injectable()
export class UserRepository {
  constructor(private db: DbService) {}

  async getAll() {
    return this.db.user.findMany();
  }

  async getById(id: string) {
    return this.db.user.findUnique({
      where: {
        id,
      },
    });
  }

  async findByEmail(email: string) {
    const user = await this.db.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  }

  async getUserPlanByUserId(userId: string) {
    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        subscription: { select: { plan: { select: { name: true } } } },
      },
    });

    return user?.subscription?.plan.name;
  }
  async create(
    data: RegisterDto,
    type: 'credentials' | 'google' = 'credentials',
  ): Promise<{ user: User }> {
    const transaction = await this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: type === 'credentials' ? data : { ...data, password: undefined },
      });

      if (!user) throw new BadRequestException('User can not created');

      const plan = await tx.plan.findUnique({
        where: { name: 'free' },
      });

      if (!plan) throw new NotFoundException('Plan not found');

      // Check if subscription already exists for this user
      let subscription = await tx.subscription.findUnique({
        where: { userId: user.id }, // Assuming userId is unique
        include: { plan: { select: { name: true } } },
      });

      if (!subscription) {
        subscription = await tx.subscription.create({
          data: {
            status: 'ACTIVE',
            cancelAtPeriodEnd: false,
            user: { connect: { id: user.id } },
            plan: { connect: { id: plan.id } },
          },
          include: { plan: { select: { name: true } } },
        });
      }
      const userWithPlan = {
        ...user,
        plan: subscription.plan.name,
      };

      return { user: userWithPlan };
    });

    return transaction;
  }

  async canUseAi(id: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: { select: { aiCreditsPerMonth: true } },
          },
        },
      },
    });

    const limit = user?.subscription?.plan.aiCreditsPerMonth;
    if (!user || !limit) return false;

    if (user.aiCreditsThisMonth >= limit) return false;

    return true;
  }

  async canGenerateAI(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      include: {
        resumes: { select: { id: true } },
        subscription: {
          include: {
            plan: { select: { totalResumes: true } },
          },
        },
      },
    });
    const limit = user?.subscription?.plan.totalResumes;

    if (!user || !limit) return false;
    if (user.resumes.length >= limit) return false;

    return true;
  }

  async addAiCredits(id: string, amount: number = 1) {
    return this.db.user.update({
      where: { id },
      data: {
        aiCreditsThisMonth: { increment: amount },
        aiCreditsTotal: { increment: amount },
        aiLastUsedAt: new Date(),
      },
    });
  }
}
