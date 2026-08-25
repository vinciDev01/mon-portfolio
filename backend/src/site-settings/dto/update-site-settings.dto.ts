import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowTestimonialSubmission?: boolean;

  @ApiPropertyOptional({ example: 'fr' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiPropertyOptional({ example: 'available' })
  @IsOptional()
  @IsString()
  availabilityStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  availabilityLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoImagePath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notificationEmail?: string;

  // --- Lampe d'atelier ---

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  lampEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  lampOnByDefault?: boolean;

  @ApiPropertyOptional({ example: 28, description: 'Ouverture totale du faisceau en degres' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(8)
  @Max(45)
  lampBeamAngle?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  lampIntensity?: number;

  @ApiPropertyOptional({ example: 40, description: 'Au-dela de 40, le contraste hors faisceau passe sous le seuil AA' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65)
  lampDimLevel?: number;

  // --- Visibilite ---

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showStats?: boolean;

  // --- Rythme typographique ---

  @ApiPropertyOptional({ example: 'normal' })
  @IsOptional()
  @IsIn(['compact', 'normal', 'airy'])
  typeScale?: string;

  @ApiPropertyOptional({ example: 1.6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1.3)
  @Max(2.0)
  lineHeight?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  zigzagAmplitude?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(64)
  @Max(240)
  sectionSpacing?: number;

  // --- Mouvement ---

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  animationsEnabled?: boolean;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  animationSpeed?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  respectReducedMotion?: boolean;

  // --- Accent ---

  @ApiPropertyOptional({ example: 107 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(360)
  accentHue?: number;

  @ApiPropertyOptional({ example: 16, description: 'Plafonne a 30 : interdit structurellement toute couleur vive' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  accentSaturation?: number;
}
