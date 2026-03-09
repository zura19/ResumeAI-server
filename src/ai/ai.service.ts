import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { CreateResumeDto } from 'src/resume/dto/resume.dto';
import { AiRepository } from './ai.repository';
import { GeneratedResumeDto } from 'src/resume/dto/generated-resume/generated-resume.dto';
import { GenerateFeautureDto } from 'src/resume/dto/with-ai/generate-feature.dto';
import { GenerateResponsibilitieDto } from 'src/resume/dto/with-ai/generate-responsibilitie.dto';

@Injectable()
export class AiService {
  private readonly ai: Groq;

  constructor(
    private configService: ConfigService,
    private AiRepo: AiRepository,
  ) {
    this.ai = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
    });
  }

  async sendMessage(body: { message: string }) {
    try {
      const { message } = body;
      const response = await this.ai.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: message }],
        stream: false,
      });

      console.log(response);

      const data = {
        id: response.id,
        question: message,
        response: response.choices[0].message.content,
        createdAt: response.created,
      };

      return data;
    } catch (error) {
      console.error('Error communicating with AI:', error);
      throw new BadRequestException(
        error.message || 'Failed to get response from AI service',
      );
    }
  }

  async generateResume(resumeData: CreateResumeDto): Promise<{
    aiModel: string;
    content: string | null;
  }> {
    try {
      const model = 'llama-3.1-8b-instant';
      const prompt = this.AiRepo.buildResumePrompt(resumeData);

      const response = await this.ai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are an expert resume writer' },
          { role: 'user', content: prompt },
        ],
      });

      console.log(response);

      const raw = response.choices[0].message.content as string;
      return {
        aiModel: model,
        content: this.sanitizeJsonResponse(raw),
      };
    } catch (error) {
      console.error('Error communicating with AI:', error);
      throw new BadRequestException(
        error.message || 'Failed to get response from AI service',
      );
    }
  }

  async updateResume(
    resume: string,
    userPrompt: string,
  ): Promise<{
    aiModel: string;
    content: string | null;
    resume: string | null;
  }> {
    try {
      const model = 'llama-3.1-8b-instant';
      const prompt = this.AiRepo.updateResumeWithUserPrompt(resume, userPrompt);

      const response = await this.ai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are an expert resume writer' },
          { role: 'user', content: prompt },
        ],
      });

      console.log(response);

      const raw = response.choices[0].message.content as string;

      const parsed: { content: string; resume: string } = JSON.parse(
        this.sanitizeJsonResponse(raw) as any,
      );

      console.log({
        aiModel: model,
        content: parsed.content,
        resume: parsed.resume,
      });

      return {
        aiModel: model,
        content: parsed.content,
        resume: JSON.stringify(parsed.resume),
      };
    } catch (error) {
      console.error('Error communicating with AI:', error);
      throw new BadRequestException(
        error.message || 'Failed to get response from AI service',
      );
    }
  }

  async generateSummary(
    dataForSummary: GeneratedResumeDto,
  ): Promise<string | null> {
    try {
      const prompt = this.AiRepo.buildSummaryPrompt(dataForSummary);
      const response = await this.ai.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an expert resume writer' },
          { role: 'user', content: prompt },
        ],
      });

      console.log(response);

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error communicating with AI:', error);
      throw new BadRequestException(
        error.message || 'Failed to get response from AI service',
      );
    }
  }

  async generateProjectFeature(
    data: GenerateFeautureDto,
  ): Promise<string | null> {
    try {
      const prompt = this.AiRepo.projectFeaturePrompt(data);

      const response = await this.ai.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an expert resume writer' },
          { role: 'user', content: prompt },
        ],
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        error.message || 'Failed to get response from AI service',
      );
    }
  }

  async generateExperienceResponsibilitie(
    data: GenerateResponsibilitieDto,
  ): Promise<string | null> {
    try {
      const prompt = this.AiRepo.experienceResponsibilitiePrompt(data); // Replace with your actual prompt

      const response = await this.ai.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an expert resume writer' },
          { role: 'user', content: prompt },
        ],
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        error.message || 'Failed to get response from AI service',
      );
    }
  }

  sanitizeJsonResponse(text: string) {
    return text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/\/\/.*$/gm, '') // remove comments
      .trim();
  }
}
