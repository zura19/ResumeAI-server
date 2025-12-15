import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DbService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Database connected');
    } catch (error) {
      console.log(error);
    }
  }
  constructor(configService: ConfigService) {
    super({
      datasources: { db: { url: configService.get('DATABASE_URL') } },
    });
  }
}
