import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export const NIVEAUX_COURS = ['debutant', 'intermediaire', 'avance'] as const;

export class CreateCoursDto {
  @ApiProperty({ example: 'Java, des bases aux objets' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  titre: string;

  @ApiPropertyOptional({
    description: 'Affiche sur la tranche si le titre est trop long',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  titreCourt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ enum: NIVEAUX_COURS })
  @IsIn(NIVEAUX_COURS)
  niveau: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pages?: number | null;

  /** Le nom rendu par l'envoi du PDF : `<uuid>.pdf`, rien d'autre, pour
   *  qu'aucun chemin ne sorte du dossier prive des cours. */
  @ApiProperty({ example: '0f8e2c1a-3b4d-4e5f-8a9b-0c1d2e3f4a5b.pdf' })
  @Matches(/^[0-9a-f-]{36}\.pdf$/)
  fichier: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  taille: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  technologyId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  publique?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
