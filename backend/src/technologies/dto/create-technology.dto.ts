import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTechnologyDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoPath?: string;

  @ApiPropertyOptional({
    description: 'Identifiant du logo dans le catalogue (« openjdk ») ; null : aucun',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  logoSlug?: string | null;

  @ApiPropertyOptional({
    default: true,
    description:
      'Faux : la technologie reste au portfolio mais ne sort pas dans le CV',
  })
  @IsOptional()
  @IsBoolean()
  showInCv?: boolean;

  @ApiPropertyOptional({
    description: 'Famille de la technologie (liste geree) ; null : « Autres »',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  familyId?: string | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
