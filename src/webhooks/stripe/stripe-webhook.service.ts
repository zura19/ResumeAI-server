import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanName } from '@prisma/client';
import { Request } from 'express';
import { DbService } from 'src/db/db.service';
import { PaymentRepository } from 'src/payment/payment.repository';
import { SubscriptionRepository } from 'src/subscription/subcscription.repository';
// import { SubscriptionService } from 'src/subscription/subscription.service';
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

    // if (event.id.length > 12) {
    //   throw new Error('Method not implemented.');
    // }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.deleted':
        // Free plan
        // stripeSubscriptionId = null
        // status = FREE
        // await this.onSubscriptionDeleted(event.data.object);
        break;
    }

    return { received: true };
  }

  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    try {
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      const planName = session.metadata?.planName as PlanName;
      const planId = session.metadata?.planId as string;

      const user = await this.db.user.findFirst({
        where: { stripeCustomerId },
      });

      if (!user) throw new NotFoundException('User not found');

      await this.db.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { userId: user.id },
          data: {
            stripeSubscriptionId,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        await tx.payment.create({
          data: {
            // Use 'connect' to satisfy the "Argument user is missing" error
            user: {
              connect: { id: user.id },
            },
            // Fallback to stripeSubscriptionId if payment_intent is null
            stripePaymentIntentId: stripeSubscriptionId,
            currency: session.currency as string,
            status: 'SUCCEEDED',
            amount: session.amount_total as number,
          },
        });
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
