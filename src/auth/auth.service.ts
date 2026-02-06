import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from 'src/user/user.repository';
import { RegisterDto } from './dtos/register.dto';
import { AuthRepository } from './auth.repository';
import { UserWithoutPassword } from 'src/common/interfaces/user-without-password.interface';
import { LoginDto } from './dtos/login.dto';
import { Response } from 'express';
import { PlanName, User } from '@prisma/client';
import { SubscriptionRepository } from 'src/subscription/subcscription.repository';

@Injectable()
export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private authRepo: AuthRepository,
    private subscriptionRepo: SubscriptionRepository,
  ) {}

  async register(body: RegisterDto): Promise<UserWithoutPassword> {
    try {
      const userExist = await this.userRepo.findByEmail(body.email);

      if (userExist) {
        throw new ConflictException('User already exist');
      }

      const hashedPassword = await this.authRepo.hashPassword(body.password);

      const user = await this.userRepo.create({
        ...body,
        password: hashedPassword,
      });

      const plan = await this.subscriptionRepo.createSubscription(
        user.id,
        'free',
      );

      // const plan = (await this.userRepo.getUserPlanByUserId(
      // user.id,
      // )) as PlanName;

      return {
        ...user,
        password: undefined,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async login(body: LoginDto, res: Response): Promise<UserWithoutPassword> {
    try {
      const user = await this.userRepo.findByEmail(body.email);
      if (!user || !user.id || !user.email) {
        throw new ForbiddenException('Invalid credentials');
      }
      if (!user.password) {
        throw new BadRequestException('Invalid credentials');
      }

      const isMatch = await this.authRepo.comparePassword(
        body.password,
        user.password as string,
      );

      if (!isMatch) {
        throw new ForbiddenException('Invalid credentials');
      }

      const jwt = await this.authRepo.generateJwt(user.id, user.email);
      this.authRepo.signJwt(res, jwt.access_token);

      // const plan = (await this.userRepo.getUserPlanByUserId(
      // user.id,
      // )) as PlanName;

      return {
        ...user,
        password: undefined,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async googleLogin(req: any): Promise<UserWithoutPassword> {
    if (!req.user) {
      throw new NotFoundException('User not found');
    }

    let user = await this.userRepo.findByEmail(req.user.email);

    if (!user) {
      user = await this.userRepo.create(
        {
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          password: '',
        },
        'google',
      );
      const plan = await this.subscriptionRepo.createSubscription(
        user.id,
        'free',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const jwt = await this.authRepo.generateJwt(payload.sub, payload.email);
    this.authRepo.signJwt(req.res, jwt.access_token);
    // const plan = (await this.userRepo.getUserPlanByUserId(user.id)) as PlanName;

    return {
      ...user,
      password: undefined,
    };
  }

  async logout(res: Response) {
    return this.authRepo.clearJwt(res);
  }
}
