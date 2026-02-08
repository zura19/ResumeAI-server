import { Injectable, NotFoundException } from '@nestjs/common';
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
        stripePaymentIntentId: data.stripePaymentIntentId,
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
    planName: PlanName,
    planId: string,
    userId: string,
  ) {
    const clientUrl = this.configService.get('CLIENT_URL');
    // const price = await this.stripe.prices.create({
    //   unit_amount: amount,
    //   currency: 'usd',
    //   recurring: {
    //     interval: 'month', // or 'year'
    //   },
    //   product_data: {
    //     name: planName + ' Plan',
    //   },
    // });

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

  async retrieveSession(
    stripeSessionId: string,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    const session = await this.stripe.checkout.sessions.retrieve(
      stripeSessionId,
      { expand: ['payment_intent'] },
    );
    return session;
  }

  async findPaymentIntentByIntentId(id: string) {
    const payment = await this.db.payment.findUnique({
      where: {
        stripePaymentIntentId: id,
      },
    });
    return payment;
  }
}
