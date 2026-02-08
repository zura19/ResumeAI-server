// create-plan.dto.ts
import {
  IsString,
  IsBoolean,
  IsArray,
  IsInt,
  IsEnum,
  IsOptional,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { PlanName } from '@prisma/client';

export class CreatePlanDto {
  @IsEnum(PlanName)
  name: PlanName;

  @IsBoolean()
  @IsOptional()
  recommended?: boolean;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsString()
  detailedDescription: string;

  @IsArray()
  @IsString({ each: true })
  additionalFeatures: string[];

  @IsInt()
  @Min(0)
  priceMonthly: number;

  @IsString()
  @IsNotEmpty()
  stripePriceId: string;

  @IsString()
  @IsNotEmpty()
  stripeProductId: string;
}
