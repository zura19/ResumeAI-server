import { IsNotEmpty, IsString } from 'class-validator';

export class getUniversitiesQueryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
