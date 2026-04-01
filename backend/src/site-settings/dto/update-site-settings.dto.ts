import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  faviconPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoPath?: string;

  @ApiPropertyOptional({ example: '#F0E68C' })
  @IsOptional()
  @IsString()
  bgColor?: string;

  @ApiPropertyOptional({ example: '#000000' })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiPropertyOptional({ example: 16 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(8)
  @Max(32)
  fontSize?: number;

  @ApiPropertyOptional({ example: 'Figtree' })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toastMessage?: string;

  @ApiPropertyOptional({ example: 180000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  toastDelayMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cvFilePath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showPresentations?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showSkills?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showExperiences?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showCertifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showProjects?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showServices?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showAbout?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showContact?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showTestimonials?: boolean;

  @ApiPropertyOptional({ example: 'fr' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;
}
