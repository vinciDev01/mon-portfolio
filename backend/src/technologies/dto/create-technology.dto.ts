import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTechnologyDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoPath?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Faux : la technologie reste au portfolio mais ne sort pas dans le CV',
  })
  @IsOptional()
  @IsBoolean()
  showInCv?: boolean;

  @ApiPropertyOptional({
    example: 'Langages',
    description: 'Famille de la technologie ; le CV les range par famille',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  family?: string | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
