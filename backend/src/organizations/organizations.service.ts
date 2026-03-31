import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.organization.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async findOne(id: string) {
    const record = await this.prisma.organization.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Organization #${id} not found`);
    return record;
  }

  create(dto: CreateOrganizationDto) {
    return this.prisma.organization.create({ data: dto });
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOne(id);
    return this.prisma.organization.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.organization.delete({ where: { id } });
  }
}
