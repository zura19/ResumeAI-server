import { ResumeType } from '@prisma/client';
import { UserWithoutPassword } from 'src/common/interfaces/user-without-password.interface';

export class ProfileResponseDto {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  resumes:
    | { id: string; title: string; type: ResumeType; createdAt: Date }[]
    | [];
}
