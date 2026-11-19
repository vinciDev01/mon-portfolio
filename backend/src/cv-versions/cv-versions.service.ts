import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCvVersionDto } from './dto/create-cv-version.dto';
import { UpdateCvVersionDto } from './dto/update-cv-version.dto';
import {
  sectionsAEnregistrer,
  type SectionLettreSaisie,
} from '../cv-generator/lettre';

/** Les champs de la lettre ou un texte vide veut dire « rien ». */
const TEXTES_LETTRE = [
  'lettreDestinataire',
  'lettreLieu',
  'lettreObjet',
] as const;

/**
 * Les textes vides deviennent nuls : « vide » veut dire « celui de la base »
 * (ou, pour la lettre, « rien »). La date de la lettre arrive en date seule,
 * que Prisma veut complete.
 */
function nettoyer<
  T extends {
    titrePoste?: string | null;
    presentation?: string | null;
    nom?: string;
    lettreDestinataire?: string | null;
    lettreLieu?: string | null;
    lettreObjet?: string | null;
    lettreSections?: SectionLettreSaisie[];
    lettreDate?: string | null;
  },
>(dto: T) {
  const { lettreDate, lettreSections, ...reste } = dto;
  const lettre: Record<string, string | null> = {};
  for (const cle of TEXTES_LETTRE) {
    if (dto[cle] !== undefined) lettre[cle] = dto[cle]?.trim() || null;
  }
  return {
    ...reste,
    ...lettre,
    ...(lettreSections !== undefined
      ? { lettreSections: sectionsAEnregistrer(lettreSections) }
      : {}),
    ...(lettreDate !== undefined
      ? {
          lettreDate: lettreDate
            ? new Date(`${lettreDate.slice(0, 10)}T00:00:00.000Z`)
            : null,
        }
      : {}),
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
