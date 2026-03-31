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
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { UpdateTechnologyDto } from './dto/update-technology.dto';
import { TechnologiesService } from './technologies.service';

@ApiTags('technologies')
@Controller('technologies')
export class TechnologiesController {
  constructor(private readonly technologiesService: TechnologiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all technologies' })
  findAll() {
    return this.technologiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get technology by ID' })
  findOne(@Param('id') id: string) {
    return this.technologiesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a technology' })
  create(@Body() dto: CreateTechnologyDto) {
    return this.technologiesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a technology' })
  update(@Param('id') id: string, @Body() dto: UpdateTechnologyDto) {
    return this.technologiesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a technology' })
  remove(@Param('id') id: string) {
    return this.technologiesService.remove(id);
  }
}
