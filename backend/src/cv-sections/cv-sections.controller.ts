import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCvSectionDto } from './dto/create-cv-section.dto';
import { UpdateCvSectionDto } from './dto/update-cv-section.dto';
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
