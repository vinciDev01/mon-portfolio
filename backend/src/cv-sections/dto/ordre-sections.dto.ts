import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * L'ordre complet des sections du CV, de la premiere a la derniere : les
 * cles des sections de la base (« projets ») et les identifiants des
 * sections libres, melanges.
 */
export class OrdreSectionsDto {
  @ApiProperty({
    example: ['presentation', 'projets', 'experiences', '7c1f…'],
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(90)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  ordre: string[];
}
