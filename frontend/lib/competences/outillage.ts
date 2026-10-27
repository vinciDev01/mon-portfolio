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

/** Une bande assez longue pour couvrir la rangee : la liste repetee jusqu'a
 *  `minimum` etiquettes au moins. Une rangee de trois ne laisse pas de trou. */
export function remplirBande<T>(liste: T[], minimum = 10): T[] {
  if (!liste.length) return [];
  const fois = Math.max(1, Math.ceil(minimum / liste.length));
  return Array.from({ length: fois }, () => liste).flat();
}

/** Le niveau d'une competence en pierres, de 1 a 3 ; 0 sans niveau saisi. */
export function niveauDe(maitrise: number | null): number {
  if (maitrise === null || maitrise === undefined) return 0;
  if (maitrise >= 80) return 3;
  if (maitrise >= 60) return 2;
  return 1;
}
