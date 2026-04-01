import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateCollaboratorDto } from './create-collaborator.dto';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photo1Path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photo2Path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  demoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of Technology IDs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologyIds?: string[];

  @ApiPropertyOptional({ type: [CreateCollaboratorDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCollaboratorDto)
  collaborators?: CreateCollaboratorDto[];
}
