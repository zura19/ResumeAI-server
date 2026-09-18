import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export enum LinkType {
  facebook = 'facebook',
  github = 'github',
  portfolio = 'portfolio',
  linkedin = 'linkedin',
  twitter = 'twitter',
  website = 'website',
  instagram = 'instagram',
  other = 'other',
}

export class GeneratedLinkDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url!: string;

  @IsEnum(LinkType)
  @IsNotEmpty()
  type!: LinkType;
}
