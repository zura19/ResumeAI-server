import { Injectable } from '@nestjs/common';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import { isSameDay } from 'src/common/lib/isSameDay';
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

  async canUseAi(id: string): Promise<boolean> {
    const LIMIT = 3;

    const user = await this.getById(id);
    if (!user) return false;

    const now = new Date();

    // First time ever
    if (!user.aiLastUsedAt) {
      await this.db.user.update({
        where: { id },
        data: {
          aiUsed: 1,
          aiLastUsedAt: now,
        },
      });

      return true;
    }

    const sameDay = isSameDay(new Date(user.aiLastUsedAt), now);

    // Same day → enforce limit
    if (sameDay) {
      if (user.aiUsed >= LIMIT) {
        return false;
      }

      await this.db.user.update({
        where: { id },
        data: {
          aiUsed: user.aiUsed + 1,
          aiLastUsedAt: now,
        },
      });

      return true;
    }

    // New day → reset counter
    await this.db.user.update({
      where: { id },
      data: {
        aiUsed: 1,
        aiLastUsedAt: now,
      },
    });

    return true;
  }
}

// async function updateAiUsage(id: string, now: Date, number: number) {
//   await this.db.user.update({
//     where: { id },
//     data: {
//       aiUsed: number,
//       aiLastUsedAt: now,
//     },
//   });
// }
