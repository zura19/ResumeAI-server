import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import { getUniversitiesQueryDto } from './dto/get-universities.query';
import { ChangeTitleDto } from './dto/change-title.dto';
import { CanGenerateAiGuard } from 'src/common/guards/can-generate-ai.guard';
import { CanUseAiGuard } from 'src/common/guards/can-use-ai.guard';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @UseGuards(AuthGuard('jwt'), CanGenerateAiGuard)
  @Post()
  async create(
    @Body() body: CreateResumeDto,
    @UserDecorator() user: User,
  ): Promise<ApiResponse<{ resumeId: string }>> {
    const resumeId = await this.resumeService.createResume(body, user.id);

    return { data: { resumeId } };
  }

  @UseGuards(AuthGuard('jwt'), CanGenerateAiGuard)
  @Post('duplicate/:resumeId/:generatedId')
  async duplicate(
    @Param('resumeId') resumeId: string,
    @Param('generatedId') generatedId: string,
    @UserDecorator() user: User,
  ): Promise<ApiResponse<{ resumeId: string }>> {
    const duplicatedResumeId = await this.resumeService.duplicateResume(
      resumeId,
      generatedId,
      user.id,
    );

    return {
      data: { resumeId: duplicatedResumeId },
      message: 'Resume duplicated successfully',
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async get(
    @Param('id') id: string,
    @UserDecorator() user: User,
  ): Promise<ApiResponse<{ resume: Resume }>> {
    const resume = await this.resumeService.getResume(id, user);
    return { data: { resume } };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteResume(
    @Param('id') id: string,
    @UserDecorator() user: User,
  ): Promise<ApiResponse<null>> {
    await this.resumeService.deleteResume(id, user.id);
    return { data: null, message: 'Resume deleted successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('title/:id')
  async changeTitle(
    @Param('id') id: string,
    @Body() body: ChangeTitleDto,
    @UserDecorator() user: User,
  ): Promise<ApiResponse<{ title: string }>> {
    const title = await this.resumeService.changeTitle(id, body.title, user.id);
    return { data: { title }, message: 'Resume title updated successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id/:generatedResumeId')
  async update(
    @Param('id') id: string,
    @Param('generatedResumeId') generatedResumeId: string,
    @Body() body: GeneratedResumeDto,
    @UserDecorator() user: User,
  ) {
    return await this.resumeService.updateResume(
      id,
      generatedResumeId,
      body,
      user,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('generated/:id/:generatedResumeId')
  async deleteGeneratedResume(
    @Param('id') id: string,
    @Param('generatedResumeId') generatedResumeId: string,
    @UserDecorator() user: User,
  ): Promise<ApiResponse<null>> {
    await this.resumeService.deleteGeneratedResume(
      generatedResumeId,
      id,
      user.id,
    );
    return { data: null, message: 'Resume version deleted successfully' };
  }

  @UseGuards(AuthGuard('jwt'), CanUseAiGuard)
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

  @UseGuards(AuthGuard('jwt'), CanUseAiGuard)
  @Post('generate/feature')
  async generateFeature(
    @Body() body: GenerateFeautureDto,
    @UserDecorator() user: User,
  ) {
    return await this.resumeService.generateFeature(body, user.id);
  }

  @UseGuards(AuthGuard('jwt'), CanUseAiGuard)
  @Post('generate/responsibilitie')
  async generateResponsibilitie(
    @Body() body: GenerateResponsibilitieDto,
    @UserDecorator() user: User,
  ) {
    return await this.resumeService.generateResponsibilitie(body, user.id);
  }

  @Get('/build/unis')
  async getUniversities(
    @Query() query: getUniversitiesQueryDto,
  ): Promise<ApiResponse<{ universities: any }>> {
    const universities = await this.resumeService.getUniversities(query.name);
    return { data: { universities } };
  }
}
