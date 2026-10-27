import type { TechnologyDto } from "./technology";

export type NiveauCours = "debutant" | "intermediaire" | "avance";

/** Un cours tel que le site le recoit : jamais son fichier, son compteur ni
 *  sa visibilite (seuls les cours publics y parviennent). Sa technologie
 *  porte sa famille, qui decide de la planche. */
export interface CoursPublicDto {
  id: string;
  titre: string;
  titreCourt: string | null;
  description: string | null;
  niveau: NiveauCours;
  pages: number | null;
  /** Taille du PDF, en octets. */
  taille: number;
  updatedAt: string;
  sortOrder: number;
  technology: TechnologyDto;
}

/** Un cours tel que le backoffice le gere. */
export interface CoursDto extends CoursPublicDto {
  publique: boolean;
  telechargements: number;
  fichier: string;
  technologyId: string;
}
