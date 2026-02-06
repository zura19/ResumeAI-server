import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import type { Plan, User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import { CheckoutDto } from './dtos/checkout.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('/checkout')
  async createPaymentIntent(
    @UserDecorator() user: User,
    @Body() dto: CheckoutDto,
  ): Promise<ApiResponse<{ sessionUrl: string; sessionId: string }>> {
    const userData = await this.paymentService.createPaymentIntent(user, dto);
    return { data: userData };
  }
}
