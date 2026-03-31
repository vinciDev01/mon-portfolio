import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.skill.findMany({
      include: { technology: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.skill.findUnique({
      where: { id },
      include: { technology: true },
    });
    if (!record) throw new NotFoundException(`Skill #${id} not found`);
    return record;
  }

  create(dto: CreateSkillDto) {
    return this.prisma.skill.create({
      data: dto,
      include: { technology: true },
    });
  }

  async update(id: string, dto: UpdateSkillDto) {
    await this.findOne(id);
    return this.prisma.skill.update({
      where: { id },
      data: dto,
      include: { technology: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.skill.delete({ where: { id } });
  }
}
