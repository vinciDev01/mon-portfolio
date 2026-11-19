import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Une section du corps de la lettre : un titre facultatif, en gras, et un
 *  texte dont les paragraphes sont separes par une ligne vide. */
export class SectionLettreDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titre?: string | null;

  @ApiProperty()
  @IsString()
  @MaxLength(6000)
  corps: string;
}
