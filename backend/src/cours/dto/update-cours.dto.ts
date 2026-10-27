import { PartialType } from '@nestjs/swagger';
import { CreateCoursDto } from './create-cours.dto';

export class UpdateCoursDto extends PartialType(CreateCoursDto) {}
