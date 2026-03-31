import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  async getPortfolio() {
    const [
      siteSettings,
      personalInfo,
      presentations,
      skills,
      experiences,
      certifications,
      rawProjects,
      rawServices,
      about,
    ] = await Promise.all([
      this.prisma.siteSettings.findFirst(),
      this.prisma.personalInfo.findFirst(),
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
        },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.service.findMany({
        include: { organization: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.about.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);

    const projects = rawProjects.map((project) => ({
      ...project,
      technologies: project.technologies.map((pt) => pt.technology),
    }));

    const services = rawServices.map((service) => ({
      ...service,
    }));

    return {
      siteSettings,
      personalInfo,
      presentations,
      skills,
      experiences,
      certifications,
      projects,
      services,
      about,
    };
  }
}
