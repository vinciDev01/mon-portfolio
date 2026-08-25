import { PartialType } from '@nestjs/swagger';
import { CreateCvSectionDto } from './create-cv-section.dto';

export class UpdateCvSectionDto extends PartialType(CreateCvSectionDto) {}
