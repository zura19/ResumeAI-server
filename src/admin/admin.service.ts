import { Injectable } from '@nestjs/common';
import { AdminRepository } from './admin.repository';

@Injectable()
export class AdminService {
  constructor(private adminRepo: AdminRepository) {}

  async countSubscriptions(): Promise<{
    free: number;
    pro: number;
    enterprise: number;
  }> {
    try {
      const free = await this.adminRepo.countSubscriptionsByPlanName('free');
      const pro = await this.adminRepo.countSubscriptionsByPlanName('pro');
      const enterprise =
        await this.adminRepo.countSubscriptionsByPlanName('enterprise');

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
}
