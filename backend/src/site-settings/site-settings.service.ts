import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

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

    if (!existing) {
      return this.prisma.siteSettings.create({ data: dto });
    }

    return this.prisma.siteSettings.update({
      where: { id: existing.id },
      data: dto,
    });
  }
}
