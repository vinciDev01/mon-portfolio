import type { ProjectDto } from "@portfolio/shared-types";

/**
 * Les projets ranges sous l'identifiant de leur experience, dans l'ordre ou
 * ils arrivent, c'est-a-dire celui de la section des projets. Un projet
 * personnel, sans experience, n'y figure pas : il ne parait que dans la
 * section des projets.
 */
export function projetsParExperience(projets: ProjectDto[]): Map<string, ProjectDto[]> {
  const groupes = new Map<string, ProjectDto[]>();
  for (const p of projets) {
    if (!p.experienceId) continue;
    const groupe = groupes.get(p.experienceId);
    if (groupe) groupe.push(p);
    else groupes.set(p.experienceId, [p]);
  }
  return groupes;
}
