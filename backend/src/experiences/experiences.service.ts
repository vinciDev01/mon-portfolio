import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.experience.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async findOne(id: string) {
    const record = await this.prisma.experience.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Experience #${id} not found`);
    return record;
  }

  create(dto: CreateExperienceDto) {
    return this.prisma.experience.create({ data: dto });
  }

  async update(id: string, dto: UpdateExperienceDto) {
    await this.findOne(id);
    return this.prisma.experience.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.experience.delete({ where: { id } });
  }
}
