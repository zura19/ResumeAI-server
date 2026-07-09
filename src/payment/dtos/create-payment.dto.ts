import { PaymentStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  stripeSubscriptionId: string;

  @IsString()
  @IsNotEmpty()
  invoice: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  status: PaymentStatus;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
