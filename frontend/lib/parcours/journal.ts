import type { ProjectDto } from "@portfolio/shared-types";

/**
 * La ligne de date du journal se calcule des donnees et jamais de l'horloge :
 * une une qui change chaque jour perdrait la coherence du cache de
 * revalidation, et n'apporterait rien.
 *
 * On prend le plus petit et le plus grand de TOUTES les bornes, debuts et
 * termes confondus, plutot que le plus petit debut et le plus grand terme.
 * Rien n'empeche aujourd'hui un `startDate` posterieur a son `endDate` : avec
 * la seconde methode la ligne s'inverserait.
 */
export function ligneDate(
  projets: ProjectDto[],
  locale: string,
  t: (cle: string, params?: Record<string, string>) => string,
): string | null {
  const bornes = projets
    .flatMap((p) => [p.startDate, p.endDate])
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (bornes.length === 0) return null;

  const format = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    // Les dates viennent de la base en date seule, donc analysees en UTC : on
    // les formate dans le meme fuseau pour que le serveur et le navigateur
    // ecrivent la meme chose.
    timeZone: "UTC",
  });
  const debut = format.format(bornes[0]);
  // Un projet commence et sans terme est en cours : la periode court jusqu'a
  // aujourd'hui, mot fixe et non date du jour (voir plus haut).
  if (projets.some((p) => p.startDate && !p.endDate)) {
    return projets.length === 1 ? t("journal.depuis", { date: debut }) : t("journal.periodeEnCours", { debut });
  }
  const fin = format.format(bornes[bornes.length - 1]);
  return debut === fin
    ? t("journal.periodeUnique", { date: debut })
    : t("journal.periode", { debut, fin });
}

/**
 * La ligne de date d'un seul article : meme chemin de formatage que celle du
 * bandeau (UTC, langue courante), jamais l'horloge. Nulle sans date.
 */
export function ligneDateProjet(
  projet: ProjectDto,
  locale: string,
  t: (cle: string, params?: Record<string, string>) => string,
): string | null {
  return ligneDate([projet], locale, t);
}

/**
 * La signature de l'article : "avec X et Y". Seuls les noms reviennent ; ni le
 * courriel ni le profil LinkedIn d'un collaborateur ne sont affiches. Nulle
 * sans collaborateur.
 */
export function ligneCollaborateurs(
  projet: ProjectDto,
  locale: string,
  t: (cle: string, params?: Record<string, string>) => string,
): string | null {
  const noms = [...projet.collaborators]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => `${c.firstName} ${c.lastName}`.trim())
    .filter((n) => n.length > 0);
  if (noms.length === 0) return null;
  const liste = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
  return t("journal.collaborateurs", { noms: liste.format(noms) });
}

export type Disposition = { tete: ProjectDto; suite: ProjectDto[] } | null;

/** Le projet de tete est le plus petit `sortOrder` ; l'entree n'est pas mutee. */
export function dispositionJournal(projets: ProjectDto[]): Disposition {
  if (projets.length === 0) return null;
  const ordonnes = [...projets].sort((a, b) => a.sortOrder - b.sortOrder);
  return { tete: ordonnes[0], suite: ordonnes.slice(1) };
}

/** Projets par page, sous le projet de tete : trois rangees de deux colonnes. */
export const PROJETS_PAR_PAGE = 6;

/** Une page de la suite : ses projets, son numero (ramene dans les bornes) et
 *  le nombre de pages. Une suite courte tient sur une seule page. */
export function pageDeSuite<T>(
  suite: T[],
  page: number,
  parPage = PROJETS_PAR_PAGE,
): { elements: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(suite.length / parPage));
  const juste = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { elements: suite.slice((juste - 1) * parPage, juste * parPage), page: juste, pages };
}
