import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * La section en cours de saisie, pour l'apercu. Memes bornes que
 * `CreateCvSectionDto`, sauf le titre, qui peut etre vide : l'apercu suit la
 * frappe, et un titre pas encore saisi ne doit pas faire echouer le rendu.
 */
export class ApercuCvDto {
  @ApiPropertyOptional({ description: 'Id de la section modifiee ; absent pour une nouvelle' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(80)
  titre: string;

  @ApiProperty({ description: 'Une entree par ligne.' })
  @IsString()
  lignes: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  publique?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  sortOrder?: number;
}
