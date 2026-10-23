import type { PersonalInfoDto } from "@portfolio/shared-types";
import { lienSur, renseigne } from "./liens";

/**
 * Les regles pures des canaux de contact : quels canaux existent, et comment
 * chacun devient un lien. Aucun React ici, aucun `t()` : le module rend la CLE
 * i18n du libelle et c'est le composant qui la resout, comme SectionShell
 * recoit `cleTitre` et non un titre.
 */

export type CleCanal = "courriel" | "telephone" | "linkedin" | "github";

export type Canal = {
  cle: CleCanal;
  /** Cle i18n du libelle, jamais un libelle resolu. */
  cleLibelle: string;
  /** Ce qui s'affiche. */
  valeur: string;
  href: string;
};

/**
 * `contact.email` existe deja dans les trois dictionnaires. Les trois autres
 * sont creees par la tache 3 : ce module ne fait que les nommer.
 */
export const CLE_LIBELLE_COURRIEL = "contact.email";
export const CLE_LIBELLE_TELEPHONE = "contact.phone";
export const CLE_LIBELLE_LINKEDIN = "contact.linkedin";
export const CLE_LIBELLE_GITHUB = "contact.github";

/**
 * Les canaux qui s'affichent, dans l'ordre de lecture : courriel, telephone,
 * LinkedIn, GitHub. Un canal dont la valeur n'est pas exploitable est absent.
 */
export function canaux(infos: PersonalInfoDto): Canal[] {
  const liste: Canal[] = [];

  if (renseigne(infos.email)) {
    const courriel = infos.email.trim();
    liste.push({
      cle: "courriel",
      cleLibelle: CLE_LIBELLE_COURRIEL,
      valeur: courriel,
      href: `mailto:${courriel}`,
    });
  }

  if (renseigne(infos.phone)) {
    const numero = infos.phone!.trim();
    liste.push({
      cle: "telephone",
      cleLibelle: CLE_LIBELLE_TELEPHONE,
      valeur: numero,
      href: `tel:${numero.replace(/\s/g, "")}`,
    });
  }

  const linkedin = lienSur(infos.linkedinUrl);
  if (linkedin) {
    liste.push({
      cle: "linkedin",
      cleLibelle: CLE_LIBELLE_LINKEDIN,
      valeur: "LinkedIn",
      href: linkedin,
    });
  }

  const github = lienSur(infos.githubUrl);
  if (github) {
    liste.push({
      cle: "github",
      cleLibelle: CLE_LIBELLE_GITHUB,
      valeur: "GitHub",
      href: github,
    });
  }

  return liste;
}
