/**
 * Les lignes du CV qui racontent : une experience avec ce qu'on y a fait et
 * les projets qu'on y a menes, un cours avec sa technologie et son niveau.
 * Pures, pour etre testees sans base ni rendu.
 */

/** « Juillet 2025 », en UTC comme le reste du site : une date saisie au
 *  1er juillet, enregistree a minuit UTC, ne recule pas en juin. */
export function moisAnnee(date: Date | null | undefined): string {
  if (!date) return '';
  const s = new Intl.DateTimeFormat('fr-FR', {
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
export function resumeProjet(description: string | null | undefined): string | null {
  const t = description?.trim().replace(/\s+/g, ' ');
  if (!t) return null;
  const coupe = t.split(/\s:\s|:\s|\.\s|\.$/)[0]!.trim();
  if (!coupe || coupe.length > 90) return null;
  return coupe.charAt(0).toLowerCase() + coupe.slice(1);
}

export function ligneExperience(
  e: {
    role: string;
    company: string;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
  },
  projets: readonly (string | { name: string; description: string | null })[] = [],
): string {
  const debut = moisAnnee(e.startDate);
  const fin = e.isCurrent ? "aujourd'hui" : moisAnnee(e.endDate);
  const periode = [debut, fin].filter(Boolean).join(' à ');
  const morceaux = [`${periode ? `${periode} : ` : ''}${e.role} à ${e.company}.`];
  if (e.description?.trim()) morceaux.push(phrase(e.description));
  if (projets.length) {
    const noms = projets.map((p) => {
      if (typeof p === 'string') return p;
      const resume = resumeProjet(p.description);
      return resume ? `${p.name} (${resume})` : p.name;
    });
    morceaux.push(`Projets : ${noms.join(', ')}.`);
  }
  return morceaux.join(' ');
}

/** Un projet du CV : son nom et ce qu'il est. Ses technologies n'y figurent
 *  pas : la section Technologies les dit deja. */
export type ProjetCv = { nom: string; resume: string | null };

type ProjetBrut = {
  name: string;
  description: string | null;
  /** La breve description ecrite pour le CV : quand elle existe, elle prime. */
  cvSummary?: string | null;
};

/**
 * Un projet pret a dessiner. La breve description ecrite pour le CV d'abord,
 * telle quelle. A defaut : sous un poste, quelques mots (`resumeProjet`) ;
 * dans « Projets realises », seul endroit ou il est decrit, la description
 * entiere.
 */
export function projetCv(p: ProjetBrut, complet = false): ProjetCv {
  const ecrite = p.cvSummary?.trim().replace(/\s+/g, ' ');
  // Sous un poste, la phrase suit « Nom : » : minuscule initiale, comme les
  // resumes tires de la description. Un sigle (« GED », « API ») est garde.
  const apresDeuxPoints = (t: string) => (complet || /^\p{Lu}{2}/u.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));
  return {
    nom: p.name.trim(),
    resume: ecrite
      ? apresDeuxPoints(ecrite)
      : complet
        ? p.description?.trim()
          ? phrase(p.description)
          : null
        : resumeProjet(p.description),
  };
}

/** Le texte d'un projet apres son nom : « : ce qu'il est. », ponctue une fois. */
export function suiteProjet(resume: string | null): string {
  if (!resume) return '';
  return /[.!?…]$/.test(resume) ? ` : ${resume}` : ` : ${resume}.`;
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
  e: {
    role: string;
    company: string;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
  },
  projets: readonly ProjetBrut[] = [],
): PosteCv {
  const debut = moisAnnee(e.startDate);
  const fin = e.isCurrent ? "aujourd'hui" : moisAnnee(e.endDate);
  return {
    intitule: e.role.trim(),
    employeur: e.company.trim(),
    periode: [debut, fin].filter(Boolean).join(' à '),
    description: e.description?.trim() ? phrase(e.description) : null,
    projets: projets.map((p) => projetCv(p)),
  };
}

const NIVEAUX: Record<string, string> = {
  debutant: 'débutant',
  intermediaire: 'intermédiaire',
  avance: 'avancé',
};

/** « Java, de zéro aux objets (Java, niveau débutant, 120 pages) ». */
export function ligneCours(c: {
  titre: string;
  niveau: string;
  pages: number | null;
  technology: { label: string } | null;
}): string {
  const details = [
    c.technology?.label,
    NIVEAUX[c.niveau] ? `niveau ${NIVEAUX[c.niveau]}` : null,
    c.pages ? `${c.pages} pages` : null,
  ].filter(Boolean);
  return details.length ? `${c.titre} (${details.join(', ')})` : c.titre;
}
