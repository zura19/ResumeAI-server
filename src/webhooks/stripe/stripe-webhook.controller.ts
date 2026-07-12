import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';
import type { Request } from 'express';

@Controller('webhooks/stripe')
@SkipThrottle()
export class StripeWebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post()
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw Stripe webhook body');
    }

    return this.stripeWebhookService.handle(req.rawBody, signature);
  }
}
