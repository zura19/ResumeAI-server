import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class CanGenerateAiGuard implements CanActivate {
  constructor(private db: DbService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        resumes: { select: { id: true } },
        subscription: {
          include: {
            plan: { select: { totalResumes: true } },
          },
        },
      },
    });

    const limit = user?.subscription?.plan.totalResumes;
    const canGenerate = !!user && !!limit && user.resumes.length < limit;

    if (!canGenerate) {
      throw new BadRequestException(
        'You have reached the limit of resume generation for current plan. Please upgrade your plan.',
      );
    }

    return true;
  }
}
