import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Une competence liee a une technologie (`technologyId`), ou libre (`label`,
 * et sa famille `familyId`). L'un des deux est requis : le service le verifie,
 * la regle portant sur deux champs a la fois.
 */
export class CreateSkillDto {
  @ApiPropertyOptional({ description: 'Technologie liee ; vide pour une competence libre', nullable: true })
  @IsOptional()
  @IsString()
  technologyId?: string | null;

  @ApiPropertyOptional({ description: 'Nom d une competence libre (Management)', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string | null;

  @ApiPropertyOptional({ description: 'Famille d une competence libre', nullable: true })
  @IsOptional()
  @IsString()
  familyId?: string | null;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  proficiency?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
