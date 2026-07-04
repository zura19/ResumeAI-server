import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import { ResumeModule } from 'src/resume/resume.module';
import { CanUseAiGuard } from 'src/common/guards/can-use-ai.guard';

@Module({
  imports: [ResumeModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository, CanUseAiGuard],
})
export class ChatModule {}
