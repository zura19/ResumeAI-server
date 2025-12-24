import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/resume.dto';
import { GeneratedResumeDto } from './dto/generated-resume/generated-resume.dto';
import { GenerateFeautureDto } from './dto/with-ai/generate-feature.dto';
import { GenerateResponsibilitieDto } from './dto/with-ai/generate-responsibilitie.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import { Resume, type User } from '@prisma/client';
import { ApiResponse } from 'src/common/interceptors/response.interface';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() body: CreateResumeDto,
    @UserDecorator() user: User,
  ): Promise<ApiResponse<{ resumeId: string }>> {
    const resumeId = await this.resumeService.createResume(body, user.id);

    return { data: { resumeId } };
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<ApiResponse<{ resume: Resume }>> {
    const resume = await this.resumeService.getResume(id);
    return { data: { resume } };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: GeneratedResumeDto) {
    return await this.resumeService.updateResume(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('summary/:id')
  async generateSummary(
    @Param('id') id: string,
    @Body() body: GeneratedResumeDto,
    @UserDecorator() user: User,
  ) {
    return await this.resumeService.generateSummary(id, body, user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('generate/can-generate')
  async canGenerate(
    @UserDecorator() user: User,
  ): Promise<ApiResponse<{ canGenerate: boolean }>> {
    const canGenerate = await this.resumeService.canGenerate(user.id);

    return { data: { canGenerate } };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('generate/feature')
  async generateFeature(
    @Body() body: GenerateFeautureDto,
    @UserDecorator() user: User,
  ) {
    return await this.resumeService.generateFeature(body, user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('generate/responsibilitie')
  async generateResponsibilitie(
    @Body() body: GenerateResponsibilitieDto,
    @UserDecorator() user: User,
  ) {
    return await this.resumeService.generateResponsibilitie(body, user.id);
  }
}
