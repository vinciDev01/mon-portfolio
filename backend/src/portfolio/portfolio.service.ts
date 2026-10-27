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
      testimonials,
      blogPosts,
      projectCount,
      certificationCount,
      technologyCount,
      experienceCount,
      rawCours,
      technologies,
    ] = await Promise.all([
      this.prisma.siteSettings.findFirst(),
      this.prisma.personalInfo.findFirst(),
      this.prisma.presentation.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.skill.findMany({
        include: { technology: { include: { family: true } } },
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
      this.prisma.testimonial.findMany({
        where: { isApproved: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.project.count(),
      this.prisma.certification.count(),
      this.prisma.technology.count(),
      this.prisma.experience.count(),
      // Les seuls cours publics : un cours masque n'atteint jamais le site.
      this.prisma.cours.findMany({
        where: { publique: true },
        include: { technology: { include: { family: true } } },
        orderBy: [{ sortOrder: 'asc' }, { titre: 'asc' }],
      }),
      // La boite a outils de la section Competences : toutes les
      // technologies, rangees par famille sur le site.
      this.prisma.technology.findMany({
        include: { family: true },
        orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      }),
    ]);

    // Ni le fichier, ni le compteur, ni la visibilite ne sortent : le site
    // telecharge par la route publique, qui verifie et compte elle-meme.
    const cours = rawCours.map((c: (typeof rawCours)[number]) => ({
      id: c.id,
      titre: c.titre,
      titreCourt: c.titreCourt,
      description: c.description,
      niveau: c.niveau,
      pages: c.pages,
      taille: c.taille,
      updatedAt: c.updatedAt,
      sortOrder: c.sortOrder,
      technology: c.technology,
    }));

    const projects = rawProjects.map(
      (project: (typeof rawProjects)[number]) => ({
        ...project,
        technologies: project.technologies.map(
          (pt: (typeof project.technologies)[number]) => pt.technology,
        ),
      }),
    );

    const services = rawServices.map(
      (service: (typeof rawServices)[number]) => ({
        ...service,
      }),
    );

    const stats = {
      projects: projectCount,
      certifications: certificationCount,
      technologies: technologyCount,
      experiences: experienceCount,
    };

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
      testimonials,
      blogPosts,
      stats,
      cours,
      technologies,
    };
  }
}
