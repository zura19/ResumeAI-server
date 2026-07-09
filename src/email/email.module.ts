import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { OptionalJwtGuard } from './guards/optional-jwt.guard';

@Global()
@Module({
  providers: [EmailService, OptionalJwtGuard],
  exports: [EmailService],
  controllers: [EmailController],
})
export class EmailModule {}
