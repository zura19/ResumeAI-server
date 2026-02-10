import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreatePlanDto } from './dtos/create-plan.dto';
import { Plan, PlanName } from '@prisma/client';

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
        },
      });
      return plan;
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
