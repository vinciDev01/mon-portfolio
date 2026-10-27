import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { UpdateTechnologyDto } from './dto/update-technology.dto';

/** Chaque technologie porte sa famille : le backoffice l'affiche, le CV
 *  range par elle. */
const avecFamille = { family: true } as const;

@Injectable()
export class TechnologiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.technology.findMany({
      orderBy: { sortOrder: 'asc' },
      include: avecFamille,
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.technology.findUnique({
      where: { id },
      include: avecFamille,
    });
    if (!record) throw new NotFoundException(`Technology #${id} not found`);
    return record;
  }

  create(dto: CreateTechnologyDto) {
    return this.prisma.technology.create({ data: dto, include: avecFamille });
  }

  async update(id: string, dto: UpdateTechnologyDto) {
    await this.findOne(id);
    return this.prisma.technology.update({
      where: { id },
      data: dto,
      include: avecFamille,
    });
  }

  /** Une technologie qui a des cours ne se supprime pas (cle etrangere en
   *  `Restrict`) : sans ce message, Prisma tomberait en 500. */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.technology
      .delete({ where: { id } })
      .catch((e: unknown) => {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2003'
        ) {
          throw new ConflictException(
            'Des cours utilisent cette technologie : deplacez-les ou supprimez-les d abord',
          );
        }
        throw e;
      });
  }
}
