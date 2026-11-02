import type { Paire } from './technologies-cv';
import type { PosteCv, ProjetCv } from './contenu-cv';

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
  /** Les experiences, structurees : le rendu les prefere aux lignes. */
  postes?: PosteCv[];
  /** Des projets en puces, comme sous un poste. */
  projets?: ProjetCv[];
  /** Des paragraphes simples, sans puce : une breve presentation. */
  sansPuce?: boolean;
};

/** Section alimentee par la base, avec son rang implicite. */
export type SectionBase = {
  titre: string;
  lignes: string[];
  rang: number;
  paires?: Paire[];
  postes?: PosteCv[];
  projets?: ProjetCv[];
  sansPuce?: boolean;
};

/**
 * La presentation du corps d'une section libre : une puce par entree, les
 * entrees reunies sur une ligne et separees par des virgules, ou une entree
 * par ligne sans puce.
 */
export const FORMATS_SECTION = ['puces', 'virgules', 'lignes'] as const;
export type FormatSection = (typeof FORMATS_SECTION)[number];

/** Section libre saisie depuis le backoffice. */
export type SectionLibre = {
  titre: string;
  /** Une entree par ligne. */
  lignes: string;
  publique: boolean;
  sortOrder: number;
  /** Absent ou inconnu : des puces. */
  format?: string | null;
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
      ...(s.postes ? { postes: s.postes } : {}),
      ...(s.projets ? { projets: s.projets } : {}),
      ...(s.sansPuce ? { sansPuce: true } : {}),
    }));

  const depuisLibres: SectionCv[] = libres
    .filter((s) => s.publique)
    .map((s): SectionCv => {
      const entrees = decouper(s.lignes);
      if (s.format === 'virgules')
        return {
          titre: s.titre,
          lignes: entrees.length ? [entrees.join(', ')] : [],
          rang: s.sortOrder,
          sansPuce: true,
        };
      return {
        titre: s.titre,
        lignes: entrees,
        rang: s.sortOrder,
        ...(s.format === 'lignes' ? { sansPuce: true } : {}),
      };
    })
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
  const remplacee =
    brouillon.id !== undefined &&
    enregistrees.some((s) => s.id === brouillon.id);
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
 * Rangs par defaut des sections de la base, dans l'ordre ou un recruteur lit
 * un CV : qui (presentation), ce qu'il a fait (experiences), ce qu'il sait
 * faire (competences, technologies), ce qu'il a construit (projets), puis ce
 * qui le confirme (certifications, cours rediges).
 */
export const RANGS_BASE_DEFAUT: Record<CleSectionBase, number> = {
  presentation: 10,
  experiences: 20,
  competences: 25,
  technologies: 30,
  projets: 40,
  certifications: 50,
  cours: 55,
};

/**
 * Les rangs des sections de la base : ceux enregistres au backoffice, et a
 * defaut ceux d'origine. Le reglage vient d'une colonne JSON : une cle
 * inconnue ou un rang qui n'est pas un entier positif est ignore.
 */
export function rangsBase(stockes: unknown): Record<CleSectionBase, number> {
  const rangs = { ...RANGS_BASE_DEFAUT };
  if (stockes && typeof stockes === 'object' && !Array.isArray(stockes)) {
    for (const [cle, rang] of Object.entries(stockes)) {
      if (
        (CLES_SECTIONS_BASE as readonly string[]).includes(cle) &&
        Number.isInteger(rang) &&
        (rang as number) >= 0
      )
        rangs[cle as CleSectionBase] = rang as number;
    }
  }
  return rangs;
}

/**
 * Un ordre complet, tel que la page « Sections du CV » l'envoie (cles des
 * sections de la base et identifiants des sections libres, de la premiere a
 * la derniere), traduit en rangs espaces de 10 : 10, 20, 30... Les rangs
 * etant tous distincts, l'ordre ne depend plus d'aucun departage.
 */
export function rangsDepuisOrdre(ordre: readonly string[]): {
  base: Partial<Record<CleSectionBase, number>>;
  libres: { id: string; sortOrder: number }[];
} {
  const base: Partial<Record<CleSectionBase, number>> = {};
  const libres: { id: string; sortOrder: number }[] = [];
  ordre.forEach((cle, i) => {
    const rang = (i + 1) * 10;
    if ((CLES_SECTIONS_BASE as readonly string[]).includes(cle))
      base[cle as CleSectionBase] = rang;
    else libres.push({ id: cle, sortOrder: rang });
  });
  return { base, libres };
}

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
