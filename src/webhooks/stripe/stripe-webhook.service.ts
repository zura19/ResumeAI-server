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
import { EmailService } from 'src/email/email.service';
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
    private email: EmailService,
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
        // await this.handleCheckoutCompleted(event.data.object);
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

      const user = await this.db.user.findFirst({
        where: { stripeCustomerId },
      });
      if (!user) throw new NotFoundException('User not found');

      await this.db.payment.upsert({
        where: { stripeSubscriptionId },
        update: {},
        create: {
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
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const stripeSubscriptionId = invoice.parent?.subscription_details
      ?.subscription as string;

    if (!stripeSubscriptionId) {
      throw new BadRequestException('No subscription id on invoice');
    }

    const stripeCustomerId = invoice.customer as string;

    const user = await this.db.user.findFirst({ where: { stripeCustomerId } });
    if (!user) throw new NotFoundException('User not found');

    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      stripeSubscriptionId,
      { expand: ['items.data.price'] },
    );

    const priceId = stripeSubscription.items.data[0].price.id;
    const plan = await this.db.plan.findFirst({
      where: { stripePriceId: priceId },
    });
    if (!plan)
      throw new NotFoundException(`Plan not found for priceId: ${priceId}`);

    const startDate = new Date(stripeSubscription.start_date * 1000);
    const endDate = this.calculateSubscriptionEndDate(
      stripeSubscription.start_date,
      // @ts-expect-error plan is on the subscription root for simple subscriptions
      stripeSubscription?.plan?.interval,
      // @ts-expect-error plan is on the subscription root for simple subscriptions
      stripeSubscription?.plan?.interval_count,
    );

    try {
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

        await tx.payment.upsert({
          where: { stripeSubscriptionId },
          update: { status: 'SUCCEEDED' },
          create: {
            user: {
              connect: { id: user.id },
            },
            invoice: invoice.id,
            stripeSubscriptionId,
            currency: invoice.currency as string,
            status: 'SUCCEEDED',
            amount: invoice.amount_paid as number,
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
      await this.email.sendPaymentConfirmationEmail(
        invoice.customer_email as string,
        {
          Plan: plan.name,
          amount: invoice.amount_paid / 100,
          endDate,
        },
      );
    } catch (error) {
      await this.db.payment
        .upsert({
          where: { stripeSubscriptionId },
          update: { status: 'FAILED' },
          create: {
            user: {
              connect: { id: user.id },
            },
            invoice: invoice.id,
            stripeSubscriptionId,
            currency: invoice.currency as string,
            status: 'FAILED',
            amount: invoice.amount_paid as number,
          },
        })
        .catch((updateError) => {
          console.error(
            'Could not mark payment as FAILED after rollback:',
            updateError,
          );
        });
      throw error;
    }
  }

  async handlePaymentFailed(invoice: Stripe.Invoice) {
    try {
      console.log('handlePaymentFailed');
      // const stripeCustomerId = invoice.customer as string;
      const stripeSubscriptionId = invoice.parent?.subscription_details
        ?.subscription as string;

      if (!stripeSubscriptionId)
        throw new BadRequestException('No subscription id');

      await this.db.payment.update({
        where: { stripeSubscriptionId },
        data: {
          status: 'FAILED',
        },
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

      const prevPlan = await this.db.subscription.findFirst({
        where: { userId: user.id },
        select: { plan: true },
      });
      const prevPlanName = prevPlan?.plan?.name;

      await this.db.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { userId: user.id },
          data: {
            plan: { connect: { name: 'free' } },
            status: 'CANCELED',
            currentPeriodStart: null,
            currentPeriodEnd: null,
            stripeSubscriptionId: null,
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

      if (prevPlanName) {
        await this.email.sendSubscriptionCanceledEmail(user.email, {
          Plan: prevPlanName as PlanName,
        });
      }
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

  // getPaymentStatus(status: StripeSubscriptionStatus): PaymentStatus {
  //   switch (status) {
  //     case 'ACTIVE':
  //       return 'SUCCEEDED';
  //     case 'PAST_DUE':
  //       return 'FAILED';
  //     case 'UNPAID':
  //       return 'FAILED';
  //     case 'CANCELED':
  //       return 'FAILED';
  //     case 'INCOMPLETE':
  //       return 'REQUIRES_PAYMENT_METHOD';
  //     case 'TRIALING':
  //       return 'SUCCEEDED';
  //   }
  // }
}
