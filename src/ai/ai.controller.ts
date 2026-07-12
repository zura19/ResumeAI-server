import { Body, Controller, Post } from '@nestjs/common';
import { minutes, Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post()
  @Throttle({
    default: { limit: 5, ttl: minutes(1), blockDuration: minutes(5) },
  })
  async sendMessage(@Body() body: { message: string }) {
    const data = await this.aiService.sendMessage(body);
    return { data };
  }
}
