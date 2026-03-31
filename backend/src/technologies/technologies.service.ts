import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { UpdateTechnologyDto } from './dto/update-technology.dto';

@Injectable()
export class TechnologiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.technology.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async findOne(id: string) {
    const record = await this.prisma.technology.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Technology #${id} not found`);
    return record;
  }

  create(dto: CreateTechnologyDto) {
    return this.prisma.technology.create({ data: dto });
  }

  async update(id: string, dto: UpdateTechnologyDto) {
    await this.findOne(id);
    return this.prisma.technology.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.technology.delete({ where: { id } });
  }
}
