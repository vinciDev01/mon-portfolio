import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAboutDto } from './dto/create-about.dto';
import { UpdateAboutDto } from './dto/update-about.dto';

@Injectable()
export class AboutService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.about.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async findOne(id: string) {
    const record = await this.prisma.about.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`About #${id} not found`);
    return record;
  }

  create(dto: CreateAboutDto) {
    return this.prisma.about.create({ data: dto });
  }

  async update(id: string, dto: UpdateAboutDto) {
    await this.findOne(id);
    return this.prisma.about.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.about.delete({ where: { id } });
  }
}
