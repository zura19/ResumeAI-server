import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { minutes, seconds, Throttle } from '@nestjs/throttler';
import { PaymentService } from './payment.service';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import type { Payment, User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import { CheckoutDto } from './dtos/checkout.dto';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { PaymentStatusResponseDto } from './dtos/payment-status-response.dto';

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
  @Throttle({
    default: { limit: 5, ttl: minutes(1), blockDuration: seconds(30) },
  })
  async createPaymentIntent(
    @UserDecorator() user: User,
    @Body() dto: CheckoutDto,
  ): Promise<ApiResponse<{ sessionUrl: string; sessionId: string }>> {
    const userData = await this.paymentService.createPaymentIntent(user, dto);
    return { data: userData };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/cancel')
  @Throttle({
    default: { limit: 3, ttl: minutes(5), blockDuration: seconds(30) },
  })
  async cancelSubscription(
    @UserDecorator() user: User,
  ): Promise<ApiResponse<boolean>> {
    await this.paymentService.cancelSubscription(user);
    return { data: true, message: 'First stage of cancellation completed...' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/status/:sessionId')
  @Throttle({
    default: { limit: 30, ttl: minutes(1), blockDuration: seconds(30) },
  })
  async getPaymentStatus(
    @Param('sessionId') sessionId: string,
    @UserDecorator() user: User,
  ): Promise<ApiResponse<PaymentStatusResponseDto>> {
    const paymentDetails = await this.paymentService.checkPaymentStatus(
      sessionId,
      user,
    );
    return { data: paymentDetails };
  }

  @UseGuards(JwtGuard, AdminGuard)
  @Post('/reconcile/:userId')
  @Throttle({
    default: { limit: 5, ttl: minutes(1), blockDuration: seconds(30) },
  })
  async reconcileSubscription(
    @Param('userId') userId: string,
  ): Promise<ApiResponse<{ reconciled: boolean; message: string }>> {
    const result = await this.paymentService.reconcileSubscription(userId);
    return { data: result, message: result.message };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/cancel/status')
  async getCancelStatus(
    @UserDecorator() user: User,
  ): Promise<ApiResponse<{ isCanceled: boolean; user: User }>> {
    const data = await this.paymentService.checkCancelStatus(
      user.id,
      user.stripeCustomerId,
    );
    return { data: { ...data, user } };
  }
}
