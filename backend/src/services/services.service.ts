import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.service.findMany({
      include: { organization: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.service.findUnique({
      where: { id },
      include: { organization: true },
    });
    if (!record) throw new NotFoundException(`Service #${id} not found`);
    return record;
  }

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: dto,
      include: { organization: true },
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    return this.prisma.service.update({
      where: { id },
      data: dto,
      include: { organization: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.service.delete({ where: { id } });
  }
}
