import { PartialType } from '@nestjs/swagger';
import { CreateTechnologyFamilyDto } from './create-technology-family.dto';

export class UpdateTechnologyFamilyDto extends PartialType(CreateTechnologyFamilyDto) {}
