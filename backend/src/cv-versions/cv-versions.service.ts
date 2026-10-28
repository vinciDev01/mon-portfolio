import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCvVersionDto } from './dto/create-cv-version.dto';
import { UpdateCvVersionDto } from './dto/update-cv-version.dto';

/** Les textes vides deviennent nuls : « vide » veut dire « celui de la base ». */
function nettoyer<
  T extends {
    titrePoste?: string | null;
    presentation?: string | null;
    nom?: string;
  },
>(dto: T): T {
  return {
    ...dto,
    ...(dto.nom !== undefined ? { nom: dto.nom.trim() } : {}),
    ...(dto.titrePoste !== undefined
      ? { titrePoste: dto.titrePoste?.trim() || null }
      : {}),
    ...(dto.presentation !== undefined
      ? { presentation: dto.presentation?.trim() || null }
      : {}),
  };
}

@Injectable()
export class CvVersionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.cvVersion.findMany({
      orderBy: [{ sortOrder: 'asc' }, { nom: 'asc' }],
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.cvVersion.findUnique({ where: { id } });
    if (!record)
      throw new NotFoundException(`Version du CV #${id} introuvable`);
    return record;
  }

  create(dto: CreateCvVersionDto) {
    return this.prisma.cvVersion.create({ data: nettoyer(dto) });
  }

  async update(id: string, dto: UpdateCvVersionDto) {
    await this.findOne(id);
    return this.prisma.cvVersion.update({ where: { id }, data: nettoyer(dto) });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.cvVersion.delete({ where: { id } });
  }
}
