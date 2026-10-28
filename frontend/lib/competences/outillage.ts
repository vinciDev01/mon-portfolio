import type { SkillDto, TechnologyFamilyDto } from "@portfolio/shared-types";

/**
 * Une competence telle que la section l'affiche : liee a une technologie,
 * elle en prend le nom, le logo et la famille ; libre (Management), elle
 * porte les siens.
 */
export type Competence = {
  id: string;
  nom: string;
  famille: TechnologyFamilyDto | null;
  logoPath: string | null;
  /** Le trace du logo du catalogue, joint par l'API. */
  logoTrace: string | null;
  /** Sa couleur de marque, sans « # ». */
  logoHex: string | null;
  niveau: number;
  ordre: number;
};

/** Le niveau d'une competence en pierres, de 1 a 3 ; 0 sans niveau saisi. */
export function niveauDe(maitrise: number | null): number {
  if (maitrise === null || maitrise === undefined) return 0;
  if (maitrise >= 80) return 3;
  if (maitrise >= 60) return 2;
  return 1;
}

export function competenceDe(s: SkillDto): Competence {
  return {
    id: s.id,
    nom: s.technology?.label ?? s.label ?? "",
    famille: s.technology?.family ?? s.family ?? null,
    logoPath: s.technology?.logoPath ?? null,
    logoTrace: s.technology?.logoTrace ?? null,
    logoHex: s.technology?.logoHex ?? null,
    niveau: niveauDe(s.proficiency),
    ordre: s.sortOrder,
  };
}

/** Un tiroir : une famille et ses competences. `famille` nulle : « Autres ». */
export type Tiroir = { famille: TechnologyFamilyDto | null; competences: Competence[] };

/**
 * Les competences rangees par famille : les familles dans leur ordre
 * `sortOrder` puis leur nom, « Autres » en dernier, aucun tiroir vide. Dans
 * un tiroir, l'ordre saisi au backoffice puis le nom.
 */
export function rangerParFamille(competences: Competence[]): Tiroir[] {
  const tiroirs = new Map<string | null, Tiroir>();
  for (const c of competences) {
    if (!c.nom) continue;
    const cle = c.famille?.id ?? null;
    const tiroir = tiroirs.get(cle);
    if (tiroir) tiroir.competences.push(c);
    else tiroirs.set(cle, { famille: c.famille, competences: [c] });
  }
  for (const t of tiroirs.values()) {
    t.competences.sort((a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom, "fr"));
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
