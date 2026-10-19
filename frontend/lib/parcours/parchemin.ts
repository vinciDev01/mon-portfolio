import type { ProjectDto, ProjectCollaboratorDto } from "@portfolio/shared-types";

export type BlocParchemin =
  | "photos" | "description" | "public"
  | "technologies" | "collaborateurs" | "adresseProjet" | "demonstration";

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
  // Derive de ce qui sera affiche : credits() exclut les sans-nom, donc le compte
  // brut laisserait un titre sans personne dessous. (credits est hissee.)
  if (credits(projet).length > 0) blocs.push("collaborateurs");
  // Les DEUX adresses ferment le parchemin, et dans cet ordre : ce sont des
  // ACTIONS, elles vont donc apres les blocs descriptifs. L'adresse du projet
  // vient AVANT la demonstration, qui reste « en cloture, comme l'action
  // finale » selon la section 4 de la spec : une demonstration est un artefact
  // DERIVE du projet, elle suit naturellement la chose qu'elle demontre.
  //
  // Meme regle que ci-dessous : le bloc suit le LIEN, pas le champ.
  if (lienProjet(projet) !== null) blocs.push("adresseProjet");
  // Et non `renseigne(demoUrl)` : le bloc suit le LIEN, pas le champ. Sans
  // cela, un `javascript:` saisi au backoffice rendrait un bloc titre dont le
  // lien est nul, c'est-a-dire un bloc vide.
  if (lienDemo(projet) !== null) blocs.push("demonstration");
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
 * Le lien de demonstration, soumis a la MEME regle que les liens des credits :
 * ce champ est rendu comme un lien VIVANT sur une page publique et il vient du
 * backoffice, donc `javascript:`, `data:` et `http:` ne passent pas. Nul quand
 * l'adresse n'est pas exploitable, auquel cas `blocsPresents` ecarte le bloc :
 * les deux lisent la meme fonction, ils ne peuvent pas diverger.
 */
export function lienDemo(projet: ProjectDto): string | null {
  return lienSur(projet.demoUrl);
}

/**
 * L'adresse du projet LUI-MEME, son site en ligne. A ne pas confondre avec
 * `demoUrl` : celui-la montre une DEMONSTRATION (video, bac a sable), celui-ci
 * mene au projet.
 *
 * Soumise a la MEME regle `https:` que le lien de demonstration et que les
 * liens des credits, par la meme fonction : c'est la discipline du chantier,
 * etablie apres qu'un champ est passe sans filtre. `blocsPresents` lit cette
 * fonction et non le champ brut, donc le bloc et le lien ne peuvent pas
 * diverger : une adresse ecartee emporte son bloc, il n'y a jamais de titre
 * sans lien dessous.
 */
export function lienProjet(projet: ProjectDto): string | null {
  return lienSur(projet.projectUrl);
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
