import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTechnologyFamilyDto {
  @ApiProperty({ description: 'Nom de la famille, unique' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Version anglaise, pour le CV en anglais ; vide : le francais', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nameEn?: string | null;
}
