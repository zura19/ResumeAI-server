import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { ResumeRepository } from './resume.repository';
import { AiModule } from 'src/ai/ai.module';
import { AiService } from 'src/ai/ai.service';
import { UserModule } from 'src/user/user.module';
import { CanGenerateAiGuard } from 'src/common/guards/can-generate-ai.guard';
import { CanUseAiGuard } from 'src/common/guards/can-use-ai.guard';

@Module({
  imports: [AiModule, UserModule],
  controllers: [ResumeController],
  providers: [
    ResumeService,
    ResumeRepository,
    CanGenerateAiGuard,
    CanUseAiGuard,
  ],
  exports: [ResumeService],
})
export class ResumeModule {}
