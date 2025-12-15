// dto/create-resume.dto.ts
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { PersonalInfoDto } from './personal-info.dto';
import { SkillsDto } from './skills.dto';
import { EducationDto } from './education.dto';
import { ExperienceDto } from './experience.dto';
import { ProjectDto } from './project.dto';

export class CreateResumeDto {
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personalInfo: PersonalInfoDto;

  @ValidateNested()
  @Type(() => SkillsDto)
  skills: SkillsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education: EducationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience: ExperienceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects: ProjectDto[];
}

// {
//   "personalInfo": {
//     "fullName": "Zurab Managadze",
//     "email": "zurab.managadze@gmail.com",
//     "phone": "+995 599 12 34 56",
//     "address": "Tbilisi, Georgia"
//   },
//   "skills": {
//     "soft": ["Communication", "Problem Solving", "Teamwork"],
//     "languages": ["Georgian", "English"],
//     "technical": ["JavaScript", "TypeScript", "React", "NestJS", "PostgreSQL"]
//   },
//   "education": [
//     {
//       "university": "Business and Technology University",
//       "degree": "Bachelor",
//       "fieldOfStudy": "Computer Science",
//       "startDate": "2021-09",
//       "stillStudying": true
//     }
//   ],
//   "experiences": [
//     {
//       "company": "DeedsGood",
//       "position": "Full-Stack Developer",
//       "description": "Worked on a social-commerce web application using MERN stack.",
//       "startDate": "2023-01",
//       "endDate": "2024-02",
//       "stillWorking": false
//     },
//     {
//       "company": "Mensa Philosophical Circle",
//       "position": "Full-Stack Developer",
//       "description": "Built and maintained web applications remotely.",
//       "startDate": "2024-03",
//       "stillWorking": true
//     }
//   ],
//   "projects": [
//     {
//       "title": "AI Resume Builder",
//       "description": "Web app that generates resumes and cover letters using AI."
//     },
//     {
//       "title": "E-commerce Platform",
//       "description": "Full-featured online store with authentication, payments, and admin panel."
//     }
//   ]
// }
