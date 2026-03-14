import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiRepository } from './ai.repository';
import { ChatGateway } from 'src/chat/chat.gateway';

@Module({
  providers: [AiService, AiRepository, ChatGateway],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
