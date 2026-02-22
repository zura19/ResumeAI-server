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
}
