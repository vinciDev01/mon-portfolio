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
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsService } from './skills.service';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all skills with technology relation' })
  findAll() {
    return this.skillsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get skill by ID' })
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a skill' })
  create(@Body() dto: CreateSkillDto) {
    return this.skillsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a skill' })
  update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skillsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a skill' })
  remove(@Param('id') id: string) {
    return this.skillsService.remove(id);
  }
}
