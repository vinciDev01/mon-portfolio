import { PartialType } from '@nestjs/swagger';
import { CreateCvVersionDto } from './create-cv-version.dto';

export class UpdateCvVersionDto extends PartialType(CreateCvVersionDto) {}
