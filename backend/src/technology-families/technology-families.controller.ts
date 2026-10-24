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
import { CreateTechnologyFamilyDto } from './dto/create-technology-family.dto';
import { UpdateTechnologyFamilyDto } from './dto/update-technology-family.dto';
import { TechnologyFamiliesService } from './technology-families.service';

@ApiTags('technology-families')
@Controller('technology-families')
export class TechnologyFamiliesController {
  constructor(private readonly technologyFamiliesService: TechnologyFamiliesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all technology families' })
  findAll() {
    return this.technologyFamiliesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get technology family by ID' })
  findOne(@Param('id') id: string) {
    return this.technologyFamiliesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a technology family' })
  create(@Body() dto: CreateTechnologyFamilyDto) {
    return this.technologyFamiliesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a technology family' })
  update(@Param('id') id: string, @Body() dto: UpdateTechnologyFamilyDto) {
    return this.technologyFamiliesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a technology family (its technologies go under Autres)' })
  remove(@Param('id') id: string) {
    return this.technologyFamiliesService.remove(id);
  }
}
