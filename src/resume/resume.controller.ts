import { Controller, Post } from '@nestjs/common';
import { ResumeService } from './resume.service';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post()
  async create() {
    return await this.resumeService.createResume();
  }
}
