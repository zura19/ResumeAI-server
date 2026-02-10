import { PlanName, User } from '@prisma/client';

export type UserWithPlan = User;

export type UserWithoutPassword = Omit<UserWithPlan, 'password'> & {
  password?: string;
};
