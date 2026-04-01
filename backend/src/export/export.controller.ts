import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('export')
@Controller('export')
export class ExportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('data')
  @ApiOperation({ summary: 'Export all portfolio data as JSON' })
  async exportData() {
    const [
      siteSettings,
      personalInfo,
      technologies,
      organizations,
      presentations,
      skills,
      experiences,
      certifications,
      projects,
      services,
      about,
      contactMessages,
      testimonials,
      blogPosts,
    ] = await Promise.all([
      this.prisma.siteSettings.findFirst(),
      this.prisma.personalInfo.findFirst(),
      this.prisma.technology.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.organization.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.presentation.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.skill.findMany({
        include: { technology: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.experience.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.certification.findMany({
        include: { organization: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.project.findMany({
        include: {
          technologies: { include: { technology: true } },
          collaborators: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.service.findMany({
        include: { organization: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.about.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      siteSettings,
      personalInfo,
      technologies,
      organizations,
      presentations,
      skills,
      experiences,
      certifications,
      projects,
      services,
      about,
      contactMessages,
      testimonials,
      blogPosts,
    };
  }
}
