import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/resume.dto';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post()
  async create(@Body() body: CreateResumeDto) {
    return await this.resumeService.createResume(body);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.resumeService.getResume(id);
  }
}
