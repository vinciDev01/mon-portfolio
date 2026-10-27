import type { Paire } from './technologies-cv';

/**
 * Section prete a etre dessinee dans le CV. `paires` : la meme matiere que
 * `lignes`, en deux colonnes (etiquette, valeur), quand la section s'y prete ;
 * le rendu la prefere alors aux lignes.
 */
export type SectionCv = {
  titre: string;
  lignes: string[];
  rang: number;
  paires?: Paire[];
};

/** Section alimentee par la base, avec son rang implicite. */
export type SectionBase = {
  titre: string;
  lignes: string[];
  rang: number;
  paires?: Paire[];
};

/** Section libre saisie depuis le backoffice. */
export type SectionLibre = {
  titre: string;
  /** Une entree par ligne. */
  lignes: string;
  publique: boolean;
  sortOrder: number;
};

/** Decoupe un bloc de texte en entrees, en jetant les lignes blanches. */
function decouper(lignes: string): string[] {
  return lignes
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Fusionne les sections issues de la base et les sections libres, puis les
 * ordonne.
 *
 * Les sections de la base portent un rang implicite (presentation 10,
 * experiences 20, competences 25, technologies 30, projets 40,
 * certifications 50, cours 55) ; les
 * sections libres s'intercalent par leur `sortOrder`. A rang egal, la base
 * passe en premier : c'est le tri stable de `Array.prototype.sort`, garanti
 * par la specification depuis ES2019.
 *
 * Deux filtres, dans cet ordre :
 *  - une section libre non publique ne sort jamais dans le CV telechargeable ;
 *  - une section sans aucune ligne utile est omise plutot que d'imprimer un
 *    titre suivi de rien.
 */
export function ordonnerSections(
  base: readonly SectionBase[],
  libres: readonly SectionLibre[],
): SectionCv[] {
  const depuisBase: SectionCv[] = base
    .filter((s) => s.lignes.some((l) => l.trim().length > 0))
    .map((s) => ({
      titre: s.titre,
      lignes: s.lignes.map((l) => l.trim()).filter((l) => l.length > 0),
      rang: s.rang,
      ...(s.paires ? { paires: s.paires } : {}),
    }));

  const depuisLibres: SectionCv[] = libres
    .filter((s) => s.publique)
    .map((s) => ({
      titre: s.titre,
      lignes: decouper(s.lignes),
      rang: s.sortOrder,
    }))
    .filter((s) => s.lignes.length > 0);

  return [...depuisBase, ...depuisLibres].sort((a, b) => a.rang - b.rang);
}

/** Une section libre telle que l'apercu la recoit : avec son `id` quand elle
 *  existe deja, sans quand elle est en cours de creation. */
export type SectionBrouillon = SectionLibre & { id?: string };

/**
 * Les sections libres enregistrees, avec le brouillon du formulaire a la
 * place de la section qu'il modifie (meme `id`), ou en plus s'il est neuf.
 * Sert a l'apercu : le visiteur du backoffice voit le CV tel qu'il sera
 * apres enregistrement, sans rien enregistrer. Rien n'est modifie en place.
 */
export function avecBrouillon<T extends SectionBrouillon>(
  enregistrees: readonly T[],
  brouillon: SectionBrouillon | undefined,
): SectionBrouillon[] {
  if (!brouillon) return [...enregistrees];
  const remplacee = brouillon.id !== undefined && enregistrees.some((s) => s.id === brouillon.id);
  return remplacee
    ? enregistrees.map((s) => (s.id === brouillon.id ? brouillon : s))
    : [...enregistrees, brouillon];
}

/** Les cles des sections alimentees par la base, que le backoffice peut
 *  retirer du CV une a une. */
export const CLES_SECTIONS_BASE = [
  'presentation',
  'experiences',
  'competences',
  'technologies',
  'projets',
  'certifications',
  'cours',
] as const;
export type CleSectionBase = (typeof CLES_SECTIONS_BASE)[number];

/**
 * Les sections de la base, sans celles que le backoffice a retirees du CV.
 * Une cle inconnue ne retire rien. Rien n'est modifie en place.
 */
export function sansMasquees<T extends { cle: string }>(
  base: readonly T[],
  masquees: readonly string[],
): T[] {
  return base.filter((s) => !masquees.includes(s.cle));
}
