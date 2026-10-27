import type { CoursPublicDto } from "@portfolio/shared-types";

/** Minuscules sans accents : « debutant » trouve « Débutant ». */
function normaliser(texte: string): string {
  return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Les cours dont le texte contient chaque mot de la requete : titre, titre
 * court, description, technologie et sa famille. Sans mot, tous les cours,
 * dans leur ordre. Meme regle que la recherche de l'API du backoffice, les
 * accents en plus.
 */
export function filtrerCours(cours: CoursPublicDto[], requete: string): CoursPublicDto[] {
  const mots = normaliser(requete).split(/\s+/).filter(Boolean);
  if (!mots.length) return cours;
  return cours.filter((c) => {
    const texte = normaliser(
      [c.titre, c.titreCourt, c.description, c.technology.label, c.technology.family?.name].filter(Boolean).join(" "),
    );
    return mots.every((m) => texte.includes(m));
  });
}
