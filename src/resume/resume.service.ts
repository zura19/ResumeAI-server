import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GeneratedResume, Project, Resume, User } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { CreateResumeDto } from './dto/resume.dto';
import { ResumeRepository } from './resume.repository';
import { AiService } from 'src/ai/ai.service';
import { GeneratedResumeDto } from './dto/generated-resume/generated-resume.dto';
import { GenerateFeautureDto } from './dto/with-ai/generate-feature.dto';
import { GenerateResponsibilitieDto } from './dto/with-ai/generate-responsibilitie.dto';
import { UserRepository } from 'src/user/user.repository';

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
      const generatedResume = await this.aiService.generateResume(body);
      console.log(generatedResume);
      const resume = await this.resumeRepository.createResume(
        body,
        {
          aiModel: generatedResume.aiModel,
          content: generatedResume.content,
        },
        userId,
      );

      let res;
      try {
        res = JSON.parse(generatedResume.content || '');
      } catch (error) {
        throw new Error('Invalid JSON format in generatedResume');
      }

      return resume.id;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getResume(id: string, user: User): Promise<Resume> {
    try {
      const resume = await this.resumeRepository.getResume(id);
      if (!resume || resume.userId !== user.id) {
        throw new NotFoundException(`Resume with id: ${id} not found.`);
      }

      return resume;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateResume(
    id: string,
    generatedResumeId: string,
    body: GeneratedResumeDto,
    user: User,
  ) {
    try {
      const existingResume = await this.resumeRepository.getResume(id); // Check if the resume exists

      if (existingResume?.userId !== user.id) {
        throw new BadRequestException(
          'You are not authorized to update this resume.',
        );
      }

      if (!existingResume) {
        throw new NotFoundException(`Resume with id: ${id} not found.`);
      }

      const existingGeneratedResume = existingResume.generatedResumes.find(
        (g) => g.id === generatedResumeId,
      );

      if (!existingGeneratedResume) {
        throw new NotFoundException(
          `Generated resume with id: ${generatedResumeId} not found for resume with id: ${id}.`,
        );
      }

      const updatedResume = await this.resumeRepository.updateGeneratedResume(
        generatedResumeId,
        JSON.stringify(body),
      );

      return { success: true, data: updatedResume };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async createAnotherVersionOfResume(
    id: string,
    prompt: string,
    userId: string,
  ): Promise<{ id: string; content: string | null }> {
    try {
      const resume = await this.resumeRepository.getResume(id);
      if (!resume) {
        throw new NotFoundException(`Resume with id: ${id} not found.`);
      }

      if (resume.userId !== userId) {
        throw new BadRequestException('You are not the owner of this resume.');
      }

      // const latestGeneratedResume =
      //   resume.generatedResumes[resume.generatedResumes.length - 1];

      const resumes = resume.generatedResumes.map((g) => g.content);
      console.log(resumes);

      const updatedResume = await this.aiService.updateResume(
        resumes as string[],
        // latestGeneratedResume?.content as string,
        prompt,
        userId,
      );

      const generatedResume = await this.resumeRepository.createGeneratedResume(
        id,
        updatedResume.resume as string,
        updatedResume.aiModel,
      );

      await this.userRepo.addAiCredits(userId);

      return {
        id: generatedResume.id,
        content: updatedResume.content,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteResume(id: string, userId: string) {
    try {
      const resume = await this.resumeRepository.getResume(id);

      if (!resume || resume.userId !== userId) {
        throw new NotFoundException(
          `Resume with id: ${id} not found or you are not the owner of this resume.`,
        );
      }

      await this.resumeRepository.deleteResume(id);
      return { success: true };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async duplicateResume(
    resumeId: string,
    generatedId: string,
    userId: string,
  ): Promise<string> {
    try {
      const resume =
        await this.resumeRepository.getResumeForDuplicate(resumeId);

      if (!resume || resume.userId !== userId) {
        throw new NotFoundException(
          `Resume with id: ${resumeId} not found or you are not the owner of this resume.`,
        );
      }

      const generatedResume = resume.generatedResumes.find(
        (g) => g.id === generatedId,
      );

      if (!generatedResume) {
        throw new NotFoundException(
          `Generated resume with id: ${generatedId} not found for resume with id: ${resumeId}.`,
        );
      }

      const duplicatedResume = await this.resumeRepository.duplicateResume(
        resume,
        generatedResume,
        userId,
      );

      return duplicatedResume.id;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async changeTitle(
    resumeId: string,
    title: string,
    userId: string,
  ): Promise<string> {
    try {
      const resume = await this.resumeRepository.getResume(resumeId);

      if (!resume) {
        throw new NotFoundException(`Resume with id: ${resumeId} not found.`);
      }

      if (resume.userId !== userId) {
        throw new BadRequestException(
          'You are not authorized to update this resume title.',
        );
      }

      const existingResumeWithTitle =
        await this.resumeRepository.userHasResumeWithTitle(
          userId,
          title,
          resumeId,
        );

      if (existingResumeWithTitle) {
        throw new BadRequestException(
          'You already have a resume with this title.',
        );
      }

      const updatedResume = await this.resumeRepository.updateTitle(
        resumeId,
        title,
      );

      return updatedResume.title ?? '';
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteGeneratedResume(
    generatedResumeId: string,
    resumeId: string,
    userId: string,
  ) {
    try {
      const resume = await this.resumeRepository.getResume(resumeId);

      if (!resume || resume.userId !== userId) {
        throw new NotFoundException(
          `Resume with id: ${resumeId} not found or you are not the owner of this resume.`,
        );
      }

      if (!resume.generatedResumes.find((g) => g.id === generatedResumeId)) {
        throw new NotFoundException(
          `Generated resume with id: ${generatedResumeId} not found for resume with id: ${resumeId}.`,
        );
      }

      await this.resumeRepository.deleteGeneratedResume(generatedResumeId);
      return { success: true };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async generateSummary(id: string, body: GeneratedResumeDto, userId: string) {
    try {
      const existingResume = await this.resumeRepository.getResume(id); // Check if the resume exists
      if (!existingResume) {
        throw new NotFoundException(`Resume with id: ${id} not found.`);
      }

      // const summary = 'Generated summary';

      const summary = await this.aiService.generateSummary(body);
      if (summary) {
        await this.db.user.update({
          where: { id: userId },
          data: {
            aiCreditsThisMonth: { increment: 1 },
            aiCreditsTotal: { increment: 1 },
            aiLastUsedAt: new Date(),
          },
        });
      }

      return { success: true, data: { summary } };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async generateFeature(body: GenerateFeautureDto, id: string) {
    try {
      // const feature = 'Generated feature';

      const feature = await this.aiService.generateProjectFeature(body);
      if (feature) {
        await this.db.user.update({
          where: { id },
          data: {
            aiCreditsThisMonth: { increment: 1 },
            aiCreditsTotal: { increment: 1 },
            aiLastUsedAt: new Date(),
          },
        });
      }
      return { data: { feature } };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async generateResponsibilitie(body: GenerateResponsibilitieDto, id: string) {
    try {
      // const responsibilitie = 'Generated responsibilitie';
      const responsibilitie =
        await this.aiService.generateExperienceResponsibilitie(body);

      if (responsibilitie) {
        await this.db.user.update({
          where: { id },
          data: {
            aiCreditsThisMonth: { increment: 1 },
            aiCreditsTotal: { increment: 1 },
            aiLastUsedAt: new Date(),
          },
        });
      }
      return { data: { responsibilitie } };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async canGenerate(id: string): Promise<boolean> {
    try {
      const user = await this.db.user.findUnique({
        where: { id },
        include: {
          resumes: { select: { id: true } },
          subscription: {
            include: {
              plan: { select: { totalResumes: true } },
            },
          },
        },
      });

      const limit = user?.subscription?.plan.totalResumes;
      return !!user && !!limit && user.resumes.length < limit;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // async canGenerate(id: string): Promise<boolean> {
  //   try {
  //     const lastResume = await this.db.resume.findFirst({
  //       where: {
  //         userId: id,
  //       },
  //       orderBy: {
  //         createdAt: 'desc',
  //       },
  //       select: {
  //         createdAt: true,
  //       },
  //     });

  //     if (!lastResume) return true;
  //     const can = hasDaysPassed(lastResume.createdAt, CAN_GENERATE_RESUME_IN);

  //     if (!can) {
  //       throw new BadRequestException(
  //         `You can generate new resume only once every ${CAN_GENERATE_RESUME_IN} days. please try again later.`,
  //       );
  //     }

  //     return can;
  //   } catch (error) {
  //     console.log(error);
  //     throw error;
  //   }
  // }

  async getUniversities(name: string): Promise<
    {
      country: string;
      name: string;
      web_pages: string[];
      domains: string[];
      state_province: string;
    }[]
  > {
    try {
      const universities = await fetch(
        `http://universities.hipolabs.com/search?name=${name}&limit=10`,
      );
      const data = await universities.json();
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
