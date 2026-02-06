import { StripeSubscriptionStatus } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  stripeSubscriptionId: string;

  @IsDateString()
  @IsNotEmpty()
  currentPeriodStart: Date;

  @IsDateString()
  @IsNotEmpty()
  currentPeriodEnd: Date;

  @IsBoolean()
  @IsOptional()
  cancelAtPeriodEnd?: boolean;

  @IsEnum(StripeSubscriptionStatus)
  @IsNotEmpty()
  status: StripeSubscriptionStatus;
}
