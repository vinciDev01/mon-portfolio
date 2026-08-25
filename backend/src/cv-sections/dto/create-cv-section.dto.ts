import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

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
      'Rang dans le CV. La base occupe 10 (presentation), 30 (technologies), ' +
      '40 (certifications), 50 (experiences) et 60 (projets) : une valeur de ' +
      '20 intercale donc la section entre la presentation et les technologies.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  sortOrder?: number;
}
