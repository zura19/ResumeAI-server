import { Injectable } from '@nestjs/common';
import { CreateResumeDto } from '../resume/dto/resume.dto';
import { GeneratedResumeDto } from 'src/resume/dto/generated-resume/generated-resume.dto';
import { GenerateFeautureDto } from 'src/resume/dto/with-ai/generate-feature.dto';
import { GenerateResponsibilitieDto } from 'src/resume/dto/with-ai/generate-responsibilitie.dto';

@Injectable()
export class AiRepository {
  buildResumePrompt(data: CreateResumeDto): string {
    return `
You are a professional resume writer.

Using the information below, generate a resume.

RULES:
- Your response MUST be valid JSON
- Do NOT include markdown
- Do NOT include '''json
- Do NOT include explanations
- Do NOT invent experience
- ABSOLUTELY NEVER include comments like // or /* */ because it breaks JSON parsing.


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
    "fieldOfStudy": string,
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

  buildSummaryPrompt(data: GeneratedResumeDto): string {
    return `
You are a professional resume writer.

Using the information below, generate a professional summary. There might be summary present already, but you need to improve it.

RULES:
- Do NOT include markdown
- Do NOT include explanations
- Do NOT invent experience

WHAT I WANT:
- Return ONLY valid summary text
- MINIMUM 200 words
- Make it professional and concise



USER DATA:
${JSON.stringify(data, null, 2)}
`;
  }

  experienceResponsibilitiePrompt(data: GenerateResponsibilitieDto): string {
    return `
You are a professional resume writer.

Using the information below, generate a one responsibilitie for the job. there might be responsibilities present already, but you need to make different one.



RULES:
- Do NOT include markdown
- Do NOT include explanations
- Do NOT invent experience
- Do NOT repeat responsibilitie. 

WHAT I WANT:
- Return ONLY valid responsibilitie text
- MAXIMUM 75 words

USER DATA:
${JSON.stringify(data, null, 2)}

`;
  }

  projectFeaturePrompt(data: GenerateFeautureDto): string {
    return `
You are a professional resume writer.

Using the information below, generate a one feature of the project. there might be features present already, but you need to make different one.


RULES:
- Do NOT include markdown
- Do NOT include explanations
- Do NOT invent experience
- Do NOT repeat feature. 

WHAT I WANT:
- Return ONLY valid feature text
- MAXIMUM 75 words

USER DATA:
${JSON.stringify(data, null, 2)}

`;
  }

  updateResumeWithUserPrompt(resume: string, prompt: string): string {
    return `
You are a professional resume writer.
Using the prompt below, update a resume.

resume you SHOULD update:
${resume}

RULES:
- DO NOT change parts that are not in the prompt
- Your response MUST be valid JSON
- DO NOT include markdown
- DO NOT include '''json
- DO NOT include explanations
- DO NOT invent experience
- ABSOLUTELY NEVER include comments like // or /* */ because it breaks JSON parsing.

user prompt:
${prompt}


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
    "fieldOfStudy": string,
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
