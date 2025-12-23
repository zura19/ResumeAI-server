import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRepository } from 'src/user/user.repository';
import { RegisterDto } from './dtos/register.dto';
import { AuthRepository } from './auth.repository';
import { UserWithoutPassword } from 'src/common/interfaces/user-without-password.interface';
import { LoginDto } from './dtos/login.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private authRepo: AuthRepository,
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
      if (!user) {
        throw new ForbiddenException('Invalid credentials');
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

      return {
        ...user,
        password: undefined,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async logout(res: Response) {
    return this.authRepo.clearJwt(res);
  }
}
