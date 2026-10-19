import * as path from 'path';
import sharp from 'sharp';

/**
 * Copie backend de la règle de `packages/shared-types/src/variantes.ts`.
 * Elle existe parce qu'importer le paquet partagé déplacerait la racine de
 * sortie du build (`dist/src/main.js` deviendrait `dist/backend/src/main.js`) ;
 * `variantes.spec.ts` garde les deux copies en phase.
 */
export const TAILLES_MEDAILLON = [88, 176, 264] as const;

const TAILLES: Record<string, readonly number[]> = {
  personal: TAILLES_MEDAILLON,
};

/** Les catégories qui reçoivent des variantes : les clés de la table. */
export function categoriesAvecVariantes(): string[] {
  return Object.keys(TAILLES);
}

export function taillesPour(categorie: string): number[] {
  return [...(TAILLES[categorie] ?? [])];
}

/** Suffixe la taille avant l'extension : `a/b.webp` donne `a/b-176.webp`. */
export function nomVariante(base: string, taille: number): string {
  const barre = Math.max(base.lastIndexOf("/"), base.lastIndexOf("\\"));
  const point = base.lastIndexOf(".");
  if (point <= barre + 1) return `${base}-${taille}`;
  return `${base.slice(0, point)}-${taille}${base.slice(point)}`;
}

/**
 * Écrit les variantes carrées de `buffer` dans `dossier` et renvoie les noms
 * écrits. Un nom reste écrit même si une variante suivante échoue : l'appelant
 * nettoie à partir de `taillesPour` et `nomVariante`.
 *
 * La taille demandée est bornée par le plus petit côté de la source. Avec
 * `cover` vers une boîte de s par s, où s vaut au plus `cote`, le facteur
 * d'échelle vaut s divisé par `cote`, donc au plus 1 : l'image est réduite ou
 * laissée telle quelle, puis rognée à exactement s par s. Carrée à coup sûr,
 * jamais agrandie. (`withoutEnlargement` ne suffit pas : combiné à `cover`, il
 * renonce à la cible et rend le rapport de la source, donc un rectangle.)
 *
 * Le NOM de la variante garde la taille NOMINALE, pas `s`. Un descripteur de
 * densité n'est pas une promesse de nombre de pixels : un fichier de 200 par
 * 200 annoncé en 3x pour une boîte de 88 px s'affiche juste, seulement un peu
 * doux à très haute densité. Ne pas « corriger » le nom : le médaillon attend
 * les trois noms.
 */
export async function ecrireVariantes(
  buffer: Buffer,
  dossier: string,
  nomFichier: string,
  categorie: string,
): Promise<string[]> {
  const ecrits: string[] = [];
  const tailles = taillesPour(categorie);
  if (tailles.length === 0) return ecrits;

  const meta = await sharp(buffer).metadata();
  const cote = Math.min(meta.width ?? 0, meta.height ?? 0);
  // Métadonnées illisibles : mieux vaut ne rien écrire que trois fichiers d'un
  // pixel que le médaillon servirait comme s'ils étaient de vraies variantes.
  if (cote === 0) return ecrits;
  for (const taille of tailles) {
    const s = Math.max(1, Math.min(taille, cote));
    const nom = nomVariante(nomFichier, taille);
    await sharp(buffer)
      .resize(s, s, { fit: 'cover' })
      .webp({ quality: 82 })
      .toFile(path.join(dossier, nom));
    ecrits.push(nom);
  }
  return ecrits;
}
