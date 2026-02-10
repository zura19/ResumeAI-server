import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { PlanModule } from 'src/plan/plan.module';

@Module({
  imports: [PlanModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentRepository],
})
export class PaymentModule {}
