import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { CreateResumeDto } from 'src/resume/dto/resume.dto';
import { AiRepository } from './ai.repository';

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

  async generateResume(resumeData: CreateResumeDto): Promise<string | null> {
    try {
      const prompt = this.AiRepo.buildResumePrompt(resumeData);

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
}
