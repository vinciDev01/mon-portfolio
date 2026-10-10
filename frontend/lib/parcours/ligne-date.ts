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

  const format = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const debut = format.format(bornes[0]);
  const fin = format.format(bornes[bornes.length - 1]);
  return debut === fin
    ? t("journal.periodeUnique", { date: debut })
    : t("journal.periode", { debut, fin });
}

export type Disposition = { tete: ProjectDto; suite: ProjectDto[] } | null;

/** Le projet de tete est le plus petit `sortOrder` ; l'entree n'est pas mutee. */
export function dispositionJournal(projets: ProjectDto[]): Disposition {
  if (projets.length === 0) return null;
  const ordonnes = [...projets].sort((a, b) => a.sortOrder - b.sortOrder);
  return { tete: ordonnes[0], suite: ordonnes.slice(1) };
}
