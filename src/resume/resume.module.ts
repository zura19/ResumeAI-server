import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { ResumeRepository } from './resume.repository';
import { AiModule } from 'src/ai/ai.module';
import { AiService } from 'src/ai/ai.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [AiModule, UserModule],
  controllers: [ResumeController],
  providers: [ResumeService, ResumeRepository],
})
export class ResumeModule {}
