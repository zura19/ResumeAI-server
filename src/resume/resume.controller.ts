import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/resume.dto';
import { GeneratedResumeDto } from './dto/generated-resume/generated-resume.dto';
import { GenerateFeautureDto } from './dto/with-ai/generate-feature.dto';
import { GenerateResponsibilitieDto } from './dto/with-ai/generate-responsibilitie.dto';

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

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: GeneratedResumeDto) {
    return await this.resumeService.updateResume(id, body);
  }

  @Post('summary/:id')
  async updateSummary(
    @Param('id') id: string,
    @Body() body: GeneratedResumeDto,
  ) {
    return await this.resumeService.updateResumeSummary(id, body);
  }

  @Post('generate/feature')
  async generateFeature(@Body() body: GenerateFeautureDto) {
    return await this.resumeService.generateFeature(body);
  }

  @Post('generate/responsibilitie')
  async generateResponsibilitie(@Body() body: GenerateResponsibilitieDto) {
    return await this.resumeService.generateResponsibilitie(body);
  }
}
