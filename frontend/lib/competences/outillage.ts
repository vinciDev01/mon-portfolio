import type { TechnologyDto, TechnologyFamilyDto } from "@portfolio/shared-types";

/** Un tiroir de la boite a outils : une famille et ses technologies.
 *  `famille` nulle : « Autres », les technologies sans famille. */
export type Tiroir = { famille: TechnologyFamilyDto | null; technologies: TechnologyDto[] };

/**
 * Les technologies rangees par famille : les familles dans leur ordre
 * `sortOrder` puis leur nom, « Autres » en dernier, aucun tiroir vide. Dans
 * un tiroir, l'ordre de la technologie puis son nom.
 */
export function rangerParFamille(technologies: TechnologyDto[]): Tiroir[] {
  const tiroirs = new Map<string | null, Tiroir>();
  for (const t of technologies) {
    const famille = t.family ?? null;
    const cle = famille?.id ?? null;
    const tiroir = tiroirs.get(cle);
    if (tiroir) tiroir.technologies.push(t);
    else tiroirs.set(cle, { famille, technologies: [t] });
  }
  for (const t of tiroirs.values()) {
    t.technologies.sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "fr"));
  }
  return [...tiroirs.values()].sort((x, y) => {
    if (!x.famille) return 1;
    if (!y.famille) return -1;
    return x.famille.sortOrder - y.famille.sortOrder || x.famille.name.localeCompare(y.famille.name, "fr");
  });
}
