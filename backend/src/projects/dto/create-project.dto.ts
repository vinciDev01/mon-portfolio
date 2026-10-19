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

  /**
   * L'adresse de la DEMONSTRATION : une video, un bac a sable, une maquette
   * jouable. Ce n'est pas le projet lui-meme, voir `projectUrl`.
   */
  @ApiPropertyOptional({
    description: "Adresse de la demonstration (video, bac a sable, maquette)",
  })
  @IsOptional()
  @IsUrl()
  demoUrl?: string;

  /**
   * L'adresse du projet LUI-MEME, son site en ligne. Distincte de `demoUrl`,
   * qui ne montre qu'une demonstration.
   *
   * Obligatoirement declaree ICI : le `ValidationPipe` global de `main.ts`
   * tourne avec `whitelist: true`, donc toute propriete du corps de requete
   * qui n'est pas decoree dans ce DTO est SILENCIEUSEMENT retiree avant
   * d'atteindre le service. Le service, lui, n'enumere rien : il etale
   * `...projectData` vers Prisma. Un champ absent d'ici ne serait donc jamais
   * enregistre, sans la moindre erreur.
   */
  @ApiPropertyOptional({
    description: "Adresse du projet en ligne (le projet lui-meme)",
  })
  @IsOptional()
  @IsUrl()
  projectUrl?: string;

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
