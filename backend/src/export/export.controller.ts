import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Les tables volontairement absentes de l'export, et pourquoi. Toute autre
 * table doit y figurer : un test le verifie, pour qu'une table ajoutee plus
 * tard ne soit pas oubliee en silence.
 */
export const TABLES_HORS_EXPORT: Readonly<
  Partial<Record<Prisma.ModelName, string>>
> = {
  AdminUser: 'le hash du mot de passe n a rien a faire dans un fichier',
  ProjectTechnology: 'inclus dans chaque projet (technologies)',
  ProjectCollaborator: 'inclus dans chaque projet (collaborators)',
};

/** Chaque table exportee, et la cle sous laquelle elle apparait. */
export const TABLES_EXPORTEES: Readonly<
  Partial<Record<Prisma.ModelName, string>>
> = {
  SiteSettings: 'siteSettings',
  PersonalInfo: 'personalInfo',
  Technology: 'technologies',
  TechnologyFamily: 'technologyFamilies',
  Organization: 'organizations',
  Presentation: 'presentations',
  Skill: 'skills',
  Experience: 'experiences',
  Certification: 'certifications',
  Project: 'projects',
  Service: 'services',
  About: 'about',
  ContactMessage: 'contactMessages',
  Testimonial: 'testimonials',
  BlogPost: 'blogPosts',
  BlogCategory: 'blogCategories',
  Cours: 'cours',
  CvSection: 'cvSections',
  CvVersion: 'cvVersions',
};

@ApiTags('export')
@Controller('export')
export class ExportController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Toutes les donnees du portfolio en JSON, pour une sauvegarde : contenu
   * du site, CV et ses versions (lettres comprises), cours, blog, messages.
   * Les images ne voyagent pas : seuls leurs chemins (dossier `uploads/`).
   */
  @Get('data')
  @ApiOperation({ summary: 'Export all portfolio data as JSON' })
  async exportData() {
    const [
      siteSettings,
      personalInfo,
      technologies,
      technologyFamilies,
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
      blogCategories,
      cours,
      cvSections,
      cvVersions,
    ] = await Promise.all([
      this.prisma.siteSettings.findFirst(),
      this.prisma.personalInfo.findFirst(),
      this.prisma.technology.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.technologyFamily.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.organization.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.presentation.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.skill.findMany({
        include: { technology: true, family: true },
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
      this.prisma.blogCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.cours.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.cvSection.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.cvVersion.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      // Quand, et ce qui manque volontairement : le fichier se comprend seul.
      meta: {
        exporteLe: new Date().toISOString(),
        horsExport: TABLES_HORS_EXPORT,
        fichiers:
          'Les images et PDF ne sont pas inclus : seuls leurs chemins, relatifs au dossier uploads/.',
      },
      siteSettings,
      personalInfo,
      technologies,
      technologyFamilies,
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
      blogCategories,
      cours,
      cvSections,
      cvVersions,
    };
  }
}
