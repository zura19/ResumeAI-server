import { IsEnum } from 'class-validator';
import { PlanName } from '@prisma/client';

export class GetPlanByNameDto {
  @IsEnum(PlanName, { message: 'Invalid plan name' })
  name: PlanName;
}
