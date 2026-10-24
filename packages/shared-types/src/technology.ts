import type { TechnologyFamilyDto } from "./technology-family";

export interface TechnologyDto {
  id: string;
  label: string;
  logoPath: string | null;
  sortOrder: number;
  /** Faux : la technologie reste au portfolio mais ne sort pas dans le CV. */
  showInCv: boolean;
  /** Famille, choisie dans la liste geree : le CV range par famille.
   *  `null` : « Autres ». */
  familyId: string | null;
  family: TechnologyFamilyDto | null;
}
