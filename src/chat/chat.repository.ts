import { Injectable } from '@nestjs/common';
import { Chat, Message } from '@prisma/client';
import { DbService } from 'src/db/db.service';

@Injectable()
export class ChatRepository {
  constructor(private db: DbService) {}

  async getChatByResumeId(resumeId: string): Promise<Chat | null> {
    const chat = await this.db.chat.findFirst({
      where: { resumeId },
      include: { messages: true },
    });
    return chat;
  }

  async createChat(resumeId: string): Promise<Chat> {
    return this.db.chat.create({
      data: { resumeId },
      include: { messages: true },
    });
  }

  async checkResumeExists(resumeId: string, userId: string): Promise<boolean> {
    const resume = await this.db.resume.findFirst({ where: { id: resumeId } });
    if (!resume || resume.userId !== userId) return false;
    return true;
  }

  async checkChatExists(resumeId: string): Promise<Chat | null> {
    return this.db.chat.findFirst({ where: { resumeId } });
  }

  async saveMessages(
    chatId: string,
    messages: {
      userMessage: string;
      aiMessage: string;
    },
    generatedResumeId: string,
  ): Promise<Message> {
    const user = messages.userMessage.trim();
    const ai = messages.aiMessage.trim();

    const message = await this.db.$transaction(async (tx) => {
      const userMessage = await tx.message.create({
        data: {
          chatId,
          content: user,
          sender: 'user',
        },
      });

      const aiMessage = await tx.message.create({
        data: {
          chatId,
          sender: 'ai',
          content: ai,
          generatedResumeId,
        },
      });
      return aiMessage;
    });

    return message;
  }

  async saveUserMessage(
    chatId: string,
    userId: string,
    message: string,
  ): Promise<Message> {
    return this.db.message.create({
      data: {
        chatId,
        sender: 'user',
        content: message,
      },
    });
  }

  async saveAiMessage(chatId: string, aiId: string, message: string) {
    return this.db.message.create({
      data: {
        chatId,
        sender: 'ai',
        content: message,
        generatedResumeId: aiId,
      },
    });
  }
}
