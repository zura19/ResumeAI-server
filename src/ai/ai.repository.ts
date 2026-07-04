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
- Your response MUST be parseable by JSON.parse without any cleanup
- Do NOT include markdown
- Do NOT include '''json
- Do NOT include explanations
- Do NOT invent experience
- ABSOLUTELY NEVER include comments like // or /* */ because it breaks JSON parsing.
- Do NOT include unescaped control characters inside strings
- Do NOT include literal line breaks inside JSON string values; use normal sentence spacing instead
- Do NOT include stray slashes, backslashes, "/n", "\\n", or invalid escape sequences in any string value
- If you need a slash as real content, include it only when it exists in the user data
- Every object and array MUST follow the exact JSON schema below
- Do NOT add extra fields


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
    "soft": string[],
    "languages": string[]
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
    "features": string[]
  }[]
}

WHAT I WANT:
- Professional summary, MINIMUM 200 words
- MINIMUM 3 And MAXIMUM 5 Experience responsibilitie
- MINIMUM 3 And MAXIMUM 5 Project features
- Recognize country code form number and ADD it to phone
- Return ONLY valid JSON
- Preserve user-provided arrays exactly in meaning
- If any top-level array is empty, return an empty array for that field and do not add objects to it
- If education is empty, return "education": []
- If an education item has no degree, return "degree": ""
- Do NOT infer or invent a degree when the user did not provide one
- If experience is empty, return "experience": []
- If projects is empty, return "projects": []
- If responsibilities is empty inside an existing experience item, return "responsibilities": []
- If technologies or features is empty inside an existing project item, return an empty array for that field
- Do NOT infer, invent, or add education, experience, projects, responsibilities, technologies, or features when the related user array is empty
- Skills must be based ONLY on the user's skills input
- If technical skills are empty, return "technical": []
- If soft skills are empty, return "soft": []
- If language skills are empty, return "languages": []
- Do NOT infer skills from summary, education, experience, projects, responsibilities, technologies, job titles, or any other field
- You may only fix spelling, grammar, capitalization, or formatting mistakes in skills that the user already provided
- Do NOT add new technical, soft, or language skills



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

  updateResumeWithUserPrompt(
    latestResume: string,
    previousResumes: string[],
    prompt: string,
  ): string {
    return `
You are a professional resume writer.

Your job is to update the CURRENT resume using the user prompt.

CURRENT RESUME (this is the only resume you must modify):
${latestResume}

PREVIOUS VERSIONS (for context only, DO NOT use them as base):
${previousResumes}

USER PROMPT:
${prompt}

RULES:
- ONLY modify the CURRENT RESUME
- NEVER revert to older versions
- DO NOT remove existing information unless the user explicitly asks
- When adding to arrays (skills, languages, etc) ALWAYS preserve existing values
- DO NOT change parts that are not related to the prompt
- DO NOT invent experience
- If an education item has no degree, return "degree": ""
- Do NOT infer or invent a degree when the user did not provide one

OUTPUT RULES:
- Your response MUST be valid JSON
- DO NOT include markdown
- DO NOT include \`\`\`json
- DO NOT include explanations
- ABSOLUTELY NEVER include comments like // or /* */

JSON FORMAT:
{
  "content": string,
  "resume": {
    "personalInfo": {
      "fullName": string,
      "email": string,
      "phone": string,
      "address": string
    },
    "summary": string,
    "skills": {
      "technical": string[],
      "soft": string[],
      "languages": string[]
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
      "features": string[]
    }[]
  }
}
`;
  }
}
