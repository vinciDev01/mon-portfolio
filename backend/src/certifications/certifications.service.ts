import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';

@Injectable()
export class CertificationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.certification.findMany({
      include: { organization: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.certification.findUnique({
      where: { id },
      include: { organization: true },
    });
    if (!record) throw new NotFoundException(`Certification #${id} not found`);
    return record;
  }

  create(dto: CreateCertificationDto) {
    return this.prisma.certification.create({
      data: dto,
      include: { organization: true },
    });
  }

  async update(id: string, dto: UpdateCertificationDto) {
    await this.findOne(id);
    return this.prisma.certification.update({
      where: { id },
      data: dto,
      include: { organization: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.certification.delete({ where: { id } });
  }
}
