import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Plan, PlanName, StripeSubscriptionStatus } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { EmailService } from 'src/email/email.service';
import { PaymentRepository } from 'src/payment/payment.repository';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
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
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
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

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
    }

    return { received: true };
  }

  // Creates an intermediate PROCESSING payment record as soon as Checkout
  // completes, so the status route can reflect that state before
  // invoice.payment_succeeded arrives. Never downgrades an already-final
  // payment (update is a no-op on existing rows).
  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    try {
      if (session.mode !== 'subscription') return;

      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;
      if (!stripeSubscriptionId) return;

      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        stripeSubscriptionId,
        { expand: ['latest_invoice'] },
      );

      const latestInvoice = stripeSubscription.latest_invoice as Stripe.Invoice;
      const invoiceId = latestInvoice?.id;
      if (!invoiceId) return;

      const user = await this.db.user.findFirst({
        where: { stripeCustomerId },
      });
      if (!user) throw new NotFoundException('User not found');

      await this.db.payment.upsert({
        where: { invoice: invoiceId },
        update: {},
        create: {
          user: {
            connect: { id: user.id },
          },
          invoice: invoiceId,
          stripeSubscriptionId,
          currency: (session.currency ?? latestInvoice?.currency) as string,
          status: 'PROCESSING',
          amount: (session.amount_total ?? latestInvoice?.amount_due) as number,
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

    let plan: Plan;
    let currentPeriodEnd: Date;
    try {
      // Idempotent provisioning shared with the manual reconcile endpoint.
      ({ plan, currentPeriodEnd } =
        await this.paymentRepo.provisionPaidSubscription(
          user.id,
          stripeSubscriptionId,
          invoice,
        ));
    } catch (error) {
      // Provisioning failed. The Stripe payment itself still succeeded, but
      // our local side effects did not, so record it as FAILED for follow-up.
      // Rethrowing returns a 500 so Stripe retries the event; /payment/reconcile
      // is the manual recovery path if retries are exhausted.
      if (!invoice.id) throw error;

      await this.db.payment
        .upsert({
          where: { invoice: invoice.id },
          update: { status: 'FAILED', stripeSubscriptionId },
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

    // Email is best-effort: a delivery failure must not change payment status.
    try {
      await this.email.sendPaymentConfirmationEmail(
        invoice.customer_email ?? user.email,
        {
          Plan: plan.name,
          amount: invoice.amount_paid / 100,
          endDate: currentPeriodEnd,
        },
      );
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
    }
  }

  async handlePaymentFailed(invoice: Stripe.Invoice) {
    try {
      const stripeSubscriptionId = invoice.parent?.subscription_details
        ?.subscription as string;

      if (!stripeSubscriptionId)
        throw new BadRequestException('No subscription id');
      if (!invoice.id) throw new BadRequestException('No invoice id');

      const stripeCustomerId = invoice.customer as string;
      const user = await this.db.user.findFirst({
        where: { stripeCustomerId },
      });
      if (!user) throw new NotFoundException('User not found');

      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        stripeSubscriptionId,
        { expand: ['items.data.price'] },
      );

      // Upsert so a failure that arrives before any payment row exists does
      // not throw; keyed by the unique invoice id.
      await this.db.payment.upsert({
        where: { invoice: invoice.id },
        update: { status: 'FAILED', stripeSubscriptionId },
        create: {
          user: {
            connect: { id: user.id },
          },
          invoice: invoice.id,
          stripeSubscriptionId,
          currency: invoice.currency as string,
          status: 'FAILED',
          amount: (invoice.amount_due ?? 0) as number,
        },
      });

      await this.syncLocalSubscriptionFromStripe(user.id, stripeSubscription);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
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
            resumesThisMonth: 0,
            resumeLastGeneratedAt: null,
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

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    try {
      const stripeCustomerId = subscription.customer as string;

      const user = await this.db.user.findFirst({
        where: { stripeCustomerId },
      });
      if (!user) return;

      await this.syncLocalSubscriptionFromStripe(user.id, subscription);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async syncLocalSubscriptionFromStripe(
    userId: string,
    subscription: Stripe.Subscription,
  ) {
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      throw new BadRequestException('No price id on Stripe subscription');
    }

    const plan = await this.db.plan.findFirst({
      where: { stripePriceId: priceId },
    });
    if (!plan) {
      throw new NotFoundException(`Plan not found for priceId: ${priceId}`);
    }

    const { start, end } = this.getCurrentPeriod(subscription);

    await this.db.subscription.update({
      where: { userId },
      data: {
        plan: { connect: { id: plan.id } },
        status: this.toLocalSubscriptionStatus(subscription.status),
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  private toLocalSubscriptionStatus(
    status: Stripe.Subscription.Status,
  ): StripeSubscriptionStatus {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'trialing':
        return 'TRIALING';
      case 'past_due':
        return 'PAST_DUE';
      case 'unpaid':
        return 'UNPAID';
      case 'canceled':
        return 'CANCELED';
      case 'incomplete':
      case 'incomplete_expired':
        return 'INCOMPLETE';
      case 'paused':
        return 'UNPAID';
    }
  }

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

    if (!start || !end) {
      throw new BadRequestException('No current period on Stripe subscription');
    }

    return {
      start: new Date(start * 1000),
      end: new Date(end * 1000),
    };
  }
}
