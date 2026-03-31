import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { UpdatePresentationDto } from './dto/update-presentation.dto';

@Injectable()
export class PresentationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.presentation.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.presentation.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Presentation #${id} not found`);
    return record;
  }

  create(dto: CreatePresentationDto) {
    return this.prisma.presentation.create({ data: dto });
  }

  async update(id: string, dto: UpdatePresentationDto) {
    await this.findOne(id);
    return this.prisma.presentation.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.presentation.delete({ where: { id } });
  }
}
