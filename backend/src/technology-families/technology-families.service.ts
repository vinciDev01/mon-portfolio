import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechnologyFamilyDto } from './dto/create-technology-family.dto';
import { UpdateTechnologyFamilyDto } from './dto/update-technology-family.dto';

/** Le nom d'une famille est unique : Prisma leve P2002 sur un doublon, qui
 *  sans cela tomberait en 500. Le backoffice affiche ce message tel quel. */
function sansDoublon(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    throw new ConflictException('Une famille porte deja ce nom');
  }
  throw e;
}

@Injectable()
export class TechnologyFamiliesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.technologyFamily.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.technologyFamily.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`TechnologyFamily #${id} not found`);
    return record;
  }

  create(dto: CreateTechnologyFamilyDto) {
    return this.prisma.technologyFamily.create({ data: dto }).catch(sansDoublon);
  }

  async update(id: string, dto: UpdateTechnologyFamilyDto) {
    await this.findOne(id);
    return this.prisma.technologyFamily
      .update({ where: { id }, data: dto })
      .catch(sansDoublon);
  }

  /** Les technologies de la famille ne sont pas supprimees : la cle etrangere
   *  les detache (`onDelete: SetNull`), elles passent sous « Autres ». */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.technologyFamily.delete({ where: { id } });
  }
}
