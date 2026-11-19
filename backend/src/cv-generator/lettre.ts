/**
 * La lettre de motivation, partagee par le rendu PDF et le rendu Word :
 * l'en-tete commun, la ligne de lieu et de date, l'objet et les paragraphes.
 *
 * Fonctions pures, comme l'en-tete du CV : l'adresse postale n'entre dans
 * l'en-tete par defaut que si elle a ete declaree publique.
 */

import { urlAffichee } from './en-tete';
import { TEXTES, type LangueCv } from './langue-cv';

/** Les lignes utiles d'un bloc de texte saisi : sans blancs autour, sans
 *  lignes vides. */
export function lignesDe(texte: string | null | undefined): string[] {
  return (texte ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * L'en-tete propose tant que le backoffice n'en a pas saisi : le nom, puis
 * l'adresse si elle est publique, le telephone, l'adresse electronique et le
 * portfolio. Une ligne par information.
 */
export function enTeteParDefaut(
  info: {
    name?: string | null;
    surname?: string | null;
    adresse?: string | null;
    adressePublique?: boolean;
    phone?: string | null;
    email?: string | null;
  } | null,
  siteUrl?: string | null,
): string {
  if (!info) return siteUrl?.trim() ? urlAffichee(siteUrl) : '';
  return [
    [info.name, info.surname].filter((x) => x?.trim()).join(' '),
    info.adressePublique ? info.adresse : null,
    info.phone,
    info.email,
    siteUrl?.trim() ? urlAffichee(siteUrl) : null,
  ]
    .map((l) => l?.trim() ?? '')
    .filter((l) => l.length > 0)
    .join('\n');
}

/**
 * La ligne de lieu et de date : « Lome, le 19 novembre 2026 ». Sans lieu,
 * « Le 19 novembre 2026 » ; sans date, celle du jour de la generation
 * (`aujourdhui`, injectable pour les tests). En UTC, comme le reste du CV.
 */
export function ligneLieuDate(
  lieu: string | null | undefined,
  date: Date | null | undefined,
  langue: LangueCv = 'fr',
  aujourdhui: Date = new Date(),
): string {
  const jour = new Intl.DateTimeFormat(TEXTES[langue].locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date ?? aujourdhui);
  const ou = lieu?.trim();
  if (langue === 'en') return ou ? `${ou}, ${jour}` : jour;
  return ou ? `${ou}, le ${jour}` : `Le ${jour}`;
}

/** « Objet : ... » en francais, « Subject: ... » en anglais ; rien sans objet. */
export function ligneObjet(
  objet: string | null | undefined,
  langue: LangueCv = 'fr',
): string | null {
  const o = objet?.trim();
  if (!o) return null;
  return langue === 'en' ? `Subject: ${o}` : `Objet : ${o}`;
}

/**
 * Le corps en paragraphes : une ligne vide les separe. Dans un paragraphe,
 * les retours a la ligne sont gardes (un appel « Monsieur, » reste seul sur
 * sa ligne s'il est suivi d'une ligne vide, et une adresse garde ses lignes).
 */
export function paragraphesDe(corps: string | null | undefined): string[] {
  return (corps ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => lignesDe(p).join('\n'))
    .filter((p) => p.length > 0);
}

/** Le nom du fichier : « Lettre_BENYO_Fanuel.pdf », sans accents ni
 *  caracteres interdits, « _EN » pour une lettre anglaise. */
export function nomFichierLettre(
  nom: string,
  prenom: string,
  extension: string,
  langue: LangueCv = 'fr',
): string {
  const nettoyer = (v: string) =>
    v
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, '')
      .trim()
      .replace(/\s+/g, '_');
  const morceaux = [nettoyer(nom), nettoyer(prenom)].filter(Boolean);
  return (
    ['Lettre', ...morceaux, ...(langue === 'en' ? ['EN'] : [])].join('_') +
    '.' +
    extension
  );
}

/** Une section du corps telle qu'on la saisit : un titre facultatif et un
 *  texte. */
export type SectionLettreSaisie = {
  titre?: string | null;
  corps?: string | null;
};

/** Une section prete au rendu : son titre (ou rien) et ses paragraphes. */
export type SectionLettre = { titre: string | null; paragraphes: string[] };

/**
 * Les sections du corps, depuis la colonne JSON ou la saisie : les blancs
 * retires, une section vide (ni titre ni texte) ecartee. Une valeur qui n'est
 * pas une liste donne une lettre sans corps.
 */
export function sectionsLettre(brut: unknown): SectionLettre[] {
  if (!Array.isArray(brut)) return [];
  return brut
    .filter((s): s is SectionLettreSaisie => !!s && typeof s === 'object')
    .map((s) => ({
      titre:
        typeof s.titre === 'string' && s.titre.trim() ? s.titre.trim() : null,
      paragraphes: paragraphesDe(typeof s.corps === 'string' ? s.corps : ''),
    }))
    .filter((s) => s.titre !== null || s.paragraphes.length > 0);
}

/** Les sections a enregistrer : memes regles, sous la forme de la colonne. */
export function sectionsAEnregistrer(
  saisie: SectionLettreSaisie[] | null | undefined,
): { titre: string | null; corps: string }[] {
  return (saisie ?? [])
    .map((s) => ({
      titre: s.titre?.trim() || null,
      corps: (s.corps ?? '').replace(/\r\n/g, '\n').trim(),
    }))
    .filter((s) => s.titre !== null || s.corps.length > 0);
}

/** Une lettre existe des qu'une section a du texte. */
export function aUnCorps(sections: SectionLettre[]): boolean {
  return sections.some((s) => s.paragraphes.length > 0);
}

/** Une mise en page : le corps du texte et les marges, en points. */
export type MiseEnPage = { corps: number; marge: number };

/**
 * Les mises en page essayees dans l'ordre, de la plus confortable a la plus
 * serree : le corps descend d'un quart de point de 11 a 9, puis les marges
 * se resserrent. La premiere qui tient sur une page l'emporte ; a defaut, la
 * derniere.
 */
export const MISES_EN_PAGE: readonly MiseEnPage[] = [
  ...Array.from({ length: 9 }, (_, i) => ({ corps: 11 - i * 0.25, marge: 56 })),
  { corps: 9, marge: 44 },
  { corps: 8.5, marge: 40 },
  { corps: 8, marge: 36 },
];
