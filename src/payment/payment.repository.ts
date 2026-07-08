import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, Plan, PlanName } from '@prisma/client';
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

  async cancelSubscription(userId: string, stripeCustomerId: string) {
    const subscription = await this.stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });

    if (subscription.data.length === 0) {
      throw new NotFoundException('No active subscription found');
    }

    const subscriptionId = subscription.data[0].id;

    await this.stripe.subscriptions.cancel(subscriptionId);

    // Reconcile local state immediately instead of relying solely on the
    // customer.subscription.deleted webhook, which may be delayed or dropped.
    // This is an immediate cancellation, so access ends now and the cleared
    // fields/free plan match what the webhook will (idempotently) re-apply.
    const freePlan = await this.db.plan.findUnique({ where: { name: 'free' } });

    await this.db.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { userId },
        data: {
          ...(freePlan ? { plan: { connect: { id: freePlan.id } } } : {}),
          status: 'CANCELED',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          stripeSubscriptionId: null,
          cancelAtPeriodEnd: false,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          aiCreditsThisMonth: 0,
          aiLastUsedAt: null,
          resumesThisMonth: 0,
          resumeLastGeneratedAt: null,
        },
      });
    });
  }

  async checkCancelStatus(
    userId: string,
    stripeCustomerId: string | null,
  ): Promise<{ isCanceled: boolean }> {
    const subscriptions = await this.db.subscription.findUnique({
      where: { userId },
      include: { plan: { select: { name: true } } },
    });

    // No Stripe customer means the user never checked out; report local
    // free/canceled status without calling Stripe.
    if (!stripeCustomerId) {
      const isCanceled =
        !subscriptions ||
        (subscriptions.plan.name === 'free' &&
          !subscriptions.currentPeriodEnd);
      return { isCanceled };
    }

    const stripeActiveSubscription = await this.stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });

    // An active Stripe subscription means cancellation has not completed yet.
    if (stripeActiveSubscription.data.length > 0) {
      return { isCanceled: false };
    }

    const isCanceled =
      subscriptions?.plan.name === 'free' &&
      subscriptions.status === 'CANCELED' &&
      !subscriptions.currentPeriodEnd;

    return { isCanceled };
  }

  async retrieveSession(
    stripeSessionId: string,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    // mode: 'subscription' sessions expose the subscription/invoice path, not a
    // direct payment_intent. Expand the subscription and its default payment
    // method so we can read the card last4 reliably.
    const session = await this.stripe.checkout.sessions.retrieve(
      stripeSessionId,
      { expand: ['subscription.default_payment_method'] },
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

  async getActiveStripeSubscription(
    stripeCustomerId: string,
  ): Promise<Stripe.Subscription | null> {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });
    return subscriptions.data[0] ?? null;
  }

  async provisionFreeSubscription(userId: string): Promise<void> {
    const freePlan = await this.db.plan.findUnique({ where: { name: 'free' } });
    if (!freePlan) {
      throw new NotFoundException('Free plan not found');
    }

    await this.db.$transaction(async (tx) => {
      await tx.subscription.upsert({
        where: { userId },
        update: {
          plan: { connect: { id: freePlan.id } },
          status: 'ACTIVE',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          stripeSubscriptionId: null,
          cancelAtPeriodEnd: false,
        },
        create: {
          user: { connect: { id: userId } },
          plan: { connect: { id: freePlan.id } },
          status: 'ACTIVE',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          stripeSubscriptionId: null,
          cancelAtPeriodEnd: false,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          aiCreditsThisMonth: 0,
          aiLastUsedAt: null,
          resumesThisMonth: 0,
          resumeLastGeneratedAt: null,
        },
      });
    });
  }

  // Idempotent provisioning shared by the webhook (fast path) and the manual
  // reconcile endpoint (recovery path). Safe to run repeatedly: it re-affirms
  // ACTIVE state and only resets monthly counters when the billing period
  // actually changes, so it cannot be abused to reset AI credits on demand.
  async provisionPaidSubscription(
    userId: string,
    stripeSubscriptionId: string,
  ): Promise<{ plan: Plan; currentPeriodEnd: Date; amount: number }> {
    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      stripeSubscriptionId,
      { expand: ['items.data.price', 'latest_invoice'] },
    );

    const priceId = stripeSubscription.items.data[0].price.id;
    const plan = await this.db.plan.findFirst({
      where: { stripePriceId: priceId },
    });
    if (!plan) {
      throw new NotFoundException(`Plan not found for priceId: ${priceId}`);
    }

    const { start, end } = this.getCurrentPeriod(stripeSubscription);

    const latestInvoice =
      stripeSubscription.latest_invoice as Stripe.Invoice | null;
    const invoiceId = latestInvoice?.id as string;
    const currency = (latestInvoice?.currency ?? 'usd') as string;
    const amount = (latestInvoice?.amount_paid ??
      latestInvoice?.amount_due ??
      0) as number;

    await this.db.$transaction(async (tx) => {
      const existing = await tx.subscription.findUnique({ where: { userId } });
      const isNewPeriod =
        !existing?.currentPeriodStart ||
        existing.currentPeriodStart.getTime() !== start.getTime();

      await tx.subscription.update({
        where: { userId },
        data: {
          plan: { connect: { id: plan.id } },
          status: 'ACTIVE',
          stripeSubscriptionId,
          currentPeriodStart: start,
          currentPeriodEnd: end,
          cancelAtPeriodEnd: false,
        },
      });

      await tx.payment.upsert({
        where: { stripeSubscriptionId },
        update: { status: 'SUCCEEDED', invoice: invoiceId, currency, amount },
        create: {
          user: { connect: { id: userId } },
          invoice: invoiceId,
          stripeSubscriptionId,
          currency,
          status: 'SUCCEEDED',
          amount,
        },
      });

      // Only reset plan-period counters when a new billing period starts.
      if (isNewPeriod) {
        await tx.user.update({
          where: { id: userId },
          data: {
            aiCreditsThisMonth: 0,
            aiLastUsedAt: new Date(),
            resumesThisMonth: 0,
            resumeLastGeneratedAt: null,
          },
        });
      }
    });

    return { plan, currentPeriodEnd: end, amount };
  }

  // Reads the current billing period. Newer Stripe API versions expose
  // current_period_start/end on the subscription item, older ones on the
  // subscription root, so fall back across both shapes.
  private getCurrentPeriod(subscription: Stripe.Subscription): {
    start: Date;
    end: Date;
  } {
    const item = subscription.items.data[0] as unknown as {
      current_period_start?: number;
      current_period_end?: number;
    };
    const root = subscription as unknown as {
      current_period_start?: number;
      current_period_end?: number;
    };

    const start = item?.current_period_start ?? root?.current_period_start;
    const end = item?.current_period_end ?? root?.current_period_end;

    return {
      start: new Date((start as number) * 1000),
      end: new Date((end as number) * 1000),
    };
  }
}
