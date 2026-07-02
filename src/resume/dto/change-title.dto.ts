import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangeTitleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  title: string;
}
