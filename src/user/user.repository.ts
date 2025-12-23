import { Injectable } from '@nestjs/common';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import { DbService } from 'src/db/db.service';

@Injectable()
export class UserRepository {
  constructor(private db: DbService) {}

  async getAll() {
    return this.db.user.findMany();
  }

  async getById(id: string) {
    return this.db.user.findUnique({
      where: {
        id,
      },
    });
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({
      where: {
        email,
      },
    });
  }

  async create(data: RegisterDto) {
    return this.db.user.create({
      data,
    });
  }
}
