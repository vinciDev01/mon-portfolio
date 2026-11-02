import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FORMATS_SECTION } from '../../cv-generator/ordre-sections';

export class CreateCvSectionDto {
  @ApiProperty({ example: 'FORMATIONS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  titre: string;

  @ApiProperty({
    example: '2022-2025 : Licence professionnelle, option Genie Logiciel',
    description: 'Une entree par ligne.',
  })
  @IsString()
  lignes: string;

  @ApiPropertyOptional({
    default: true,
    description:
      'Fausse pour tout ce qui ne doit pas partir dans le CV telechargeable.',
  })
  @IsOptional()
  @IsBoolean()
  publique?: boolean;

  @ApiPropertyOptional({
    default: 0,
    description:
      'Rang dans le CV, parmi les sections de la base. Absent a la ' +
      'creation : la section se place en fin de CV.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Version anglaise, pour le CV en anglais ; vide : le francais',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titreEn?: string | null;

  @ApiPropertyOptional({
    description: 'Version anglaise, pour le CV en anglais ; vide : le francais',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(6000)
  lignesEn?: string | null;

  @ApiPropertyOptional({
    enum: FORMATS_SECTION,
    default: 'puces',
    description:
      'Presentation du corps : une puce par entree, les entrees separees ' +
      'par des virgules, ou une entree par ligne sans puce.',
  })
  @IsOptional()
  @IsIn(FORMATS_SECTION)
  format?: string;
}
