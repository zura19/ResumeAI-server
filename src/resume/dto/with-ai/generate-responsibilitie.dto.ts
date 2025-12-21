import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class GenerateResponsibilitieDto {
  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  responsibilities: string[];
}
