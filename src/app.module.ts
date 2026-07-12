import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { ResumeModule } from './resume/resume.module';
import { AiModule } from './ai/ai.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ResponseInterceptor } from './common/interceptors/resonse.interceptor';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PlanModule } from './plan/plan.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { PaymentModule } from './payment/payment.module';
import { StripeWebhookModule } from './webhooks/stripe/stripe-webhook.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';
import { ChatModule } from './chat/chat.module';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: minutes(1),
          limit: 120,
          blockDuration: minutes(1),
        },
      ],
      errorMessage: 'Too many requests, please try again later.',
    }),
    DbModule,
    ResumeModule,
    AiModule,
    UserModule,
    AuthModule,
    PlanModule,
    SubscriptionModule,
    PaymentModule,
    StripeWebhookModule,
    AdminModule,
    EmailModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
