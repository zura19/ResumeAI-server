import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { CreateResumeDto } from './dto/resume.dto';
import { GeneratedResumeDto } from './dto/generated-resume/generated-resume.dto';

export type GeneratedResumeWithDetails = Prisma.GeneratedResumeGetPayload<{
  include: {
    personalInfo: true;
    skills: true;
    education: true;
    experiences: true;
    projects: true;
    links: true;
  };
}>;

@Injectable()
export class ResumeRepository {
  constructor(private db: DbService) {}

  private generatedResumeData(data: GeneratedResumeDto, aiModel: string) {
    return {
      aiModel,
      summary: data.summary,
      personalInfo: { create: data.personalInfo },
      skills: { create: data.skills },
      education: {
        create: data.education.map((education, order) => ({
          university: education.university,
          degree: education.degree,
          fieldOfStudy: education.fieldOfStudy,
          startDate: education.startDate,
          endDate: education.endDate ?? '',
          order,
        })),
      },
      experiences: {
        create: data.experience.map((experience, order) => ({
          company: experience.company,
          position: experience.position,
          startDate: experience.startDate,
          endDate: experience.endDate ?? '',
          responsibilities: experience.responsibilities,
          technologies: experience.technologies ?? [],
          order,
        })),
      },
      projects: {
        create: data.projects.map((project, order) => ({
          title: project.title,
          technologies: project.technologies,
          features: project.features,
          url: project.url,
          order,
        })),
      },
      links: {
        create: (data.links ?? []).map((link, order) => ({
          url: link.url,
          type: link.type,
          order,
        })),
      },
    };
  }

  async createResume(
    body: CreateResumeDto,
    generated: { aiModel: string; data: GeneratedResumeDto },
    userId: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const resume = await tx.resume.create({
        data: {
          userId,
          type: body.type,
          generatedResumes: {
            create: this.generatedResumeData(generated.data, generated.aiModel),
          },
        },
      });

      await tx.resume.update({
        where: { id: resume.id },
        data: { title: `${generated.data.personalInfo.fullName} - ${resume.id}` },
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
  }

  async getResume(id: string) {
    return this.db.resume.findUnique({
      where: { id },
      include: {
        generatedResumes: {
          include: {
            personalInfo: true,
            skills: true,
            education: { orderBy: { order: 'asc' } },
            experiences: { orderBy: { order: 'asc' } },
            projects: { orderBy: { order: 'asc' } },
            links: { orderBy: { order: 'asc' } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async getResumeForDuplicate(id: string) {
    return this.getResume(id);
  }

  async duplicateResume(
    sourceResume: NonNullable<
      Awaited<ReturnType<ResumeRepository['getResumeForDuplicate']>>
    >,
    generatedResume: GeneratedResumeWithDetails,
    userId: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const resume = await tx.resume.create({
        data: {
          userId,
          type: sourceResume.type,
          generatedResumes: {
            create: {
              aiModel: generatedResume.aiModel,
              summary: generatedResume.summary,
              personalInfo: generatedResume.personalInfo
                ? {
                    create: {
                      fullName: generatedResume.personalInfo.fullName,
                      email: generatedResume.personalInfo.email,
                      phone: generatedResume.personalInfo.phone,
                      address: generatedResume.personalInfo.address,
                    },
                  }
                : undefined,
              skills: generatedResume.skills
                ? {
                    create: {
                      soft: generatedResume.skills.soft,
                      languages: generatedResume.skills.languages,
                      technical: generatedResume.skills.technical,
                    },
                  }
                : undefined,
              education: {
                create: generatedResume.education.map((education) => ({
                  university: education.university,
                  degree: education.degree,
                  fieldOfStudy: education.fieldOfStudy,
                  startDate: education.startDate,
                  endDate: education.endDate,
                  order: education.order,
                })),
              },
              experiences: {
                create: generatedResume.experiences.map((experience) => ({
                  company: experience.company,
                  position: experience.position,
                  startDate: experience.startDate,
                  endDate: experience.endDate,
                  responsibilities: experience.responsibilities,
                  technologies: experience.technologies,
                  order: experience.order,
                })),
              },
              projects: {
                create: generatedResume.projects.map((project) => ({
                  title: project.title,
                  technologies: project.technologies,
                  features: project.features,
                  url: project.url,
                  order: project.order,
                })),
              },
              links: {
                create: ((generatedResume as any).links ?? []).map((link: any) => ({
                  url: link.url,
                  type: link.type,
                  order: link.order,
                })),
              },
            },
          },
        },
      });

      const title = generatedResume.personalInfo
        ? `${generatedResume.personalInfo.fullName} - ${resume.id}`
        : resume.id;

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
        ...(excludeResumeId ? { id: { not: excludeResumeId } } : {}),
      },
      select: { id: true },
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
    data: GeneratedResumeDto,
    aiModel: string,
  ) {
    const latestVersion = await this.db.generatedResume.aggregate({
      where: { resumeId },
      _max: { version: true },
    });

    return this.db.generatedResume.create({
      data: {
        resumeId,
        version: (latestVersion._max.version ?? 0) + 1,
        ...this.generatedResumeData(data, aiModel),
      },
    });
  }
}
