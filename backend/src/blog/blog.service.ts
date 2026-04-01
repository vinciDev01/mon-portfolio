import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublished() {
    return this.prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`BlogPost #${id} not found`);
    return record;
  }

  async findBySlug(slug: string) {
    const record = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (!record) throw new NotFoundException(`BlogPost with slug "${slug}" not found`);
    return record;
  }

  create(dto: CreateBlogPostDto) {
    const data: typeof dto & { publishedAt?: Date } = { ...dto };
    if (data.isPublished && !('publishedAt' in dto)) {
      data.publishedAt = new Date();
    }
    return this.prisma.blogPost.create({ data });
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    await this.findOne(id);
    const data: typeof dto & { publishedAt?: Date } = { ...dto };
    if (data.isPublished && !('publishedAt' in dto)) {
      data.publishedAt = new Date();
    }
    return this.prisma.blogPost.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.blogPost.delete({ where: { id } });
  }
}
