import { Transform } from 'class-transformer';
import { trimString } from 'src/common/helpers/trim-string.helper';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ContactRequestDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Matches(/^[^\r\n]+$/, {
    message: 'email must not contain newlines',
  })
  email: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  @Matches(/^[^\r\n]+$/, {
    message: 'title must not contain newlines',
  })
  title: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description: string;
}
