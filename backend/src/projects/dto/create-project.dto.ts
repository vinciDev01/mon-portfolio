import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

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
}
