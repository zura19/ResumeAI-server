import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CreatePlanDto } from './dtos/create-plan.dto';
import { PlanService } from './plan.service';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import type { Plan, PlanName, User } from '@prisma/client';
import { GetPlanByNameDto } from './dtos/get-plan.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserDecorator } from 'src/common/decorators/user.decorator';

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

  @UseGuards(AuthGuard('jwt'))
  @Get('/:name')
  async getPlanByName(
    @Param() param: GetPlanByNameDto,
    @UserDecorator() user: User,
  ): Promise<ApiResponse<Plan>> {
    const plan = await this.planService.getPlanByName(param.name, user.id);
    return { data: plan };
  }
}
