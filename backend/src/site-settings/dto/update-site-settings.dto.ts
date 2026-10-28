import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CLES_SECTIONS_BASE } from '../../cv-generator/ordre-sections';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
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

  @ApiPropertyOptional({ example: '#131518' })
  @IsOptional()
  @IsString()
  bgColor?: string;

  @ApiPropertyOptional({ example: '#E4E5E3' })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiPropertyOptional({ example: 17 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(8)
  @Max(32)
  fontSize?: number;

  @ApiPropertyOptional({ example: 'IBM Plex Sans' })
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
  @IsIn(['fr', 'en', 'de'])
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

  @ApiPropertyOptional({ example: 'auto' })
  @IsOptional()
  @IsIn(['auto', 'clair', 'sombre'])
  themeParDefaut?: string;

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

  // --- CV genere ---

  @ApiPropertyOptional({ example: 'serif' })
  @IsOptional()
  @IsIn(['serif', 'sans'])
  cvFontFamily?: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Le CV n est telechargeable depuis le site que si cette case est cochee.',
  })
  @IsOptional()
  @IsBoolean()
  showCvDownload?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Affiche la section Cours',
  })
  @IsOptional()
  @IsBoolean()
  showCours?: boolean;

  @ApiPropertyOptional({
    example: 'Developpeur Java Spring Boot',
    description:
      'Poste vise, imprime sous le nom en tete du CV ; vide, pas de ligne',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  cvJobTitle?: string | null;

  @ApiPropertyOptional({
    example: 'https://fanuel-benyo.dev',
    description:
      'Adresse publique du portfolio : lien et QR code du CV ; vide, ni l un ni l autre',
    nullable: true,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(200)
  siteUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Affiche le QR code du portfolio en tete du CV',
  })
  @IsOptional()
  @IsBoolean()
  cvAfficherQr?: boolean;

  @ApiPropertyOptional({ description: '« Fait a ..., le ... » en fin de CV' })
  @IsOptional()
  @IsBoolean()
  cvFaitA?: boolean;

  @ApiPropertyOptional({
    description: 'Lieu du « Fait a » ; vide : une ligne a remplir',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  cvLieu?: string | null;

  @ApiPropertyOptional({
    description:
      'Date du « Fait a » (AAAA-MM-JJ) ; vide : le jour de la generation',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  cvDateFaitA?: string | null;

  @ApiPropertyOptional({
    description: 'Reserve un blanc pour signer sous la date',
  })
  @IsOptional()
  @IsBoolean()
  cvEspaceSignature?: boolean;

  @ApiPropertyOptional({
    example: ['technologies'],
    description: 'Sections de la base retirees du CV ; vide : toutes incluses',
  })
  @IsOptional()
  @IsArray()
  @IsIn(CLES_SECTIONS_BASE, { each: true })
  cvBaseMasquees?: string[];

  // --- Accent ---

  @ApiPropertyOptional({ example: 107 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(360)
  accentHue?: number;

  @ApiPropertyOptional({
    example: 16,
    description: 'Plafonne a 30 : interdit structurellement toute couleur vive',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  accentSaturation?: number;

  @ApiPropertyOptional({
    description: 'Version anglaise, pour le CV en anglais ; vide : le francais',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  cvJobTitleEn?: string | null;
}
