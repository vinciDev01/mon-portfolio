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
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { ExperiencesService } from './experiences.service';

@ApiTags('experiences')
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all experiences' })
  findAll() {
    return this.experiencesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get experience by ID' })
  findOne(@Param('id') id: string) {
    return this.experiencesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an experience' })
  create(@Body() dto: CreateExperienceDto) {
    return this.experiencesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an experience' })
  update(@Param('id') id: string, @Body() dto: UpdateExperienceDto) {
    return this.experiencesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an experience' })
  remove(@Param('id') id: string) {
    return this.experiencesService.remove(id);
  }
}
