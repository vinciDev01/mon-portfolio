import type { PersonalInfoDto } from "@portfolio/shared-types";

/**
 * Initiales du proprietaire : premiere lettre du prenom et du nom, apres retrait
 * des blancs. Regle unique, lue par la colonne de navigation comme par le
 * medaillon : deux copies divergentes donneraient deux reponses dans une meme page.
 */
export function initialesDe(infos: Pick<PersonalInfoDto, "name" | "surname">): string {
  return `${infos.name?.trim()[0] ?? ""}${infos.surname?.trim()[0] ?? ""}`.toUpperCase();
}
