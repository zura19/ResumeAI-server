import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiRepository } from './ai.repository';

@Module({
  providers: [AiService, AiRepository],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
