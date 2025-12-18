// dto/personal-info.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class PersonalInfoDto {
  @IsString()
  @IsNotEmpty()
  // make sure that it's firstname + lastname separated by space with:
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}
