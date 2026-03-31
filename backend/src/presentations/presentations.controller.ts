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
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { UpdatePresentationDto } from './dto/update-presentation.dto';
import { PresentationsService } from './presentations.service';

@ApiTags('presentations')
@Controller('presentations')
export class PresentationsController {
  constructor(private readonly presentationsService: PresentationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all presentations' })
  findAll() {
    return this.presentationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get presentation by ID' })
  findOne(@Param('id') id: string) {
    return this.presentationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a presentation' })
  create(@Body() dto: CreatePresentationDto) {
    return this.presentationsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a presentation' })
  update(@Param('id') id: string, @Body() dto: UpdatePresentationDto) {
    return this.presentationsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a presentation' })
  remove(@Param('id') id: string) {
    return this.presentationsService.remove(id);
  }
}
