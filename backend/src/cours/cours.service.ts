import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  compterPages,
  estUnPdf,
  nomDeTelechargement,
  RACINE_COURS,
} from './fichiers-cours';
import { CreateCoursDto } from './dto/create-cours.dto';
import { UpdateCoursDto } from './dto/update-cours.dto';

/** Chaque cours porte sa technologie et la famille de celle-ci, qui decide
 *  de sa planche. */
const avecTechnologie = { technology: { include: { family: true } } } as const;

/** Ce que rend l'envoi d'un PDF : son nom dans le dossier prive, sa taille
 *  et ses pages, que le formulaire du cours reprend. */
/**
 * Le filtre d'une recherche : chaque mot doit se trouver, sans egard a la
 * casse, dans le titre, le titre court, la description, la technologie ou
 * sa famille. Sans mot, aucun filtre. Exporte pour etre teste seul.
 */
export function filtreRecherche(requete: string | undefined): Prisma.CoursWhereInput {
  const mots = (requete ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 8);
  if (!mots.length) return {};
  const contient = (mot: string) => ({ contains: mot, mode: 'insensitive' as const });
  return {
    AND: mots.map((mot) => ({
      OR: [
        { titre: contient(mot) },
        { titreCourt: contient(mot) },
        { description: contient(mot) },
        { technology: { label: contient(mot) } },
        { technology: { family: { name: contient(mot) } } },
      ],
    })),
  };
}

export type FichierCours = {
  fichier: string;
  taille: number;
  pages: number | null;
};

@Injectable()
export class CoursService {
  constructor(private readonly prisma: PrismaService) {}

  /** `q` : la recherche, mot a mot ; vide, tous les cours. */
  findAll(q?: string) {
    return this.prisma.cours.findMany({
      where: filtreRecherche(q),
      include: avecTechnologie,
      orderBy: [{ sortOrder: 'asc' }, { titre: 'asc' }],
    });
  }

  async findOne(id: string) {
    const cours = await this.prisma.cours.findUnique({
      where: { id },
      include: avecTechnologie,
    });
    if (!cours) throw new NotFoundException(`Cours #${id} introuvable`);
    return cours;
  }

  create(dto: CreateCoursDto) {
    return this.prisma.cours.create({ data: dto, include: avecTechnologie });
  }

  /** Remplacer le PDF efface l'ancien du disque, une fois le nouveau
   *  enregistre : un echec de l'enregistrement ne perd pas le fichier. */
  async update(id: string, dto: UpdateCoursDto) {
    const avant = await this.findOne(id);
    const apres = await this.prisma.cours.update({
      where: { id },
      data: dto,
      include: avecTechnologie,
    });
    if (dto.fichier && dto.fichier !== avant.fichier)
      this.supprimerFichier(avant.fichier);
    return apres;
  }

  async remove(id: string) {
    const cours = await this.findOne(id);
    await this.prisma.cours.delete({ where: { id } });
    this.supprimerFichier(cours.fichier);
    return cours;
  }

  /**
   * Le telechargement public. Un cours masque ou inconnu repond 404, comme
   * s'il n'existait pas, et ne compte rien. Le fichier est lu dans le dossier
   * prive, jamais dans `uploads/`.
   */
  async telecharger(id: string, res: Response): Promise<void> {
    const cours = await this.prisma.cours.findUnique({ where: { id } });
    if (!cours || !cours.publique)
      throw new NotFoundException('Cours introuvable');
    // En SQL brut, et non par `prisma.cours.update` : `updatedAt` est un
    // champ `@updatedAt`, que tout `update` remet a l'heure. Chaque
    // telechargement changerait alors la date « Mis a jour » du livre.
    await this.prisma
      .$executeRaw`UPDATE "cours" SET "telechargements" = "telechargements" + 1 WHERE "id" = ${id}`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomDeTelechargement(cours.titre)}"`,
    });
    res.sendFile(path.join(RACINE_COURS, cours.fichier));
  }

  /** Range un PDF dans le dossier prive. Refuse ce qui n'en est pas un, a sa
   *  signature et non a son nom. */
  async enregistrerFichier(contenu: Buffer): Promise<FichierCours> {
    if (!estUnPdf(contenu))
      throw new BadRequestException('Seuls les PDF sont acceptes');
    fs.mkdirSync(RACINE_COURS, { recursive: true });
    const fichier = `${crypto.randomUUID()}.pdf`;
    fs.writeFileSync(path.join(RACINE_COURS, fichier), contenu);
    return {
      fichier,
      taille: contenu.length,
      pages: await compterPages(contenu),
    };
  }

  /** Efface un PDF du dossier prive. Un nom qui sortirait du dossier, ou un
   *  fichier deja absent, n'efface rien. */
  supprimerFichier(fichier: string): void {
    const chemin = path.join(RACINE_COURS, path.basename(fichier));
    if (fs.existsSync(chemin)) fs.unlinkSync(chemin);
  }
}
