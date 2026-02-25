import { Injectable } from '@nestjs/common';
import { PlanName } from '@prisma/client';
import { DbService } from 'src/db/db.service';

@Injectable()
export class AdminRepository {
  constructor(private db: DbService) {}

  async countSubscriptionsByPlanName(plan: PlanName): Promise<number> {
    const result = await this.db.subscription.count({
      where: {
        plan: { name: plan },
      },
    });
    return result;
  }

  async countTotalUsers(): Promise<{
    total: number;
    thisMonth: number;
    lastMonth: number;
  }> {
    const [total, thisMonth, lastMonth] = await Promise.all([
      this.db.user.count(),
      this.db.user.count(this.countThisMonth()),
      this.db.user.count(this.countLastMonth()),
    ]);

    return {
      total,
      thisMonth,
      lastMonth,
    };
  }

  async countTotalSubscriptions(): Promise<{
    total: number;
    thisMonth: number;
    lastMonth: number;
  }> {
    const [result, thisMonth, lastMonth] = await Promise.all([
      this.db.subscription.count({
        where: {
          plan: { name: { in: ['pro', 'enterprise'] } },
          status: 'ACTIVE',
        },
      }),
      this.db.subscription.count(this.countThisMonth()),
      this.db.subscription.count(this.countLastMonth()),
    ]);

    return {
      total: result,
      thisMonth,
      lastMonth,
    };
  }
  async monthlyRevenue(): Promise<number> {
    const val = await this.db.payment.aggregate({
      where: {
        status: 'SUCCEEDED',
      },
      _sum: {
        amount: true,
      },
    });
    return val._sum.amount || 0;
  }

  async countGeneratedResumes(): Promise<{
    total: number;
    thisMonth: number;
    lastMonth: number;
  }> {
    const [result, thisMonth, lastMonth] = await Promise.all([
      this.db.resume.count(),
      this.db.resume.count(this.countThisMonth()),
      this.db.resume.count(this.countLastMonth()),
    ]);

    return {
      total: result,
      thisMonth,
      lastMonth,
    };
  }

  async countTotalAiCreditsUsed(): Promise<number> {
    const result = await this.db.user.aggregate({
      _sum: {
        aiCreditsTotal: true,
      },
    });
    return result._sum.aiCreditsTotal || 0;
  }

  countThisMonth(): { where: { createdAt: { gte: Date; lt: Date } } } {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      where: {
        createdAt: {
          gte: startOfThisMonth,
          lt: startOfNextMonth,
        },
      },
    };
  }

  countLastMonth(): { where: { createdAt: { gte: Date; lt: Date } } } {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lt: startOfThisMonth,
        },
      },
    };
  }

  async getPayments(limit: number = 10, lastId: string | null = null) {
    return this.db.payment.findMany({
      where: {
        status: 'SUCCEEDED',
      },
      cursor: lastId ? { id: lastId } : undefined,
      skip: lastId ? 1 : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      take: limit,
    });
  }

  async getUsers(limit: number = 10, lastId: string | null = null) {
    return this.db.user.findMany({
      cursor: lastId ? { id: lastId } : undefined,
      skip: lastId ? 1 : undefined,
      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        aiCreditsThisMonth: true,
        createdAt: true,
        resumes: {
          select: { id: true },
        },
        subscription: {
          select: {
            status: true,
            plan: {
              select: {
                name: true,
                totalResumes: true,
                aiCreditsPerMonth: true,
              },
            },
          },
        },
      },
      take: limit,
    });
  }
}
