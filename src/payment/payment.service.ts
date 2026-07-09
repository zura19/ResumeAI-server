import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { Payment, User } from '@prisma/client';
import { CheckoutDto } from './dtos/checkout.dto';
import { PlanService } from 'src/plan/plan.service';
import Stripe from 'stripe';
import { UserRepository } from 'src/user/user.repository';

@Injectable()
export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private planService: PlanService,
    private userRepo: UserRepository,
  ) {}
  async createPaymentIntent(user: User, dto: CheckoutDto): Promise<any> {
    try {
      // The free plan is handled through local subscription logic, never
      // through Stripe Checkout.
      if (dto.plan === 'free') {
        throw new BadRequestException(
          'The free plan cannot be purchased through checkout',
        );
      }

      const plan = await this.planService.getPlanByName(dto.plan, user.id);

      // @ts-expect-error plan we added without in type
      if (user.plan === plan.name)
        throw new BadRequestException(`You are already on ${plan.name} plan`);

      let stripeCustomerId = user.stripeCustomerId;
      if (!user.stripeCustomerId) {
        stripeCustomerId = await this.paymentRepo.createStripeCustomer(user.id);
      }

      const session = await this.paymentRepo.createCheckoutSession(
        stripeCustomerId as string,
        plan.stripePriceId,
        {
          planName: plan.name,
          planId: plan.id,
          userId: user.id,
        },
      );

      return { sessionUrl: session.url, sessionId: session.id };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async cancelSubscription(user: User) {
    try {
      // @ts-expect-error plan we added withot in type
      if (user.plan === 'free')
        throw new BadRequestException('You are already on free plan');

      return await this.paymentRepo.cancelSubscription(
        user.id,
        user.stripeCustomerId as string,
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async checkCancelStatus(
    userId: string,
    stripeCustomerId: string | null,
  ): Promise<{ isCanceled: boolean }> {
    try {
      return this.paymentRepo.checkCancelStatus(userId, stripeCustomerId);
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
    paymentStatus: string | null;
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

      // Ownership check: the session must belong to the caller, either by the
      // userId we stored in metadata at checkout or by the Stripe customer id.
      const sessionCustomerId =
        typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id;
      const ownsByMetadata = session.metadata?.userId === user.id;
      const ownsByCustomer =
        !!user.stripeCustomerId &&
        sessionCustomerId === user.stripeCustomerId;

      if (!ownsByMetadata && !ownsByCustomer) {
        throw new ForbiddenException(
          'You do not have access to this checkout session',
        );
      }

      const subscription =
        session.subscription && typeof session.subscription !== 'string'
          ? (session.subscription as Stripe.Subscription)
          : null;
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : subscription?.id;

      const dbPayment = subscriptionId
        ? await this.paymentRepo.findPaymentByStripeSubscriptionId(
            subscriptionId,
          )
        : null;

      // last4 comes from the subscription's default payment method for
      // subscription-mode checkout, not a one-time payment intent.
      const paymentMethod =
        subscription &&
        typeof subscription.default_payment_method !== 'string'
          ? (subscription.default_payment_method as Stripe.PaymentMethod | null)
          : null;
      const last4 = paymentMethod?.card?.last4 ?? null;

      const email = session.customer_details?.email;

      return {
        status: session.payment_status,
        paymentStatus: dbPayment?.status ?? null,
        isProcessed: dbPayment?.status === 'SUCCEEDED',
        total: session.amount_total,
        currency: session.currency,
        last4,
        created: new Date(session.created * 1000), // Stripe uses seconds, JS uses ms
        email,
        user,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Recovery path for when the webhook never provisioned a paid subscription
  // (e.g. the server was down past Stripe's retry window). Pulls the user's
  // active Stripe subscription and runs the same idempotent provisioning the
  // webhook uses, so it is safe to call repeatedly.
  async reconcileSubscription(
    userId: string,
  ): Promise<{ reconciled: boolean; message: string }> {
    try {
      const user = await this.userRepo.getById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.stripeCustomerId) {
        await this.paymentRepo.provisionFreeSubscription(user.id);
        return {
          reconciled: true,
          message: 'No Stripe customer found. User reconciled to free plan',
        };
      }

      const activeSubscription =
        await this.paymentRepo.getActiveStripeSubscription(
          user.stripeCustomerId,
        );
      if (!activeSubscription) {
        await this.paymentRepo.provisionFreeSubscription(user.id);
        return {
          reconciled: true,
          message: 'No active Stripe subscription found. User reconciled to free plan',
        };
      }

      await this.paymentRepo.provisionPaidSubscription(
        user.id,
        activeSubscription.id,
      );

      return {
        reconciled: true,
        message: 'Subscription reconciled',
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
