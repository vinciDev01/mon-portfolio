import { Injectable, NotFoundException } from '@nestjs/common';
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

  create(dto: CreateCvSectionDto) {
    return this.prisma.cvSection.create({ data: dto });
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
