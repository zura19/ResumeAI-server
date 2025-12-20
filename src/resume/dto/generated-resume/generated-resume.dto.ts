import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { PersonalInfoDto } from '../personal-info.dto';
import { SkillsDto } from '../skills.dto';
import { GeneratedEducationDto } from './generated-education.dto';
import { GeneratedExperienceDto } from './generated-experience.dto';
import { GeneratedProjectDto } from './generated-projects.dto';

export class GeneratedResumeDto {
  @IsString()
  @IsNotEmpty()
  summary: string;

  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personalInfo: PersonalInfoDto;

  @ValidateNested()
  @Type(() => SkillsDto)
  skills: SkillsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedEducationDto)
  education: GeneratedEducationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedExperienceDto)
  experience: GeneratedExperienceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedProjectDto)
  projects: GeneratedProjectDto[];
}
