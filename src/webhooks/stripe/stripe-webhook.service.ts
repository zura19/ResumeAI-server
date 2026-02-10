import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentStatus,
  PlanName,
  StripeSubscriptionStatus,
} from '@prisma/client';
import { Request } from 'express';
import { DbService } from 'src/db/db.service';
import { PaymentRepository } from 'src/payment/payment.repository';
import { SubscriptionRepository } from 'src/subscription/subcscription.repository';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    private subscriptionRepo: SubscriptionRepository,
    private paymentRepo: PaymentRepository,
    private db: DbService,
  ) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2026-01-28.clover',
    });
  }

  async handle(payload: Buffer, signature: string) {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.get('STRIPE_WEBHOOK_SECRET')!,
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
    }

    return { received: true };
  }

  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    try {
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        stripeSubscriptionId,
        { expand: ['latest_invoice.payment_intent'] },
      );

      const latestInvoice = stripeSubscription.latest_invoice as Stripe.Invoice;

      const startDate = new Date(stripeSubscription.start_date * 1000);
      const endDate = this.calculateSubscriptionEndDate(
        stripeSubscription.start_date,
        // @ts-expect-error stripeSubscription
        stripeSubscription?.plan?.interval,
        // @ts-expect-error stripeSubscription
        stripeSubscription?.plan?.interval_count,
      );
      const planId = session.metadata?.planId as string;

      const user = await this.db.user.findFirst({
        where: { stripeCustomerId },
      });

      if (!user) throw new NotFoundException('User not found');

      await this.db.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { userId: user.id },
          data: {
            status: 'TRIALING',
          },
        });

        await tx.payment.create({
          data: {
            user: {
              connect: { id: user.id },
            },
            invoice: latestInvoice.id,
            stripeSubscriptionId,
            currency: session.currency as string,
            status: 'PROCESSING',
            amount: session.amount_total as number,
          },
        });
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    try {
      const stripeSubscriptionId = invoice.parent?.subscription_details
        ?.subscription as string;
      if (!stripeSubscriptionId)
        throw new BadRequestException('No subscription id');

      const stripeCustomerId = invoice.customer as string;
      const user = await this.db.user.findFirst({
        where: { stripeCustomerId },
      });
      if (!user) throw new NotFoundException('User not found');

      console.log(stripeSubscriptionId);
      console.log(user);

      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        stripeSubscriptionId,
        { expand: ['items.data.price'] },
      );
      const priceId = stripeSubscription.items.data[0].price.id;

      const plan = await this.db.plan.findFirst({
        where: { stripePriceId: priceId },
      });
      if (!plan) throw new NotFoundException('Plan not found');

      console.log('stripeSubscriptionId:', stripeSubscriptionId);
      console.log('plan:', plan);
      console.log('user:', user);

      const startDate = new Date(stripeSubscription.start_date * 1000);
      const endDate = this.calculateSubscriptionEndDate(
        stripeSubscription.start_date,
        // @ts-expect-error stripeSubscription
        stripeSubscription?.plan?.interval,
        // @ts-expect-error stripeSubscription
        stripeSubscription?.plan?.interval_count,
      );

      await this.db.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { userId: user.id },
          data: {
            plan: { connect: { id: plan.id } },
            status: 'ACTIVE',
            stripeSubscriptionId,
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
          },
        });
        await tx.payment.update({
          where: { stripeSubscriptionId },
          data: {
            status: 'SUCCEEDED',
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            aiCreditsThisMonth: 0,
            aiLastUsedAt: new Date(),
          },
        });
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async handlePaymentFailed(invoice: Stripe.Invoice) {
    try {
      console.log('handlePaymentFailed');
      const stripeCustomerId = invoice.customer as string;
      const stripeSubscriptionId = invoice.parent?.subscription_details
        ?.subscription as string;

      if (!stripeSubscriptionId)
        throw new BadRequestException('No subscription id');

      console.log(stripeSubscriptionId);

      await this.db.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { stripeSubscriptionId },
          data: {
            status: 'ACTIVE',
          },
        });
        await tx.payment.update({
          where: { stripeSubscriptionId },
          data: {
            status: 'FAILED',
          },
        });
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
      console.log('handleSubscriptionDeleted');
      const stripeCustomerId = subscription.customer as string;

      const user = await this.db.user.findFirst({
        where: { stripeCustomerId },
      });
      if (!user) return;

      await this.db.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { userId: user.id },
          data: {
            currentPeriodStart: null,
            currentPeriodEnd: null,
            stripeSubscriptionId: null,
            status: 'CANCELED',
            plan: { connect: { name: 'free' } },
          },
        });
        await tx.user.update({
          where: { id: user.id },
          data: {
            aiCreditsThisMonth: 0,
            aiLastUsedAt: null,
          },
        });
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  calculateSubscriptionEndDate(
    startTimestamp: number,
    interval: 'day' | 'week' | 'month' | 'year',
    intervalCount: number,
  ): Date {
    const startDate = new Date(startTimestamp * 1000);
    const endDate = new Date(startDate);

    switch (interval) {
      case 'day':
        endDate.setDate(endDate.getDate() + intervalCount);
        break;
      case 'week':
        endDate.setDate(endDate.getDate() + intervalCount * 7);
        break;
      case 'month':
        endDate.setMonth(endDate.getMonth() + intervalCount);
        break;
      case 'year':
        endDate.setFullYear(endDate.getFullYear() + intervalCount);
        break;
    }

    return endDate;
  }

  getPaymentStatus(status: StripeSubscriptionStatus): PaymentStatus {
    switch (status) {
      case 'ACTIVE':
        return 'SUCCEEDED';
      case 'PAST_DUE':
        return 'FAILED';
      case 'UNPAID':
        return 'FAILED';
      case 'CANCELED':
        return 'FAILED';
      case 'INCOMPLETE':
        return 'REQUIRES_PAYMENT_METHOD';
      case 'TRIALING':
        return 'SUCCEEDED';
    }
  }
}
