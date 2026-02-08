import { Injectable, NotFoundException } from '@nestjs/common';
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
      const status =
        stripeSubscription.status.toLocaleUpperCase() as StripeSubscriptionStatus;
      const planId = session.metadata?.planId as string;

      const user = await this.db.user.findFirst({
        where: { stripeCustomerId },
      });

      if (!user) throw new NotFoundException('User not found');

      await this.db.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { userId: user.id },
          data: {
            plan: { connect: { id: planId } },
            stripeSubscriptionId,
            status,
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
          },
        });

        await tx.payment.create({
          data: {
            // Use 'connect' to satisfy the "Argument user is missing" error
            user: {
              connect: { id: user.id },
            },
            invoice: latestInvoice.id,
            stripeSubscriptionId: stripeSubscriptionId,
            currency: session.currency as string,
            status: this.getPaymentStatus(status),
            amount: session.amount_total as number,
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
