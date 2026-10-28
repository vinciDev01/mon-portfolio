import type { TechnologyFamilyDto } from "./technology-family";

export interface TechnologyDto {
  id: string;
  label: string;
  logoPath: string | null;
  /** Identifiant du logo dans le catalogue Simple Icons (« openjdk ») :
   *  rien n'est stocke. Une image chargee (`logoPath`) passe avant. */
  logoSlug: string | null;
  /** Le trace SVG de ce logo, boite 24 x 24, joint par l'API. */
  logoTrace?: string | null;
  /** Sa couleur de marque, six chiffres hexadecimaux sans « # ». */
  logoHex?: string | null;
  sortOrder: number;
  /** Faux : la technologie reste au portfolio mais ne sort pas dans le CV. */
  showInCv: boolean;
  /** Famille, choisie dans la liste geree : le CV range par famille.
   *  `null` : « Autres ». */
  familyId: string | null;
  family: TechnologyFamilyDto | null;
}
