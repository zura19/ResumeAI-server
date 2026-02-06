import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreatePlanDto } from './dtos/create-plan.dto';
import { PlanService } from './plan.service';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import { Plan, PlanName } from '@prisma/client';
import { GetPlanByNameDto } from './dtos/get-plan.dto';

@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  async getPlans(): Promise<ApiResponse<Partial<Plan>[]>> {
    const plan = await this.planService.getPlans();
    return { data: plan };
  }

  @Post()
  async createPlan(@Body() body: CreatePlanDto): Promise<ApiResponse<Plan>> {
    const plan = await this.planService.createPlan(body);
    return { data: plan };
  }

  @Put('/:id')
  async updatePlan(
    @Param('id') id: string,
    @Body() body: CreatePlanDto,
  ): Promise<ApiResponse<Plan>> {
    const plan = await this.planService.updatePlan(id, body);
    return { data: plan };
  }

  @Get('/:name')
  async getPlanByName(
    @Param() param: GetPlanByNameDto,
  ): Promise<ApiResponse<Plan>> {
    const plan = await this.planService.getPlanByName(param.name);
    return { data: plan };
  }
}
