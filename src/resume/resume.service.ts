import { Injectable, NotFoundException } from '@nestjs/common';
import { Project } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { CreateResumeDto } from './dto/resume.dto';
import { ResumeRepository } from './resume.repository';
import { AiService } from 'src/ai/ai.service';
import { GeneratedResumeDto } from './dto/generated-resume/generated-resume.dto';
import { GenerateFeautureDto } from './dto/with-ai/generate-feature.dto';
import { GenerateResponsibilitieDto } from './dto/with-ai/generate-responsibilitie.dto';

@Injectable()
export class ResumeService {
  constructor(
    private db: DbService,
    private resumeRepository: ResumeRepository,
    private aiService: AiService,
  ) {}

  async createResume(body: CreateResumeDto) {
    try {
      const generatedResume = await this.aiService.generateResume(body);
      const resume = await this.resumeRepository.createResume(
        body,
        generatedResume,
      );

      let res;
      try {
        res = JSON.parse(generatedResume || '');
      } catch (error) {
        throw new Error('Invalid JSON format in generatedResume');
      }
      // console.log(paresd);

      return { success: true, id: resume.id };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: error.message || 'Something went wrong',
      };
    }
  }

  async getResume(id: string) {
    try {
      const resume = await this.resumeRepository.getResume(id);

      if (!resume) {
        throw new NotFoundException(`Resume with id: ${id} not found.`);
      }

      return { success: true, data: resume };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateResume(id: string, body: GeneratedResumeDto) {
    try {
      const existingResume = await this.resumeRepository.getResume(id); // Check if the resume exists

      if (!existingResume) {
        throw new NotFoundException(`Resume with id: ${id} not found.`);
      }

      const updatedResume = await this.resumeRepository.updateGeneratedResume(
        id,
        JSON.stringify(body),
      );

      return { success: true, data: updatedResume };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateResumeSummary(id: string, body: GeneratedResumeDto) {
    try {
      const existingResume = await this.resumeRepository.getResume(id); // Check if the resume exists
      if (!existingResume) {
        throw new NotFoundException(`Resume with id: ${id} not found.`);
      }

      // const summary = 'Generated summary';

      const summary = await this.aiService.generateSummary(body);

      // const updatedResume = await this.resumeRepository.updateGeneratedResume(
      //   id,
      //   JSON.stringify({ ...body, summary }),
      // );
      return { success: true, data: { summary } };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async generateFeature(body: GenerateFeautureDto) {
    try {
      // const feature = 'Generated feature';
      const feature = await this.aiService.generateProjectFeature(body);
      return { success: true, data: { feature } };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async generateResponsibilitie(body: GenerateResponsibilitieDto) {
    try {
      // const responsibilitie = 'Generated responsibilitie';

      const responsibilitie =
        await this.aiService.generateExperienceResponsibilitie(body);
      return { success: true, data: { responsibilitie } };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
