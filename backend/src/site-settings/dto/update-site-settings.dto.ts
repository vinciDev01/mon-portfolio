import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
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
}
