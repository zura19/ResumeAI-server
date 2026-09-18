import { Module } from '@nestjs/common';
import { GeneratedResumeContentModule } from '../generated-resume-content/generated-resume-content.module';
import { LinkController } from './link.controller';
import { LinkService } from './link.service';

@Module({
  imports: [GeneratedResumeContentModule],
  controllers: [LinkController],
  providers: [LinkService],
  exports: [LinkService],
})
export class LinkModule {}
