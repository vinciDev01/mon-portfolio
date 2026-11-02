import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { rangsBase, rangsDepuisOrdre } from '../cv-generator/ordre-sections';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCvSectionDto } from './dto/create-cv-section.dto';
import { UpdateCvSectionDto } from './dto/update-cv-section.dto';

@Injectable()
export class CvSectionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.cvSection.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async findOne(id: string) {
    const record = await this.prisma.cvSection.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`CvSection #${id} not found`);
    return record;
  }

  /** Sans rang, une nouvelle section se place apres toutes les autres. */
  async create(dto: CreateCvSectionDto) {
    const sortOrder = dto.sortOrder ?? (await this.rangFinal());
    return this.prisma.cvSection.create({ data: { ...dto, sortOrder } });
  }

  /** Dix de plus que le dernier rang du CV, base et sections libres comprises. */
  private async rangFinal() {
    const [reglages, derniere] = await Promise.all([
      this.prisma.siteSettings.findFirst({ select: { cvRangsBase: true } }),
      this.prisma.cvSection.findFirst({
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      }),
    ]);
    return (
      Math.max(
        ...Object.values(rangsBase(reglages?.cvRangsBase)),
        derniere?.sortOrder ?? 0,
      ) + 10
    );
  }

  /**
   * Range toutes les sections du CV dans l'ordre recu, en une transaction :
   * les rangs de la base vont dans les reglages du site, ceux des sections
   * libres dans chaque section. Un identifiant inconnu refuse tout, pour ne
   * jamais laisser un ordre a moitie applique.
   */
  async reordonner(ordre: string[]) {
    const { base, libres } = rangsDepuisOrdre(ordre);
    const existantes = await this.prisma.cvSection.count({
      where: { id: { in: libres.map((l) => l.id) } },
    });
    if (existantes !== libres.length) {
      throw new BadRequestException("Section du CV inconnue dans l'ordre");
    }
    const reglages = await this.prisma.siteSettings.findFirst({
      select: { id: true, cvRangsBase: true },
    });
    if (!reglages) throw new NotFoundException('Site settings not found');

    await this.prisma.$transaction([
      this.prisma.siteSettings.update({
        where: { id: reglages.id },
        data: { cvRangsBase: { ...rangsBase(reglages.cvRangsBase), ...base } },
      }),
      ...libres.map((l) =>
        this.prisma.cvSection.update({
          where: { id: l.id },
          data: { sortOrder: l.sortOrder },
        }),
      ),
    ]);
    return this.findAll();
  }

  async update(id: string, dto: UpdateCvSectionDto) {
    await this.findOne(id);
    return this.prisma.cvSection.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.cvSection.delete({ where: { id } });
  }
}
