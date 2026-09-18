import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class GeneratedProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  //   @IsString()
  //   @IsNotEmpty()
  //   description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional({ each: true })
  features: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional({ each: true })
  technologies: string[];

  @IsOptional()
  @IsString()
  @IsUrl()
  url?: string;
}
