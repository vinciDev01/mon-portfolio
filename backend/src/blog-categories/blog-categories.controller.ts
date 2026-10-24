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
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';
import { BlogCategoriesService } from './blog-categories.service';

@ApiTags('blog-categories')
@Controller('blog-categories')
export class BlogCategoriesController {
  constructor(private readonly blogCategoriesService: BlogCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all blog categories' })
  findAll() {
    return this.blogCategoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blog category by ID' })
  findOne(@Param('id') id: string) {
    return this.blogCategoriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a blog category' })
  create(@Body() dto: CreateBlogCategoryDto) {
    return this.blogCategoriesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a blog category' })
  update(@Param('id') id: string, @Body() dto: UpdateBlogCategoryDto) {
    return this.blogCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a blog category (its posts become uncategorized)' })
  remove(@Param('id') id: string) {
    return this.blogCategoriesService.remove(id);
  }
}
