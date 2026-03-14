import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreateResumeDto } from './dto/resume.dto';

@Injectable()
export class ResumeRepository {
  constructor(private db: DbService) {}

  async createResume(
    body: CreateResumeDto,
    generated: {
      aiModel: string;
      content: string | null;
    },
    userId: string,
  ) {
    const { personalInfo, education, experience, skills, projects } = body;

    const transation = await this.db.$transaction(async (tx) => {
      const resume = await tx.resume.create({
        data: {
          userId,
          type: body.type,
          // generatedResume: generated || '',
          personalInfo: {
            create: {
              fullName: personalInfo.fullName,
              email: personalInfo.email,
              phone: personalInfo.phone,
              address: personalInfo.address,
            },
          },

          skills: {
            create: {
              soft: skills.soft,
              languages: skills.languages,
              technical: skills.technical,
            },
          },

          education: {
            create: education.map((edu) => ({
              university: edu.university,
              degree: edu.degree,
              fieldOfStudy: edu.fieldOfStudy,
              startDate: edu.startDate,
              endDate: edu.endDate,
              stillStudying: edu.stillStudying ?? false,
            })),
          },

          experiences: {
            create: experience.map((exp) => ({
              company: exp.company,
              position: exp.position,
              description: exp.description ?? null,
              startDate: exp.startDate,
              endDate: exp.endDate,
              stillWorking: exp.stillWorking ?? false,
            })),
          },

          projects: {
            create: projects.map((project) => ({
              title: project.title,
              description: project.description,
            })),
          },
        },

        include: {
          personalInfo: true,
          skills: true,
          education: true,
          experiences: true,
          projects: true,
        },
      });

      await tx.generatedResume.create({
        data: {
          resumeId: resume.id,
          content: generated.content || '',
          aiModel: generated.aiModel,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          aiCreditsThisMonth: { increment: 1 },
          aiCreditsTotal: { increment: 1 },
          aiLastUsedAt: new Date(),
          resumesThisMonth: { increment: 1 },
          resumeLastGeneratedAt: new Date(),
        },
      });

      return resume;
    });
    return transation;
  }

  async getResume(id: string) {
    return this.db.resume.findUnique({
      where: { id },
      include: {
        generatedResumes: true,
      },
    });
  }

  async updateGeneratedResume(id: string, generatedJSON: string) {
    return this.db.generatedResume.update({
      where: { id },
      data: { content: generatedJSON },
    });
  }

  async deleteResume(id: string) {
    return this.db.resume.delete({ where: { id } });
  }

  async deleteGeneratedResume(id: string) {
    return this.db.generatedResume.delete({ where: { id } });
  }

  async createGeneratedResume(
    resumeId: string,
    generatedJSON: string,
    aiModel: string,
  ) {
    return this.db.generatedResume.create({
      data: {
        resumeId,
        content: generatedJSON,
        aiModel: aiModel,
      },
    });
  }
}
