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
import { Public } from '../auth/auth.guard';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@ApiTags('testimonials')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all testimonials' })
  findAll() {
    return this.testimonialsService.findAll();
  }

  @Public()
  @Get('approved')
  @ApiOperation({ summary: 'Get approved testimonials (public)' })
  findApproved() {
    return this.testimonialsService.findApproved();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get testimonial by ID' })
  findOne(@Param('id') id: string) {
    return this.testimonialsService.findOne(id);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Submit a testimonial (public)' })
  create(@Body() dto: CreateTestimonialDto) {
    return this.testimonialsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a testimonial' })
  update(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) {
    return this.testimonialsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a testimonial' })
  remove(@Param('id') id: string) {
    return this.testimonialsService.remove(id);
  }
}
