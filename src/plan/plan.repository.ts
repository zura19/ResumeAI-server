import { Injectable } from '@nestjs/common';
import { Plan, PlanName, Role } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { CreatePlanDto } from './dtos/create-plan.dto';

@Injectable()
export class PlanRepository {
  constructor(private readonly db: DbService) {}

  async getPlans(): Promise<Partial<Plan>[]> {
    return this.db.plan.findMany({
      select: {
        id: true,
        name: true,
        priceMonthly: true,
        recommended: true,
        description: true,
        features: true,
      },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async getPlanByName(name: PlanName): Promise<Plan | null> {
    return this.db.plan.findUnique({
      where: { name },
    });
  }

  async getUserPlanByUserId(userId: string): Promise<{
    role: Role;
    subscription: { plan: { name: PlanName } } | null;
  } | null> {
    return this.db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        subscription: { select: { plan: { select: { name: true } } } },
      },
    });
  }

  async createPlan(body: CreatePlanDto): Promise<Plan> {
    return this.db.plan.create({
      data: {
        name: body.name,
        recommended: body.recommended,
        description: body.description,
        features: body.features,
        detailedDescription: body.detailedDescription,
        additionalFeatures: body.additionalFeatures,
        priceMonthly: body.priceMonthly,
        stripePriceId: body.stripePriceId,
        stripeProductId: body.stripeProductId,
        aiCreditsPerMonth: body.aiCreditsPerMonth,
        totalResumes: body.totalResumes,
      },
    });
  }

  async getExistingPlanNames(planNames: PlanName[]): Promise<PlanName[]> {
    const plans = await this.db.plan.findMany({
      where: { name: { in: planNames } },
      select: { name: true },
    });

    return plans.map(({ name }) => name);
  }

  async updateDefaultPlans(plans: CreatePlanDto[]): Promise<void> {
    await this.db.$transaction(
      plans.map(({ name, ...data }) =>
        this.db.plan.update({
          where: { name },
          data,
        }),
      ),
    );
  }

  async getPlanById(id: string): Promise<Plan | null> {
    return this.db.plan.findUnique({
      where: { id },
    });
  }

  async updatePlan(id: string, body: CreatePlanDto): Promise<Plan> {
    return this.db.plan.update({
      where: { id },
      data: {
        name: body.name,
        recommended: body.recommended,
        description: body.description,
        features: body.features,
        detailedDescription: body.detailedDescription,
        additionalFeatures: body.additionalFeatures,
        priceMonthly: body.priceMonthly,
        stripePriceId: body.stripePriceId,
        stripeProductId: body.stripeProductId,
        aiCreditsPerMonth: body.aiCreditsPerMonth,
        totalResumes: body.totalResumes,
      },
    });
  }
}
