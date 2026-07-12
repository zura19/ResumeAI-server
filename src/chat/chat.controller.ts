import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { minutes, Throttle } from '@nestjs/throttler';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import type { Chat, Message, User } from '@prisma/client';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import { ChatService } from './chat.service';
import { ProGuard } from 'src/common/guards/pro.guard';
import { CanUseAiGuard } from 'src/common/guards/can-use-ai.guard';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @UseGuards(JwtGuard, ProGuard)
  @Get('/:resumeId')
  async getChat(
    @Param('resumeId') resumeId: string,
    @UserDecorator() user: User,
  ): Promise<ApiResponse<Chat>> {
    const data = await this.chatService.getChat(resumeId, user);
    return { data };
  }

  @UseGuards(JwtGuard, ProGuard, CanUseAiGuard)
  @Post('/:resumeId')
  @Throttle({
    default: { limit: 10, ttl: minutes(1), blockDuration: minutes(5) },
  })
  async sendMessage(
    @Param('resumeId') resumeId: string,
    @Body() body: SendMessageDto,
    @UserDecorator() user: User,
  ): Promise<ApiResponse<Message>> {
    const data = await this.chatService.sendMessage(
      resumeId,
      body.message,
      user,
    );
    return { data };
  }
}
