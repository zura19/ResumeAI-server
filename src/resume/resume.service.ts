import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { CreateResumeDto } from './dto/resume.dto';
import { ResumeRepository } from './resume.repository';

@Injectable()
export class ResumeService {
  constructor(
    private db: DbService,
    private resumeRepository: ResumeRepository,
  ) {}

  async createResume(body: CreateResumeDto) {
    try {
      const resume = await this.resumeRepository.createResume(body);
      return { success: true, resume };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: error.message || 'Something went wrong',
      };
    }
  }
}
