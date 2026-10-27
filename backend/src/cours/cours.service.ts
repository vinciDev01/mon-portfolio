import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { compterPages, estUnPdf, nomDeTelechargement, RACINE_COURS } from './fichiers-cours';

/** Ce que rend l'envoi d'un PDF : son nom dans le dossier prive, sa taille
 *  et ses pages, que le formulaire du cours reprend. */
export type FichierCours = { fichier: string; taille: number; pages: number | null };

@Injectable()
export class CoursService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Le telechargement public. Un cours masque ou inconnu repond 404, comme
   * s'il n'existait pas, et ne compte rien. Le fichier est lu dans le dossier
   * prive, jamais dans `uploads/`.
   */
  async telecharger(id: string, res: Response): Promise<void> {
    const cours = await this.prisma.cours.findUnique({ where: { id } });
    if (!cours || !cours.publique) throw new NotFoundException('Cours introuvable');
    await this.prisma.cours.update({
      where: { id },
      data: { telechargements: { increment: 1 } },
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomDeTelechargement(cours.titre)}"`,
    });
    res.sendFile(path.join(RACINE_COURS, cours.fichier));
  }

  /** Range un PDF dans le dossier prive. Refuse ce qui n'en est pas un, a sa
   *  signature et non a son nom. */
  async enregistrerFichier(contenu: Buffer): Promise<FichierCours> {
    if (!estUnPdf(contenu)) throw new BadRequestException('Seuls les PDF sont acceptes');
    fs.mkdirSync(RACINE_COURS, { recursive: true });
    const fichier = `${crypto.randomUUID()}.pdf`;
    fs.writeFileSync(path.join(RACINE_COURS, fichier), contenu);
    return { fichier, taille: contenu.length, pages: await compterPages(contenu) };
  }

  /** Efface un PDF du dossier prive. Un nom qui sortirait du dossier, ou un
   *  fichier deja absent, n'efface rien. */
  supprimerFichier(fichier: string): void {
    const chemin = path.join(RACINE_COURS, path.basename(fichier));
    if (fs.existsSync(chemin)) fs.unlinkSync(chemin);
  }
}
