import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { ResumeRepository } from './resume.repository';
import { AiModule } from 'src/ai/ai.module';
import { AiService } from 'src/ai/ai.service';
import { UserModule } from 'src/user/user.module';
import { CanGenerateAiGuard } from 'src/common/guards/can-generate-ai.guard';
import { CanUseAiGuard } from 'src/common/guards/can-use-ai.guard';
import { EducationModule } from './education/education.module';
import { ExperienceModule } from './experience/experience.module';
import { PersonalInfoModule } from './personal-info/personal-info.module';
import { ProjectModule } from './project/project.module';
import { LinkModule } from './link/link.module';
import { SkillsModule } from './skills/skills.module';
import { SummaryModule } from './summary/summary.module';

@Module({
  imports: [
    AiModule,
    UserModule,
    SummaryModule,
    PersonalInfoModule,
    SkillsModule,
    EducationModule,
    ExperienceModule,
    ProjectModule,
    LinkModule,
  ],
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
