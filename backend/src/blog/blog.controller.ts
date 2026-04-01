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
import { BlogService } from './blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all published blog posts (public)' })
  findAllPublished() {
    return this.blogService.findAllPublished();
  }

  // 'all' must be declared before ':slug' to avoid route conflicts
  @Get('all')
  @ApiOperation({ summary: 'Get all blog posts including unpublished (backoffice)' })
  findAll() {
    return this.blogService.findAll();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a blog post by slug (public)' })
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create a blog post' })
  create(@Body() dto: CreateBlogPostDto) {
    return this.blogService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a blog post' })
  update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a blog post' })
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
