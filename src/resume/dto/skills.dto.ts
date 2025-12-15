// dto/skills.dto.ts
import { IsArray, IsString, MinLength } from 'class-validator';

export class SkillsDto {
  @IsArray()
  @MinLength(3, { each: true })
  @IsString({ each: true })
  soft: string[];

  @IsArray()
  @MinLength(1, { each: true })
  @IsString({ each: true })
  languages: string[];

  @IsArray()
  @IsString({ each: true })
  @MinLength(3, { each: true })
  technical: string[];
}
