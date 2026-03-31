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
import { CertificationsService } from './certifications.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';

@ApiTags('certifications')
@Controller('certifications')
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all certifications with organization' })
  findAll() {
    return this.certificationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get certification by ID' })
  findOne(@Param('id') id: string) {
    return this.certificationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a certification' })
  create(@Body() dto: CreateCertificationDto) {
    return this.certificationsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a certification' })
  update(@Param('id') id: string, @Body() dto: UpdateCertificationDto) {
    return this.certificationsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a certification' })
  remove(@Param('id') id: string) {
    return this.certificationsService.remove(id);
  }
}
