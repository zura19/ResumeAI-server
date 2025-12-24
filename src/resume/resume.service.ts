import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Project, Resume } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { CreateResumeDto } from './dto/resume.dto';
import { ResumeRepository } from './resume.repository';
import { AiService } from 'src/ai/ai.service';
import { GeneratedResumeDto } from './dto/generated-resume/generated-resume.dto';
import { GenerateFeautureDto } from './dto/with-ai/generate-feature.dto';
import { GenerateResponsibilitieDto } from './dto/with-ai/generate-responsibilitie.dto';
import { UserRepository } from 'src/user/user.repository';
import { hasDaysPassed } from 'src/common/lib/hasDaysPassed';

const CAN_GENERATE_RESUME_IN = 2;

@Injectable()
export class ResumeService {
  constructor(
    private db: DbService,
    private resumeRepository: ResumeRepository,
    private aiService: AiService,
    private userRepo: UserRepository,
  ) {}

  async createResume(body: CreateResumeDto, userId: string): Promise<string> {
    try {
      const canGenerateResume = await this.canGenerate(userId);

      if (!canGenerateResume) {
        throw new BadRequestException(
          `You can generate new resume only once every ${CAN_GENERATE_RESUME_IN} days. please try again later.`,
        );
      }

      const generatedResume = await this.aiService.generateResume(body);
      const resume = await this.resumeRepository.createResume(
        body,
        generatedResume,
        userId,
      );

      let res;
      try {
        res = JSON.parse(generatedResume || '');
      } catch (error) {
        throw new Error('Invalid JSON format in generatedResume');
      }
      // console.log(paresd);

      return resume.id;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getResume(id: string): Promise<Resume> {
    try {
      const resume = await this.resumeRepository.getResume(id);

      if (!resume) {
        throw new NotFoundException(`Resume with id: ${id} not found.`);
      }

      return resume;
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

  async generateSummary(id: string, body: GeneratedResumeDto, userId: string) {
    try {
      const canUseAi = await this.userRepo.canUseAi(userId);

      if (!canUseAi) {
        throw new BadRequestException(
          'You have reached the limit of AI use per day. Please try again tomorrow.',
        );
      }

      const existingResume = await this.resumeRepository.getResume(id); // Check if the resume exists
      if (!existingResume) {
        throw new NotFoundException(`Resume with id: ${id} not found.`);
      }

      // const summary = 'Generated summary';

      const summary = await this.aiService.generateSummary(body);

      return { success: true, data: { summary } };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async generateFeature(body: GenerateFeautureDto, id: string) {
    try {
      const canUseAi = await this.userRepo.canUseAi(id);

      // const feature = 'Generated feature';

      if (!canUseAi) {
        throw new BadRequestException(
          'You have reached the limit of AI use per day. Please try again tomorrow.',
        );
      }

      const feature = await this.aiService.generateProjectFeature(body);
      return { data: { feature } };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async generateResponsibilitie(body: GenerateResponsibilitieDto, id: string) {
    try {
      const canUseAi = await this.userRepo.canUseAi(id);
      console.log(canUseAi + '5000');

      if (!canUseAi) {
        throw new BadRequestException(
          'You have reached the limit of AI use per day. Please try again tomorrow.',
        );
      }

      // const responsibilitie = 'Generated responsibilitie';
      const responsibilitie =
        await this.aiService.generateExperienceResponsibilitie(body);
      return { data: { responsibilitie } };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async canGenerate(id: string): Promise<boolean> {
    try {
      const lastResume = await this.db.resume.findFirst({
        where: {
          userId: id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
        },
      });

      if (!lastResume) return true;
      const can = hasDaysPassed(lastResume.createdAt, CAN_GENERATE_RESUME_IN);

      if (!can) {
        throw new BadRequestException(
          `You can generate new resume only once every ${CAN_GENERATE_RESUME_IN} days. please try again later.`,
        );
      }

      return can;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
