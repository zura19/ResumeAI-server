import { Injectable } from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { TotalsResponseDto } from './dtos/totals-response.dto';
import { Payment } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private adminRepo: AdminRepository) {}

  async countSubscriptions(): Promise<{
    free: number;
    pro: number;
    enterprise: number;
  }> {
    try {
      const [free, pro, enterprise] = await Promise.all([
        this.adminRepo.countSubscriptionsByPlanName('free'),
        this.adminRepo.countSubscriptionsByPlanName('pro'),
        this.adminRepo.countSubscriptionsByPlanName('enterprise'),
      ]);

      return {
        free,
        pro,
        enterprise,
      };
    } catch (error) {
      console.error('Error counting users by plan:', error);
      throw error;
    }
  }

  async getTotals(): Promise<TotalsResponseDto> {
    try {
      const [
        users,
        subscriptions,
        monthlyRevenue,
        generatedResumes,
        totalAiCreditsUsed,
      ] = await Promise.all([
        this.adminRepo.countTotalUsers(),
        this.adminRepo.countTotalSubscriptions(),
        this.adminRepo.monthlyRevenue(),
        this.adminRepo.countGeneratedResumes(),
        this.adminRepo.countTotalAiCreditsUsed(),
      ]);

      return {
        users,
        subscriptions,
        monthlyRevenue,
        generatedResumes,
        totalAiCreditsUsed,
      };
    } catch (error) {
      console.error('Error counting total users:', error);
      throw error;
    }
  }

  async getPayments(
    query: any,
  ): Promise<{ payments: Payment[]; hasMore: boolean }> {
    const limit = query.limit ? parseInt(query.limit) : 10;
    const lastId = query.lastId || null;
    try {
      const payments = await this.adminRepo.getPayments(limit, lastId);
      return { payments, hasMore: payments.length === limit };
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async getUsers(query: any): Promise<{ users: any[]; hasMore: boolean }> {
    try {
      const limit = query.limit ? parseInt(query.limit) : 10;
      const lastId = query.lastId || null;
      const users = await this.adminRepo.getUsers(limit, lastId);
      return { users, hasMore: users.length === limit };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
}
