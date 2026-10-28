/**
 * Les lignes du CV qui racontent : une experience avec ce qu'on y a fait et
 * les projets qu'on y a menes, un cours avec sa technologie et son niveau.
 * Pures, pour etre testees sans base ni rendu. Chacune prend la langue du
 * CV : les champs anglais saisis au backoffice, a defaut le francais.
 */
import { choisir, TEXTES, type LangueCv } from './langue-cv';

/** « Juillet 2025 », en UTC comme le reste du site : une date saisie au
 *  1er juillet, enregistree a minuit UTC, ne recule pas en juin. */
export function moisAnnee(
  date: Date | null | undefined,
  langue: LangueCv = 'fr',
): string {
  if (!date) return '';
  const s = new Intl.DateTimeFormat(TEXTES[langue].locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Une phrase qui finit par un point, sans en doubler un deja present. */
function phrase(texte: string): string {
  const t = texte.trim().replace(/\s+/g, ' ');
  return /[.!?…]$/.test(t) ? t : `${t}.`;
}

/**
 * Une experience en une entree : la periode, le poste et l'entreprise, puis
 * ce qui y a ete fait, puis les projets qui s'y rattachent. Un recruteur lit
 * d'abord le poste ; le detail suit, sans section a recouper.
 */
/**
 * Ce qu'est un projet, en quelques mots, pour qu'un recruteur sache de quoi
 * parle son nom : le debut de sa description, jusqu'au premier « : » ou au
 * premier point, la majuscule rabattue. Rien sans description.
 */
export function resumeProjet(
  description: string | null | undefined,
): string | null {
  const t = description?.trim().replace(/\s+/g, ' ');
  if (!t) return null;
  const coupe = t.split(/\s:\s|:\s|\.\s|\.$/)[0].trim();
  if (!coupe || coupe.length > 90) return null;
  return coupe.charAt(0).toLowerCase() + coupe.slice(1);
}

/** Une experience telle qu'elle vient de la base, versions anglaises comprises. */
type ExperienceBrute = {
  role: string;
  roleEn?: string | null;
  company: string;
  description: string | null;
  descriptionEn?: string | null;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
};

/** « Juillet 2025 - aujourd'hui », « July 2025 - Present ». */
function periodeDe(e: ExperienceBrute, langue: LangueCv): string {
  const t = TEXTES[langue];
  const debut = moisAnnee(e.startDate, langue);
  const fin = e.isCurrent ? t.aujourdhui : moisAnnee(e.endDate, langue);
  // « Mars 2026 - aujourd'hui » : la forme que les analyseurs de CV (ATS)
  // reconnaissent le mieux pour une periode.
  return [debut, fin].filter(Boolean).join(' - ');
}

export function ligneExperience(
  e: ExperienceBrute,
  projets: readonly (string | ProjetBrut)[] = [],
  langue: LangueCv = 'fr',
): string {
  const t = TEXTES[langue];
  const periode = periodeDe(e, langue);
  const role = choisir(e.role, e.roleEn, langue);
  const description = choisir(e.description, e.descriptionEn, langue);
  const morceaux = [
    `${periode ? `${periode}${t.deuxPoints}` : ''}${role} ${t.chez} ${e.company}.`,
  ];
  if (description?.trim()) morceaux.push(phrase(description));
  if (projets.length) {
    const noms = projets.map((p) => {
      if (typeof p === 'string') return p;
      const resume = projetCv(p, false, langue).resume;
      return resume ? `${p.name} (${resume})` : p.name;
    });
    morceaux.push(`${t.projets}${t.deuxPoints}${noms.join(', ')}.`);
  }
  return morceaux.join(' ');
}

/** Un projet du CV : son nom et ce qu'il est. Ses technologies n'y figurent
 *  pas : la section Technologies les dit deja. */
export type ProjetCv = { nom: string; resume: string | null };

type ProjetBrut = {
  name: string;
  description: string | null;
  descriptionEn?: string | null;
  /** La breve description ecrite pour le CV : quand elle existe, elle prime. */
  cvSummary?: string | null;
  cvSummaryEn?: string | null;
};

/**
 * Un projet pret a dessiner. La breve description ecrite pour le CV d'abord,
 * telle quelle. A defaut : sous un poste, quelques mots (`resumeProjet`) ;
 * dans « Projets realises », seul endroit ou il est decrit, la description
 * entiere.
 */
export function projetCv(
  p: ProjetBrut,
  complet = false,
  langue: LangueCv = 'fr',
): ProjetCv {
  const ecrite = choisir(p.cvSummary, p.cvSummaryEn, langue)
    ?.trim()
    .replace(/\s+/g, ' ');
  const description = choisir(p.description, p.descriptionEn, langue);
  // Sous un poste, la phrase suit « Nom : » : minuscule initiale, comme les
  // resumes tires de la description. Un sigle (« GED », « API ») est garde.
  const apresDeuxPoints = (t: string) =>
    complet || /^\p{Lu}{2}/u.test(t)
      ? t
      : t.charAt(0).toLowerCase() + t.slice(1);
  return {
    nom: p.name.trim(),
    resume: ecrite
      ? apresDeuxPoints(ecrite)
      : complet
        ? description?.trim()
          ? phrase(description)
          : null
        : resumeProjet(description),
  };
}

/** Le texte d'un projet apres son nom : « : ce qu'il est. », ponctue une
 *  fois, avec la typographie de la langue (« : » en francais, « : » colle en
 *  anglais). */
export function suiteProjet(
  resume: string | null,
  langue: LangueCv = 'fr',
): string {
  if (!resume) return '';
  const deuxPoints = TEXTES[langue].deuxPoints;
  return /[.!?…]$/.test(resume)
    ? `${deuxPoints}${resume}`
    : `${deuxPoints}${resume}.`;
}

/**
 * Une experience telle que le CV la dessine : l'intitule et l'employeur a
 * gauche, la periode a droite, la description dessous, puis les projets en
 * puces. Un recruteur lit d'abord le poste, puis ce qui y a ete construit.
 */
export type PosteCv = {
  intitule: string;
  employeur: string;
  periode: string;
  description: string | null;
  projets: ProjetCv[];
};

export function posteDe(
  e: ExperienceBrute,
  projets: readonly ProjetBrut[] = [],
  langue: LangueCv = 'fr',
): PosteCv {
  const description = choisir(e.description, e.descriptionEn, langue);
  return {
    intitule: choisir(e.role, e.roleEn, langue).trim(),
    employeur: e.company.trim(),
    periode: periodeDe(e, langue),
    description: description?.trim() ? phrase(description) : null,
    projets: projets.map((p) => projetCv(p, false, langue)),
  };
}

/** « Java, de zéro aux objets (Java, niveau débutant, 120 pages) ». */
export function ligneCours(
  c: {
    titre: string;
    titreEn?: string | null;
    niveau: string;
    pages: number | null;
    technology: { label: string } | null;
  },
  langue: LangueCv = 'fr',
): string {
  const t = TEXTES[langue];
  const titre = choisir(c.titre, c.titreEn, langue);
  const details = [
    c.technology?.label,
    t.niveaux[c.niveau] ? `${t.niveau} ${t.niveaux[c.niveau]}` : null,
    c.pages ? `${c.pages} ${t.pages}` : null,
  ].filter(Boolean);
  return details.length ? `${titre} (${details.join(', ')})` : titre;
}

/** Le lieu a remplir a la main quand aucun n'est saisi. */
export const POINTILLES = '........................................';

/**
 * Les deux lignes de la mention de fin, pour un CV a signer : « Fait a
 * Lome, » puis « le 28 octobre 2026 ». Sans lieu, des pointilles a remplir ;
 * sans date, celle du jour de la generation (`aujourdhui`, injectable pour
 * les tests). En UTC, comme les autres dates du CV.
 */
export function lignesFaitA(
  lieu: string | null | undefined,
  date: Date | null | undefined,
  langue: LangueCv = 'fr',
  aujourdhui: Date = new Date(),
): [string, string] {
  const jour = new Intl.DateTimeFormat(TEXTES[langue].locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date ?? aujourdhui);
  const ou = lieu?.trim() || POINTILLES;
  return langue === 'en'
    ? [`Done at ${ou},`, `on ${jour}`]
    : [`Fait à ${ou},`, `le ${jour}`];
}
