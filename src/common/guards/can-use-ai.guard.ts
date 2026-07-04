import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class CanUseAiGuard implements CanActivate {
  constructor(private db: DbService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: {
            plan: { select: { aiCreditsPerMonth: true } },
          },
        },
      },
    });

    const limit = user?.subscription?.plan.aiCreditsPerMonth;
    const canUseAi = !!user && !!limit && user.aiCreditsThisMonth < limit;

    if (!canUseAi) {
      throw new BadRequestException(
        'You have reached the limit of AI for current plan. Please upgrade your plan.',
      );
    }

    return true;
  }
}
