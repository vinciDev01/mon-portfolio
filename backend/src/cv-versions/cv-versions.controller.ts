import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCvVersionDto } from './dto/create-cv-version.dto';
import { UpdateCvVersionDto } from './dto/update-cv-version.dto';
import { CvVersionsService } from './cv-versions.service';

@ApiTags('cv-versions')
@Controller('cv-versions')
export class CvVersionsController {
  constructor(private readonly service: CvVersionsService) {}

  @Get()
  @ApiOperation({ summary: 'Les versions du CV (administrateur)' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Une version du CV (administrateur)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Creer une version du CV (administrateur)' })
  create(@Body() dto: CreateCvVersionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une version du CV (administrateur)' })
  update(@Param('id') id: string, @Body() dto: UpdateCvVersionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une version du CV (administrateur)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
