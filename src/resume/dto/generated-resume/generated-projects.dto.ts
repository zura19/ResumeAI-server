import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class GeneratedProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  //   @IsString()
  //   @IsNotEmpty()
  //   description: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  features: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  technologies: string[];
}
