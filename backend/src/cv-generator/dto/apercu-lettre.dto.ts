import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LANGUES_CV } from '../langue-cv';
import { SectionLettreDto } from './section-lettre.dto';

/** La lettre en cours de saisie, pour l'apercu : memes bornes que dans une
 *  version, plus l'en-tete commun s'il est en cours de modification. */
export class ApercuLettreDto {
  @ApiPropertyOptional({ enum: LANGUES_CV, default: 'fr' })
  @IsOptional()
  @IsIn(LANGUES_CV)
  langue?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  enTete?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  destinataire?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lieu?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  date?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  objet?: string | null;

  @ApiPropertyOptional({ type: [SectionLettreDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SectionLettreDto)
  sections?: SectionLettreDto[];
}
