import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, PlanName } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentRepository {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private db: DbService,
  ) {
    this.stripe = new Stripe(configService.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2026-01-28.clover',
    });
  }

  async getUserPayments(userId: string, limit: number) {
    return this.db.payment.findMany({
      where: { userId: userId },
      take: limit || 5,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPayment(data: {
    userId: string;
    stripePaymentIntentId: string;
    currency: string;
    status: PaymentStatus;
    planName: string;
    amount: number;
  }) {
    const payment = await this.db.payment.create({
      data: {
        userId: data.userId,
        invoice: data.planName,
        stripeSubscriptionId: data.stripePaymentIntentId,
        currency: data.currency,
        status: data.status,
        amount: data.amount,
      },
    });
  }

  async createStripeCustomer(userId: string): Promise<string> {
    const customer = await this.stripe.customers.create({
      metadata: {
        userId,
      },
    });

    const user = await this.db.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    return customer.id;
  }

  async createCheckoutSession(
    stripeCustomerId: string,
    priceId: string,
    metadata: {
      planName: PlanName;
      planId: string;
      userId: string;
    },
  ) {
    const clientUrl = this.configService.get('CLIENT_URL');
    const { planName, planId, userId } = metadata;

    const subscription = await this.stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });

    if (subscription.data.length > 0) {
      throw new BadRequestException(
        'User already has an active subscription. Please cancel it before creating a new one.',
      );
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        planName,
        planId,
        userId,
      },
      success_url: `${clientUrl}/checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/checkout/cancel`,
    });

    return session;
  }

  async cancelSubscription(stripeCustomerId: string) {
    const subscription = await this.stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });

    if (subscription.data.length === 0) {
      throw new NotFoundException('No active subscription found');
    }

    const subscriptionId = subscription.data[0].id;

    const result = await this.stripe.subscriptions.cancel(subscriptionId);
  }

  async checkCancelStatus(
    userId: string,
    stripeCustomerId: string,
  ): Promise<{ allowCancel: boolean }> {
    const stripeActiveSubscription = await this.stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });

    console.log(stripeActiveSubscription.data.length);

    if (stripeActiveSubscription.data.length > 0) {
      return { allowCancel: false };
    }

    const subscriptions = await this.db.subscription.findUnique({
      where: { userId },
      include: { plan: { select: { name: true } } },
    });

    const allowCancel =
      subscriptions?.plan.name === 'free' &&
      subscriptions.status === 'CANCELED' &&
      !subscriptions.currentPeriodEnd;

    return { allowCancel };
  }

  async retrieveSession(
    stripeSessionId: string,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    const session = await this.stripe.checkout.sessions.retrieve(
      stripeSessionId,
      { expand: ['payment_intent'] },
    );
    return session;
  }

  async findPaymentByStripeSubscriptionId(id: string) {
    const payment = await this.db.payment.findUnique({
      where: {
        stripeSubscriptionId: id,
      },
    });
    return payment;
  }
}
