import * as path from 'path';
import { PDFDocument } from 'pdf-lib';

/**
 * Le dossier des PDF de cours, a cote de `uploads/` et JAMAIS dedans :
 * `uploads/` est servi en statique, un cours masque y resterait telechargeable
 * par son adresse. Seule la route de telechargement lit ce dossier.
 */
export const RACINE_COURS = path.resolve(process.cwd(), '..', 'cours');

/** 50 Mo : la limite d'un PDF de cours. */
export const TAILLE_MAX_COURS = 50 * 1024 * 1024;

/** Un PDF se reconnait a sa signature `%PDF-`, pas a son nom ni a son type
 *  declare, que le navigateur deduit de l'extension. */
export function estUnPdf(contenu: Buffer): boolean {
  return contenu.subarray(0, 5).toString('latin1') === '%PDF-';
}

/** Le nombre de pages, lu dans le PDF ; `null` s'il ne se lit pas, et le
 *  backoffice laisse alors la saisie a la main. */
export async function compterPages(contenu: Buffer): Promise<number | null> {
  try {
    const doc = await PDFDocument.load(contenu, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch {
    return null;
  }
}

/** Le nom du fichier telecharge : le titre du cours, en ASCII, mots joints
 *  par `_`. « Java, des bases aux objets » donne `Java_des_bases_aux_objets.pdf`. */
export function nomDeTelechargement(titre: string): string {
  const base = titre
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${base || 'cours'}.pdf`;
}
