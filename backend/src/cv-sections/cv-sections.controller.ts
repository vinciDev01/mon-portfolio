import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCvSectionDto } from './dto/create-cv-section.dto';
import { UpdateCvSectionDto } from './dto/update-cv-section.dto';
import { OrdreSectionsDto } from './dto/ordre-sections.dto';
import { CvSectionsService } from './cv-sections.service';

@ApiTags('cv-sections')
@Controller('cv-sections')
export class CvSectionsController {
  constructor(private readonly cvSectionsService: CvSectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all CV sections' })
  findAll() {
    return this.cvSectionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CV section by ID' })
  findOne(@Param('id') id: string) {
    return this.cvSectionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a CV section' })
  create(@Body() dto: CreateCvSectionDto) {
    return this.cvSectionsService.create(dto);
  }

  /** Les fleches de la page « Sections du CV » : l'ordre complet, d'un coup. */
  @Put('ordre')
  @ApiOperation({ summary: 'Reorder every CV section, database ones included' })
  reordonner(@Body() dto: OrdreSectionsDto) {
    return this.cvSectionsService.reordonner(dto.ordre);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a CV section' })
  update(@Param('id') id: string, @Body() dto: UpdateCvSectionDto) {
    return this.cvSectionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CV section' })
  remove(@Param('id') id: string) {
    return this.cvSectionsService.remove(id);
  }
}
