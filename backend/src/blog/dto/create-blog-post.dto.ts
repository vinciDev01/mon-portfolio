import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBlogPostDto {
  @ApiProperty({ description: 'Title of the blog post' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'URL-friendly slug (unique)' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: 'Relative path to the cover image' })
  @IsOptional()
  @IsString()
  coverImagePath?: string;

  @ApiProperty({ description: 'Full HTML/markdown content of the post' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Short excerpt / summary' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
