import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

/** La technologie et sa famille, et la famille propre d'une competence libre. */
const AVEC_LIENS = { technology: { include: { family: true } }, family: true } as const;

type Champs = Pick<CreateSkillDto, 'technologyId' | 'label' | 'familyId'>;

/**
 * Une competence est soit liee a une technologie, soit libre : jamais les
 * deux a moitie. Liee, elle prend nom et famille de la technologie (on vide
 * les siens) ; libre, il lui faut un nom.
 */
function normaliser(champs: Champs): Champs {
  if (champs.technologyId) return { technologyId: champs.technologyId, label: null, familyId: null };
  const label = champs.label?.trim();
  if (!label) {
    throw new BadRequestException('Choisissez une technologie ou saisissez le nom de la competence');
  }
  return { technologyId: null, label, familyId: champs.familyId || null };
}

function traduire(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
    throw new BadRequestException('Technologie ou famille introuvable');
  }
  throw e;
}

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.skill.findMany({
      include: AVEC_LIENS,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.skill.findUnique({
      where: { id },
      include: AVEC_LIENS,
    });
    if (!record) throw new NotFoundException(`Skill #${id} not found`);
    return record;
  }

  create(dto: CreateSkillDto) {
    const { proficiency, sortOrder } = dto;
    return this.prisma.skill
      .create({ data: { ...normaliser(dto), proficiency, sortOrder }, include: AVEC_LIENS })
      .catch(traduire);
  }

  async update(id: string, dto: UpdateSkillDto) {
    const actuelle = await this.findOne(id);
    const { proficiency, sortOrder } = dto;
    // Un champ absent garde sa valeur : la regle s'applique a l'etat final.
    const touche = 'technologyId' in dto || 'label' in dto || 'familyId' in dto;
    const liens = touche
      ? normaliser({
          technologyId: 'technologyId' in dto ? dto.technologyId : actuelle.technologyId,
          label: 'label' in dto ? dto.label : actuelle.label,
          familyId: 'familyId' in dto ? dto.familyId : actuelle.familyId,
        })
      : {};
    return this.prisma.skill
      .update({ where: { id }, data: { ...liens, proficiency, sortOrder }, include: AVEC_LIENS })
      .catch(traduire);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.skill.delete({ where: { id } });
  }
}
