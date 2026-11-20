import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  Matches,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SectionLettreDto } from '../../cv-generator/dto/section-lettre.dto';
import { MOTIF_SECTION_MASQUABLE } from '../../cv-generator/ordre-sections';
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
    description:
      'Sections retirees de cette version : cles de la base, identifiants des sections libres',
    example: ['cours'],
  })
  @IsOptional()
  @IsArray()
  @Matches(MOTIF_SECTION_MASQUABLE, { each: true })
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

  @ApiPropertyOptional({
    description:
      'Projets avec leurs annees, du plus recent ; nul : le reglage du CV',
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  projetsParAnnee?: boolean | null;

  @ApiPropertyOptional({
    description: 'Lettre : le destinataire, une ligne par information',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  lettreDestinataire?: string | null;

  @ApiPropertyOptional({ description: 'Lettre : la ville', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lettreLieu?: string | null;

  @ApiPropertyOptional({
    description: 'Lettre : la date (AAAA-MM-JJ) ; nulle : le jour meme',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  lettreDate?: string | null;

  @ApiPropertyOptional({ description: 'Lettre : l objet', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  lettreObjet?: string | null;

  @ApiPropertyOptional({
    description:
      'Lettre : le corps en sections, de l appel a la formule de politesse ; sans texte : pas de lettre',
    type: [SectionLettreDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SectionLettreDto)
  lettreSections?: SectionLettreDto[];

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
