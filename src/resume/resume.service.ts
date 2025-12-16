import { Injectable, NotFoundException } from '@nestjs/common';
import { Project } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { CreateResumeDto } from './dto/resume.dto';
import { ResumeRepository } from './resume.repository';
import { AiService } from 'src/ai/ai.service';

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

      return { success: true, resume: res };
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
}
