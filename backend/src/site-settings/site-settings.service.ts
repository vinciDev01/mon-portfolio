import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

/**
 * Le corps recu, pret pour la base : la date du « Fait a » arrive en date
 * seule (« 2026-10-28 »), que Prisma veut en date complete ; le lieu vide
 * devient nul.
 */
export function versLaBase(dto: UpdateSiteSettingsDto) {
  const { cvDateFaitA, cvLieu, ...reste } = dto;
  return {
    ...reste,
    ...(cvDateFaitA !== undefined
      ? {
          cvDateFaitA: cvDateFaitA
            ? new Date(`${cvDateFaitA.slice(0, 10)}T00:00:00.000Z`)
            : null,
        }
      : {}),
    ...(cvLieu !== undefined ? { cvLieu: cvLieu?.trim() || null } : {}),
  };
}

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne() {
    const record = await this.prisma.siteSettings.findFirst();
    if (!record) {
      throw new NotFoundException('Site settings not found');
    }
    return record;
  }

  async update(dto: UpdateSiteSettingsDto) {
    const existing = await this.prisma.siteSettings.findFirst();
    const data = versLaBase(dto);

    if (!existing) {
      return this.prisma.siteSettings.create({ data });
    }

    return this.prisma.siteSettings.update({
      where: { id: existing.id },
      data,
    });
  }
}
