import { Injectable, NotFoundException } from '@nestjs/common';
import { ResumeService } from 'src/resume/resume.service';
import { ChatRepository } from './chat.repository';
import { Chat, User } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private resumeService: ResumeService,
  ) {}

  async getChat(resumeId: string, user: User): Promise<Chat> {
    const isResumeExists = await this.chatRepository.checkResumeExists(
      resumeId,
      user.id,
    );
    if (!isResumeExists) {
      throw new NotFoundException('Resume not found or not owned by user');
    }

    let chat = await this.chatRepository.getChatByResumeId(resumeId);
    if (!chat) {
      chat = await this.chatRepository.createChat(resumeId);
    }

    return chat;
  }

  async sendMessage(id: string, message: string, user: User) {
    const isChatExists = await this.chatRepository.checkChatExists(id);
    if (!isChatExists) {
      throw new NotFoundException('Chat not found');
    }

    const generatedResume =
      await this.resumeService.createAnotherVersionOfResume(
        id,
        message,
        user.id,
      );

    await this.chatRepository.saveUserMessage(
      isChatExists.id,
      user.id,
      message,
    );

    await this.chatRepository.saveAiMessage(
      isChatExists.id,
      generatedResume.id,
      'AI generated resume',
    );

    return generatedResume;
  }
}
