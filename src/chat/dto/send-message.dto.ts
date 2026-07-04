import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  message: string;
}
