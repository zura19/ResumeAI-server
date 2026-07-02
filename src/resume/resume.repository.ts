import { Injectable } from '@nestjs/common';
import { GeneratedResume, Prisma } from '@prisma/client';
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

      const title = `${personalInfo.fullName} - ${resume.id}`;

      await tx.resume.update({
        where: { id: resume.id },
        data: { title },
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

  async getResumeForDuplicate(id: string) {
    return this.db.resume.findUnique({
      where: { id },
      include: {
        personalInfo: true,
        skills: true,
        education: true,
        experiences: true,
        projects: true,
        generatedResumes: true,
      },
    });
  }

  async duplicateResume(
    sourceResume: NonNullable<
      Awaited<ReturnType<ResumeRepository['getResumeForDuplicate']>>
    >,
    generatedResume: GeneratedResume,
    userId: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const resume = await tx.resume.create({
        data: {
          userId,
          type: sourceResume.type,
          personalInfo: sourceResume.personalInfo
            ? {
                create: {
                  fullName: sourceResume.personalInfo.fullName,
                  email: sourceResume.personalInfo.email,
                  phone: sourceResume.personalInfo.phone,
                  address: sourceResume.personalInfo.address,
                },
              }
            : undefined,
          skills: sourceResume.skills
            ? {
                create: {
                  soft: sourceResume.skills.soft,
                  languages: sourceResume.skills.languages,
                  technical: sourceResume.skills.technical,
                },
              }
            : undefined,
          education: {
            create: sourceResume.education.map((edu) => ({
              university: edu.university,
              degree: edu.degree,
              fieldOfStudy: edu.fieldOfStudy,
              startDate: edu.startDate,
              endDate: edu.endDate,
              stillStudying: edu.stillStudying,
            })),
          },
          experiences: {
            create: sourceResume.experiences.map((exp) => ({
              company: exp.company,
              position: exp.position,
              description: exp.description,
              startDate: exp.startDate,
              endDate: exp.endDate,
              stillWorking: exp.stillWorking,
            })),
          },
          projects: {
            create: sourceResume.projects.map((project) => ({
              title: project.title,
              description: project.description,
            })),
          },
          generatedResumes: {
            create: {
              content:
                generatedResume.content === null
                  ? Prisma.JsonNull
                  : (generatedResume.content as Prisma.InputJsonValue),
              aiModel: generatedResume.aiModel,
            },
          },
        },
      });

      const title = sourceResume.personalInfo
        ? `${sourceResume.personalInfo.fullName} - ${resume.id}`
        : resume.id;

      return tx.resume.update({
        where: { id: resume.id },
        data: { title },
      });
    });
  }

  async userHasResumeWithTitle(
    userId: string,
    title: string,
    excludeResumeId?: string,
  ) {
    return this.db.resume.findFirst({
      where: {
        userId,
        title: title.toLocaleLowerCase(),
        ...(excludeResumeId
          ? {
              id: {
                not: excludeResumeId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });
  }

  async updateGeneratedResume(id: string, generatedJSON: string) {
    return this.db.generatedResume.update({
      where: { id },
      data: { content: generatedJSON },
    });
  }

  async updateTitle(id: string, title: string) {
    return this.db.resume.update({
      where: { id },
      data: { title },
      select: { title: true },
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
