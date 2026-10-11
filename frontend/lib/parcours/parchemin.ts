import type { ProjectDto, ProjectCollaboratorDto } from "@portfolio/shared-types";

export type BlocParchemin =
  | "photos" | "description" | "public"
  | "technologies" | "collaborateurs" | "demonstration";

/** Vrai quand la chaine porte autre chose que des blancs. */
function renseigne(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim() !== "";
}

/**
 * Les blocs du parchemin, dans l'ordre de lecture de la section 4 de la spec.
 * Un bloc dont la donnee manque n'est pas rendu : pas de titre orphelin, pas
 * d'espace vide. Une chaine de blancs compte comme une absence, le backoffice
 * pouvant enregistrer un champ efface sans le mettre a nul.
 */
export function blocsPresents(projet: ProjectDto): BlocParchemin[] {
  const blocs: BlocParchemin[] = [];
  if (renseigne(projet.photo1Path) || renseigne(projet.photo2Path)) blocs.push("photos");
  if (renseigne(projet.description)) blocs.push("description");
  if (renseigne(projet.targetAudience)) blocs.push("public");
  if (projet.technologies.length > 0) blocs.push("technologies");
  if (projet.collaborators.length > 0) blocs.push("collaborateurs");
  if (renseigne(projet.demoUrl)) blocs.push("demonstration");
  return blocs;
}

export type Credit = { cle: string; nom: string; lien: string | null };

/**
 * Les personnes creditees, triees par `sortOrder` et non par ordre d'arrivee.
 * Un `linkedinUrl` nul ou blanc rend un nom SANS lien, et non un lien mort :
 * c'est la difference entre crediter quelqu'un et donner une adresse fausse.
 * Les courriels ne sortent pas d'ici : la demande ne porte que sur LinkedIn, et
 * exposer une adresse en clair invite les moissonneurs.
 */
export function credits(projet: ProjectDto): Credit[] {
  return [...projet.collaborators]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c: ProjectCollaboratorDto) => ({
      cle: c.id,
      nom: [c.firstName, c.lastName].filter((p) => renseigne(p)).join(" "),
      lien: renseigne(c.linkedinUrl) ? c.linkedinUrl!.trim() : null,
    }));
}
