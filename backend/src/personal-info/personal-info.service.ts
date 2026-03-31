import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePersonalInfoDto } from './dto/update-personal-info.dto';

@Injectable()
export class PersonalInfoService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne() {
    const record = await this.prisma.personalInfo.findFirst();
    if (!record) {
      throw new NotFoundException('Personal info not found');
    }
    return record;
  }

  async update(dto: UpdatePersonalInfoDto) {
    const existing = await this.prisma.personalInfo.findFirst();

    if (!existing) {
      return this.prisma.personalInfo.create({ data: dto });
    }

    return this.prisma.personalInfo.update({
      where: { id: existing.id },
      data: dto,
    });
  }
}
