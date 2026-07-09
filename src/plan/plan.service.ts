import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreatePlanDto } from './dtos/create-plan.dto';
import { Plan, PlanName } from '@prisma/client';
import { DEFAULT_PLANS } from './constants/default-plans';

@Injectable()
export class PlanService {
  constructor(private readonly db: DbService) {}

  async getPlans(): Promise<Partial<Plan>[]> {
    try {
      const plans = await this.db.plan.findMany({
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
      return plans;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getPlanByName(name: PlanName, userId: string) {
    try {
      const plan = await this.db.plan.findUnique({
        where: { name },
      });
      if (!plan) {
        throw new NotFoundException(`Plan with name ${name} not found`);
      }

      const userPlan = await this.db.user.findUnique({
        where: { id: userId },
        include: {
          subscription: { select: { plan: { select: { name: true } } } },
        },
      });

      if (
        userPlan?.subscription?.plan.name === name &&
        userPlan.role === 'user'
      ) {
        throw new BadRequestException(
          `Plan with name: ${name} is already active`,
        );
      }

      return plan;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async createPlan(body: CreatePlanDto): Promise<Plan> {
    try {
      const plan = await this.db.plan.create({
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
      return plan;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateDefaultPlans(): Promise<void> {
    try {
      const planNames = DEFAULT_PLANS.map(({ name }) => name);
      const existingPlans = await this.db.plan.findMany({
        where: { name: { in: planNames } },
        select: { name: true },
      });
      const existingPlanNames = new Set(existingPlans.map(({ name }) => name));
      const missingPlanNames = planNames.filter(
        (name) => !existingPlanNames.has(name),
      );

      if (missingPlanNames.length > 0) {
        throw new NotFoundException(
          `Plans with names ${missingPlanNames.join(', ')} not found`,
        );
      }

      await this.db.$transaction(
        DEFAULT_PLANS.map(({ name, ...data }) =>
          this.db.plan.update({
            where: { name },
            data,
          }),
        ),
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updatePlan(id: string, body: CreatePlanDto): Promise<Plan> {
    try {
      const planToUpdate = await this.db.plan.findUnique({
        where: { id },
      });

      if (!planToUpdate) {
        throw new NotFoundException(`Plan with id ${id} not found`);
      }

      const plan = await this.db.plan.update({
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
      return plan;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
