import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { PersonalInfoDto } from '../personal-info.dto';
import { SkillsDto } from '../skills.dto';
import { GeneratedEducationDto } from './generated-education.dto';
import { GeneratedExperienceDto } from './generated-experience.dto';
import { GeneratedProjectDto } from './generated-projects.dto';
import { GeneratedLinkDto } from './generated-link.dto';

export class GeneratedResumeDto {
  @IsString()
  // @IsNotEmpty()
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedLinkDto)
  @IsOptional()
  links?: GeneratedLinkDto[];
}
