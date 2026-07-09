import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePlanDto } from './dtos/create-plan.dto';
import { Plan, PlanName } from '@prisma/client';
import { DEFAULT_PLANS } from './constants/default-plans';
import { PlanRepository } from './plan.repository';

@Injectable()
export class PlanService {
  constructor(private readonly planRepo: PlanRepository) {}

  async getPlans(): Promise<Partial<Plan>[]> {
    try {
      const plans = await this.planRepo.getPlans();
      return plans;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getPlanByName(name: PlanName, userId: string) {
    try {
      const plan = await this.planRepo.getPlanByName(name);
      if (!plan) {
        throw new NotFoundException(`Plan with name ${name} not found`);
      }

      const userPlan = await this.planRepo.getUserPlanByUserId(userId);

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
      const plan = await this.planRepo.createPlan(body);
      return plan;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateDefaultPlans(): Promise<void> {
    try {
      const planNames = DEFAULT_PLANS.map(({ name }) => name);
      const existingPlanNames = new Set(
        await this.planRepo.getExistingPlanNames(planNames),
      );
      const missingPlanNames = planNames.filter(
        (name) => !existingPlanNames.has(name),
      );

      if (missingPlanNames.length > 0) {
        throw new NotFoundException(
          `Plans with names ${missingPlanNames.join(', ')} not found`,
        );
      }

      await this.planRepo.updateDefaultPlans(DEFAULT_PLANS);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updatePlan(id: string, body: CreatePlanDto): Promise<Plan> {
    try {
      const planToUpdate = await this.planRepo.getPlanById(id);

      if (!planToUpdate) {
        throw new NotFoundException(`Plan with id ${id} not found`);
      }

      const plan = await this.planRepo.updatePlan(id, body);
      return plan;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
