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
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PlanModule } from './plan/plan.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    DbModule,
    ResumeModule,
    AiModule,
    UserModule,
    AuthModule,
    PlanModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
