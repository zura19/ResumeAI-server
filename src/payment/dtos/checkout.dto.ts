import { PlanName } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class CheckoutDto {
  @IsEnum(PlanName)
  @IsNotEmpty()
  plan: PlanName;
}
