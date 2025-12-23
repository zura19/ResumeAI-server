import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateFeautureDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  features: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technologies: string[];
}
