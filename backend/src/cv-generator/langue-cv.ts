/**
 * La langue du CV. Les textes saisis au backoffice ont une version anglaise
 * facultative (`choisir`) ; tout le reste, titres de section, dates, niveaux,
 * libelles des coordonnees, vient d'ici.
 */
export const LANGUES_CV = ['fr', 'en'] as const;
export type LangueCv = (typeof LANGUES_CV)[number];

/** Une langue recue de l'exterieur (une requete) : inconnue, le francais. */
export function langueCv(brute: unknown): LangueCv {
  return brute === 'en' ? 'en' : 'fr';
}

/**
 * Le texte dans la langue du CV : la version anglaise si elle est demandee
 * et renseignee, sinon le francais. Jamais un trou : un CV anglais incomplet
 * reprend le francais plutot que d'omettre une ligne.
 */
export function choisir<T extends string | null | undefined>(
  francais: T,
  anglais: string | null | undefined,
  langue: LangueCv,
): T | string {
  return langue === 'en' && anglais?.trim() ? anglais.trim() : francais;
}

type Textes = {
  titres: Record<
    | 'presentation'
    | 'experiences'
    | 'competences'
    | 'technologies'
    | 'projets'
    | 'certifications'
    | 'cours',
    string
  >;
  aujourdhui: string;
  /** Entre deux dates : « mars 2025 a juin 2026 ». */
  jusqua: string;
  /** Entre le poste et l'employeur, dans la ligne a plat. */
  chez: string;
  projets: string;
  autres: string;
  niveaux: Record<string, string>;
  niveau: string;
  pages: string;
  /** Le signe qui suit une etiquette : « Tel : » en francais, « Phone: » en anglais. */
  deuxPoints: string;
  contact: Record<
    'adresse' | 'tel' | 'email' | 'github' | 'linkedin' | 'portfolio',
    string
  >;
  /** La legende sous le QR code du portfolio. */
  legendeQr: string;
  locale: string;
};

export const TEXTES: Record<LangueCv, Textes> = {
  fr: {
    titres: {
      presentation: 'PRÉSENTATION',
      experiences: 'EXPÉRIENCES PROFESSIONNELLES',
      competences: 'COMPÉTENCES',
      technologies: 'TECHNOLOGIES',
      projets: 'PROJETS RÉALISÉS',
      certifications: 'CERTIFICATIONS',
      cours: 'COURS RÉDIGÉS',
    },
    aujourdhui: "aujourd'hui",
    jusqua: 'à',
    chez: 'à',
    projets: 'Projets',
    autres: 'Autres',
    niveaux: {
      debutant: 'débutant',
      intermediaire: 'intermédiaire',
      avance: 'avancé',
    },
    niveau: 'niveau',
    pages: 'pages',
    deuxPoints: ' : ',
    contact: {
      adresse: 'Adresse',
      tel: 'Tel',
      email: 'Email',
      github: 'Github',
      linkedin: 'LinkedIn',
      portfolio: 'Portfolio',
    },
    legendeQr: 'Mon portfolio',
    locale: 'fr-FR',
  },
  en: {
    titres: {
      presentation: 'SUMMARY',
      experiences: 'PROFESSIONAL EXPERIENCE',
      competences: 'SKILLS',
      technologies: 'TECHNOLOGIES',
      projets: 'PROJECTS',
      certifications: 'CERTIFICATIONS',
      cours: 'COURSES WRITTEN',
    },
    aujourdhui: 'present',
    jusqua: 'to',
    chez: 'at',
    projets: 'Projects',
    autres: 'Other',
    niveaux: {
      debutant: 'beginner',
      intermediaire: 'intermediate',
      avance: 'advanced',
    },
    niveau: 'level',
    pages: 'pages',
    deuxPoints: ': ',
    contact: {
      adresse: 'Address',
      tel: 'Phone',
      email: 'Email',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      portfolio: 'Portfolio',
    },
    legendeQr: 'My portfolio',
    locale: 'en-GB',
  },
};
