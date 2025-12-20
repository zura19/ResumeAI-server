import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreateResumeDto } from './dto/resume.dto';

@Injectable()
export class ResumeRepository {
  constructor(private db: DbService) {}

  async createResume(body: CreateResumeDto, generated: string | null) {
    const { personalInfo, education, experience, skills, projects } = body;

    const resume = await this.db.resume.create({
      data: {
        type: body.type,
        generatedResume: generated || '',
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

    return resume;
  }

  async getResume(id: string) {
    return this.db.resume.findUnique({
      where: { id },
      // include: {
      //   personalInfo: true,
      //   skills: true,
      //   education: true,
      //   experiences: true,
      //   projects: true,
      // },
    });
  }

  async updateGeneratedResume(id: string, generatedJSON: string) {
    return this.db.resume.update({
      where: { id },
      data: { generatedResume: generatedJSON },
    });
  }
}
