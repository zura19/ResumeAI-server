import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanName, StripeSubscriptionStatus } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionRepository {
  constructor(private dbService: DbService) {}

  async getSubscriptionByUserId(userId: string) {
    return await this.dbService.subscription.findFirst({
      where: { userId },
    });
  }

  async createSubscription(userId: string, planName: PlanName) {
    const plan = await this.dbService.plan.findUnique({
      where: { name: planName },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const planId = plan.id;
    const sub = await this.dbService.subscription.create({
      data: { userId, planId, status: 'ACTIVE', cancelAtPeriodEnd: false },
      // where: { userId },
      // update: { planId, status: 'ACTIVE', cancelAtPeriodEnd: false },
      include: { plan: { select: { name: true } } },
    });

    return sub.plan.name;
  }

  async updateSubscription(
    userId: string,
    planName: PlanName,
    opts: UpdateSubscriptionDto,
  ) {
    const subscription = await this.getSubscriptionByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const plan = await this.dbService.plan.findUniqueOrThrow({
      where: { name: planName },
    });

    await this.dbService.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: { connect: { id: plan.id } },
        stripeSubscriptionId: opts.stripeSubscriptionId,
        status: opts.status,
        currentPeriodStart: opts.currentPeriodStart,
        currentPeriodEnd: opts.currentPeriodEnd,
        cancelAtPeriodEnd: opts.cancelAtPeriodEnd,
      },
    });
  }
}
