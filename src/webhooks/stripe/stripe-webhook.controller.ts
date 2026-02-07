import { Controller, Headers, Post, Req } from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';
// import type { Request } from 'express';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post()
  async handle(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    // @ts-expect-error raw body
    return this.stripeWebhookService.handle(req.body, signature);
  }
}
