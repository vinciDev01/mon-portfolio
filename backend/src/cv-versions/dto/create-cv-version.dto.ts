import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CLES_SECTIONS_BASE } from '../../cv-generator/ordre-sections';
import { LANGUES_CV } from '../../cv-generator/langue-cv';

/**
 * Une version du CV. Les listes d'identifiants retiennent ce qui entre dans
 * cette version ; une liste vide retient tout.
 */
export class CreateCvVersionDto {
  @ApiProperty({ example: 'Back-end Java, banque' })
  @IsString()
  @MaxLength(80)
  nom: string;

  @ApiPropertyOptional({ enum: LANGUES_CV, default: 'fr' })
  @IsOptional()
  @IsIn(LANGUES_CV)
  langue?: string;

  @ApiPropertyOptional({
    description: 'Poste vise ; vide : celui des reglages du CV',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titrePoste?: string | null;

  @ApiPropertyOptional({
    description: 'Presentation propre a la version ; vide : celle de la base',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  presentation?: string | null;

  @ApiPropertyOptional({
    description: 'Sections de la base retirees de cette version',
    example: ['cours'],
  })
  @IsOptional()
  @IsArray()
  @IsIn(CLES_SECTIONS_BASE, { each: true })
  sectionsMasquees?: string[];

  @ApiPropertyOptional({ description: 'Projets retenus ; vide : tous' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  projetIds?: string[];

  @ApiPropertyOptional({
    description: 'Technologies retenues ; vide : celles cochees « dans le CV »',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(300)
  @IsString({ each: true })
  technologieIds?: string[];

  @ApiPropertyOptional({
    description: 'Competences libres retenues ; vide : toutes',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  competenceIds?: string[];

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
