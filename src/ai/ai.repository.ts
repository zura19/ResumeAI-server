import { Injectable } from '@nestjs/common';
import { CreateResumeDto } from '../resume/dto/resume.dto';

@Injectable()
export class AiRepository {
  buildResumePrompt(data: CreateResumeDto): string {
    return `
You are a professional resume writer.

Using the information below, generate a resume.

RULES:
- Return ONLY valid JSON
- Do NOT include markdown
- Do NOT include explanations
- Do NOT invent experience

JSON FORMAT:
{
  "personalInfo": {
    "fullName": string,
    "email": string,
    "phone": string,
    "address": string
  },
  "summary": string,
  "skills": {
    "technical": string[],
    "soft": string[]
    "languages": string[],
  },
  "education": {
    "degree": string,
    "field": string,
    "university": string,
    "startDate": string,
    "endDate": string
  }[],
  "experience": {
    "company": string,
    "position": string,
    "startDate": string,
    "endDate": string,
    "responsibilities": string[]
  }[],
  "projects": {
    "title": string,
    "technologies": string[],
    "features": string[],
  }[]
}

WHAT I WANT:
- Professional summary, MINIMUM 200 words
- MINIMUM 3 And MAXIMUM 5 Experience responsibilitie
- MINIMUM 3 And MAXIMUM 5 Project features
- Recognize country code form number and ADD it to phone
- Return ONLY valid JSON



USER DATA:
${JSON.stringify(data, null, 2)}
`;
  }
}

// Create a modern, ATS-friendly resume using the information below.
// Improve wording, make it professional, and keep it concise.
// Do NOT invent fake experience.

// PERSONAL INFO:
// Name: ${data.personalInfo.fullName}
// Email: ${data.personalInfo.email}
// Phone: ${data.personalInfo.phone}
// Address: ${data.personalInfo.address ?? 'N/A'}

// SKILLS:
// Technical: ${data.skills.technical.join(', ')}
// Soft: ${data.skills.soft.join(', ')}
// Languages: ${data.skills.languages.join(', ')}

// EDUCATION:
// ${data.education
//   .map(
//     (edu) => `
// - ${edu.degree} in ${edu.fieldOfStudy}
//   ${edu.university} (${edu.startDate} - ${edu.endDate ?? 'Present'})
// `,
//   )
//   .join('')}

// EXPERIENCE:
// ${
//   data.experience?.length
//     ? data.experience
//         .map(
//           (exp) => `
// - ${exp.position} at ${exp.company}
//   (${exp.startDate} - ${exp.endDate ?? 'Present'})
//   ${exp.description ?? ''}
// `,
//         )
//         .join('')
//     : 'No work experience provided'
// }

// Return the resume in a clean structured format with:
// - Professional summary
// - Skills section
// - Education
// - Experience
