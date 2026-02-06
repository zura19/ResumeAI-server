import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanName } from '@prisma/client';
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

  async getPlanByName(planName: PlanName) {
    // const plan = await this.db.plan.findUnique({
    //   where: {
    //     name: planName,
    //   },
    // });

    // if (!plan) {
    //   throw new NotFoundException('Plan not found');
    // }

    return planName;
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
    amount: number,
    planName: PlanName,
  ) {
    const clientUrl = this.configService.get('CLIENT_URL');

    const price = await this.stripe.prices.create({
      unit_amount: amount,
      currency: 'usd',
      recurring: {
        interval: 'month', // or 'year'
      },
      product_data: {
        name: planName + ' Plan',
      },
    });

    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        planName,
      },
      success_url: `${clientUrl}/checkout/success`,
      cancel_url: `${clientUrl}/checkout/cancel`,
    });

    return session;
  }
}
