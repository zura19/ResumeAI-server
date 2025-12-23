import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateResponsibilitieDto {
  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsibilities: string[];
}
