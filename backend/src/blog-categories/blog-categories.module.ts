import { Module } from '@nestjs/common';
import { BlogCategoriesController } from './blog-categories.controller';
import { BlogCategoriesService } from './blog-categories.service';

@Module({
  controllers: [BlogCategoriesController],
  providers: [BlogCategoriesService],
})
export class BlogCategoriesModule {}
