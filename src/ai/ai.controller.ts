import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post()
  async sendMessage(@Body() body: { message: string }) {
    const data = await this.aiService.sendMessage(body);
    return { data };
  }
}
