import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { Payment, Plan, User } from '@prisma/client';
import { CheckoutDto } from './dtos/checkout.dto';
import { PlanService } from 'src/plan/plan.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private planService: PlanService,
  ) {}
  async createPaymentIntent(user: User, dto: CheckoutDto): Promise<any> {
    try {
      const plan = await this.planService.getPlanByName(dto.plan, user.id);

      let stripeCustomerId = user.stripeCustomerId;
      if (!user.stripeCustomerId) {
        stripeCustomerId = await this.paymentRepo.createStripeCustomer(user.id);
      }

      const session = await this.paymentRepo.createCheckoutSession(
        stripeCustomerId as string,
        plan.stripePriceId,
        plan.name,
        plan.id,
        user.id,
      );

      //   return { url: 'test', sessionId: 'test', user };
      return { sessionUrl: session.url, sessionId: session.id };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async checkPaymentStatus(
    stripeSessionId: string,
    user: User,
  ): Promise<{
    status: string;
    total: number | null;
    currency: string | null;
    last4: string | null;
    created: Date | null;
    email?: string | null;
    isProcessed: boolean;
    user: User;
  }> {
    try {
      const session = await this.paymentRepo.retrieveSession(stripeSessionId);

      const paymentIntent = session.payment_intent as Stripe.PaymentIntent;

      const dbPayment = await this.paymentRepo.findPaymentIntentByIntentId(
        session.subscription as string,
      );

      console.log(dbPayment);
      // Note: For subscriptions, you might need to look at session.setup_intent
      // or the latest_invoice. We'll stick to the most common way below:

      const paymentMethod = paymentIntent?.payment_method_types[0]; // e.g., 'card'

      // To get the last 4 digits, we usually look at the charges
      // This is a bit deep in the Stripe object:
      const last4 = paymentIntent?.payment_details?.customer_reference;

      const email = session.customer_details?.email;

      return {
        status: session.payment_status,
        isProcessed: !!dbPayment,
        total: session.amount_total,
        currency: session.currency,
        last4: last4 || '****',
        created: new Date(session.created * 1000), // Stripe uses seconds, JS uses ms
        email,
        user,
        // paymentId: dbPayment?.id || 'Pending...', // Your internal DB ID
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getUserPayments(user: User, limit: string): Promise<Payment[]> {
    try {
      const limitInt = parseInt(limit);
      console.log(limitInt);
      const payment = await this.paymentRepo.getUserPayments(
        user.id,
        limitInt || 5,
      );
      return payment;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
