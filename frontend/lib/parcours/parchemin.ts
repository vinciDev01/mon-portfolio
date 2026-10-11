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

/** Le lien n'est rendu que s'il est une adresse https: valide, sinon null. */
function lienSur(v: string | null | undefined): string | null {
  if (!renseigne(v)) return null;
  const url = v!.trim();
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/**
 * Les personnes creditees, triees par `sortOrder` (tri stable : a egalite,
 * l'ordre d'arrivee est conserve) et non par ordre d'arrivee.
 * Un `linkedinUrl` nul, blanc ou hors `https:` rend un nom SANS lien : ce champ
 * est rendu comme un lien vivant sur une page publique, donc `javascript:` et
 * `http:` ne passent pas. Un collaborateur sans prenom ni nom est exclu : un
 * credit sans nom ne dit rien.
 * Les courriels ne sortent jamais d'ici : c'est une donnee personnelle et le
 * parchemin est une page publique.
 */
export function credits(projet: ProjectDto): Credit[] {
  return [...projet.collaborators]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c: ProjectCollaboratorDto) => ({
      cle: c.id,
      nom: [c.firstName, c.lastName].filter((p) => renseigne(p)).map((p) => p.trim()).join(" "),
      lien: lienSur(c.linkedinUrl),
    }))
    .filter((c) => c.nom !== "");
}
