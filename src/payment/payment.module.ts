import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { PlanModule } from 'src/plan/plan.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [PlanModule, UserModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentRepository],
})
export class PaymentModule {}
