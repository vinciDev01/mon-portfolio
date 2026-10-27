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
export function ligneExperience(
  e: {
    role: string;
    company: string;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
  },
  projets: readonly string[] = [],
): string {
  const debut = moisAnnee(e.startDate);
  const fin = e.isCurrent ? "aujourd'hui" : moisAnnee(e.endDate);
  const periode = [debut, fin].filter(Boolean).join(' à ');
  const morceaux = [`${periode ? `${periode} : ` : ''}${e.role} à ${e.company}.`];
  if (e.description?.trim()) morceaux.push(phrase(e.description));
  if (projets.length) morceaux.push(`Projets : ${projets.join(', ')}.`);
  return morceaux.join(' ');
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
