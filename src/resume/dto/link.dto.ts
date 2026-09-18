// dto/link.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LinkType } from './generated-resume/generated-link.dto';

export class LinkDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsEnum(LinkType)
  @IsOptional()
  type?: LinkType;
}
