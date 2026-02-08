import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import type { Payment, Plan, User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import { CheckoutDto } from './dtos/checkout.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getPlans(
    @UserDecorator() user: User,
    @Query('limit') limit: string,
  ): Promise<ApiResponse<Payment[]>> {
    const plans = await this.paymentService.getUserPayments(user, limit);
    return { data: plans };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/checkout')
  async createPaymentIntent(
    @UserDecorator() user: User,
    @Body() dto: CheckoutDto,
  ): Promise<ApiResponse<{ sessionUrl: string; sessionId: string }>> {
    const userData = await this.paymentService.createPaymentIntent(user, dto);
    return { data: userData };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/status/:sessionId')
  async getPaymentStatus(
    @Param('sessionId') sessionId: string,
    @UserDecorator() user: User,
  ): Promise<
    ApiResponse<{
      status: string;
      total: number | null;
      currency: string | null;
      last4: string | null;
      created: Date | null;
      email?: string | null;
      isProcessed: boolean;
    }>
  > {
    const paymentDetails = await this.paymentService.checkPaymentStatus(
      sessionId,
      user,
    );
    return { data: paymentDetails };
  }
}
