import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { Plan, User } from '@prisma/client';
import { CheckoutDto } from './dtos/checkout.dto';
import { PlanService } from 'src/plan/plan.service';

@Injectable()
export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private planService: PlanService,
  ) {}
  async createPaymentIntent(user: User, dto: CheckoutDto): Promise<any> {
    try {
      const plan = await this.planService.getPlanByName(dto.plan);

      let stripeCustomerId = user.stripeCustomerId;
      if (!user.stripeCustomerId) {
        stripeCustomerId = await this.paymentRepo.createStripeCustomer(user.id);
      }

      const session = await this.paymentRepo.createCheckoutSession(
        stripeCustomerId as string,
        plan.priceMonthly,
        plan.name,
      );

      //   return { url: 'test', sessionId: 'test', user };
      return { sessionUrl: session.url, sessionId: session.id };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
