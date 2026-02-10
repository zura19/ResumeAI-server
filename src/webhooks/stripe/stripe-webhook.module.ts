import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports: [SubscriptionModule, PaymentModule],
  controllers: [StripeWebhookController],
  providers: [StripeWebhookService],
})
export class StripeWebhookModule {}
