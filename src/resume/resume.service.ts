import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { DbService } from 'src/db/db.service';

@Injectable()
export class ResumeService {
  constructor(private db: DbService) {}

  async createResume() {
    const personalInfo = {
      fullName: 'Zura Managadze',
      email: 'zuramanagadze10@gmail.com',
      phone: '595885673',
      address: 'Tbilisi, Georgia',
    };
    const education = [
      {
        university: 'Tbilisi State University',
        degree: 'Bachelor',
        fieldOfStudy: 'Computer Science',
        startDate: '2023/09/15',
        endDate: null,
        stillStudying: true,
      },
    ];

    const experience = [
      {
        company: 'IT Center',
        position: 'Frontend Developer',
        description: null,
        startDate: '2025/10/01',
        endDate: '2025/11/19',
        stillWorking: false,
      },
    ];

    const skills = {
      soft: ['Communication', 'Teamwork', 'Problem-solving'],
      languages: ['English', 'Georgian'],
      technical: [
        'ReactJS',
        'NextJS',
        'JavaScript',
        'TypeScript',
        'NestJS',
        'ExpressJS',
      ],
    };

    const projects = [
      {
        title: 'Evently',
        description: 'Event booking web app made with Nextjs',
      },
    ];
    try {
      const resume = await this.db.resume.create({
        data: {
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

      return { success: true, resume };
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }
}
