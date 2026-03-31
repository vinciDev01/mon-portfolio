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
import { AboutService } from './about.service';
import { CreateAboutDto } from './dto/create-about.dto';
import { UpdateAboutDto } from './dto/update-about.dto';

@ApiTags('about')
@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  @ApiOperation({ summary: 'Get all about entries' })
  findAll() {
    return this.aboutService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get about entry by ID' })
  findOne(@Param('id') id: string) {
    return this.aboutService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an about entry' })
  create(@Body() dto: CreateAboutDto) {
    return this.aboutService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an about entry' })
  update(@Param('id') id: string, @Body() dto: UpdateAboutDto) {
    return this.aboutService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an about entry' })
  remove(@Param('id') id: string) {
    return this.aboutService.remove(id);
  }
}
