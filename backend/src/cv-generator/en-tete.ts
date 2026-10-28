/**
 * Bloc de contact du CV, partage par le rendu PDF et le rendu Word.
 *
 * Il vit dans une fonction pure parce qu'il porte une regle de
 * confidentialite : l'adresse postale ne sort que si elle a ete declaree
 * publique. Un refactor qui casserait cette regle en silence publierait le
 * domicile du proprietaire du site, d'ou les tests.
 */

import { TEXTES, type LangueCv } from './langue-cv';

import type { CleContact } from './icones-contact';

export type InfoContact = {
  nationalite?: string | null;
  adresse?: string | null;
  adressePublique: boolean;
  phone?: string | null;
  email?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  /** L'adresse publique du portfolio. */
  portfolioUrl?: string | null;
};

/**
 * Une coordonnee : `texte` et `etiquette` portent le libelle (« Tel : »)
 * pour le Word ; le PDF dessine l'icone de `cle` et la seule `valeur`.
 */
export type LigneContact =
  | { genre: 'texte'; cle: CleContact; texte: string; valeur: string }
  | { genre: 'lien'; cle: CleContact; etiquette: string; url: string };

/** Vrai seulement si la valeur contient autre chose que des blancs. */
function renseigne(v: string | null | undefined): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function lignesContact(
  info: InfoContact | null,
  langue: LangueCv = 'fr',
): LigneContact[] {
  if (!info) return [];
  const { contact: c, deuxPoints: dp } = TEXTES[langue];

  const lignes: LigneContact[] = [];

  if (renseigne(info.nationalite)) {
    const valeur = info.nationalite.trim();
    lignes.push({ genre: 'texte', cle: 'nationalite', texte: valeur, valeur });
  }

  // L'adresse exige les deux conditions : etre renseignee ET etre publique.
  if (renseigne(info.adresse) && info.adressePublique) {
    const valeur = info.adresse.trim();
    lignes.push({
      genre: 'texte',
      cle: 'adresse',
      texte: `${c.adresse}${dp}${valeur}`,
      valeur,
    });
  }

  if (renseigne(info.phone)) {
    const valeur = info.phone.trim();
    lignes.push({
      genre: 'texte',
      cle: 'tel',
      texte: `${c.tel}${dp}${valeur}`,
      valeur,
    });
  }
  if (renseigne(info.email)) {
    lignes.push({
      genre: 'lien',
      cle: 'email',
      etiquette: `${c.email}${dp}`,
      url: info.email.trim(),
    });
  }
  if (renseigne(info.githubUrl)) {
    lignes.push({
      genre: 'lien',
      cle: 'github',
      etiquette: `${c.github}${dp}`,
      url: info.githubUrl.trim(),
    });
  }
  if (renseigne(info.linkedinUrl)) {
    lignes.push({
      genre: 'lien',
      cle: 'linkedin',
      etiquette: `${c.linkedin}${dp}`,
      url: info.linkedinUrl.trim(),
    });
  }
  if (renseigne(info.portfolioUrl)) {
    lignes.push({
      genre: 'lien',
      cle: 'portfolio',
      etiquette: `${c.portfolio}${dp}`,
      url: info.portfolioUrl.trim(),
    });
  }

  return lignes;
}

/**
 * Nom du fichier telecharge.
 *
 * Un recruteur qui recoit dix fichiers nommes « CV.pdf » ne retrouve pas le
 * votre. On compose donc le nom depuis l'identite, sans diacritiques ni
 * caracteres interdits par les systemes de fichiers.
 */
export function nomFichier(
  nom: string,
  prenom: string,
  extension: string,
  /** Le CV anglais porte « _EN » : les deux se distinguent dans un dossier. */
  langue: LangueCv = 'fr',
): string {
  const nettoyer = (v: string) =>
    v
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // retire les diacritiques
      .replace(/[^A-Za-z0-9 ]/g, '') // puis tout ce qui n'est pas alphanumerique
      .trim()
      .replace(/\s+/g, '_');

  const morceaux = [nettoyer(nom), nettoyer(prenom)].filter(
    (m) => m.length > 0,
  );

  return (
    ['CV', ...morceaux, ...(langue === 'en' ? ['EN'] : [])].join('_') +
    '.' +
    extension
  );
}

/**
 * Cible reelle d'un lien de contact.
 *
 * Une adresse electronique n'est pas une URL : sans le schema `mailto:`, les
 * lecteurs PDF et Word la rendent inerte ou la prefixent en `http://`.
 */
export function hrefDeLien(valeur: string): string {
  const v = valeur.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return v;
  return v.includes('@') ? `mailto:${v}` : `https://${v}`;
}

/**
 * L'adresse telle qu'on la lit : sans « https:// », sans « www. », sans
 * barre finale. Le lien, lui, garde l'adresse complete (`hrefDeLien`).
 * Une adresse electronique reste telle quelle.
 */
export function urlAffichee(valeur: string): string {
  const v = valeur.trim();
  if (v.includes('@') && !/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) return v;
  return v
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
}

/**
 * Les elements d'une ligne de coordonnees ranges en lignes completes : on
 * n'en coupe jamais un, et un separateur n'ouvre jamais une ligne. Un element
 * plus large que la ligne tient seul sur la sienne.
 */
export function rangerEnLignes<T>(
  elements: readonly T[],
  largeurDe: (e: T) => number,
  largeurSeparateur: number,
  largeurMax: number,
): T[][] {
  const lignes: T[][] = [];
  let courante: T[] = [];
  let occupee = 0;
  for (const e of elements) {
    const l = largeurDe(e);
    const ajout = courante.length ? largeurSeparateur + l : l;
    if (courante.length && occupee + ajout > largeurMax) {
      lignes.push(courante);
      courante = [e];
      occupee = l;
    } else {
      courante.push(e);
      occupee += ajout;
    }
  }
  if (courante.length) lignes.push(courante);
  return lignes;
}

/**
 * Le titre du poste vise, imprime sous le nom. Saisi au backoffice ; vide ou
 * blanc, il n'y a pas de ligne du tout plutot qu'une ligne vide.
 */
export function titrePoste(saisi: string | null | undefined): string | null {
  return renseigne(saisi) ? saisi.trim() : null;
}
