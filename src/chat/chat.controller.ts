import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import type { Chat, Message, User } from '@prisma/client';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import { ChatService } from './chat.service';
import { ProGuard } from 'src/common/guards/pro.guard';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @UseGuards(JwtGuard)
  @Get('/:resumeId')
  async getChat(
    @Param('resumeId') resumeId: string,
    @UserDecorator() user: User,
  ): Promise<ApiResponse<Chat>> {
    const data = await this.chatService.getChat(resumeId, user);
    return { data };
  }

  @UseGuards(JwtGuard)
  @Post('/:resumeId')
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
