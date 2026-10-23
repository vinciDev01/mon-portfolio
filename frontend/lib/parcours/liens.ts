/**
 * La regle des liens, partagee : le parchemin et la section contact la lisent
 * tous deux. Un seul exemplaire d'une regle de securite, pour qu'aucun lien ne
 * puisse passer sans filtre d'un cote et pas de l'autre.
 */

/** Vrai quand la chaine porte autre chose que des blancs. */
export function renseigne(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim() !== "";
}

/** Le lien n'est rendu que s'il est une adresse https: valide, sinon null. */
export function lienSur(v: string | null | undefined): string | null {
  if (!renseigne(v)) return null;
  const url = v!.trim();
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
