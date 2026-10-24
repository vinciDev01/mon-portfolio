export interface TechnologyDto {
  id: string;
  label: string;
  logoPath: string | null;
  sortOrder: number;
  /** Faux : la technologie reste au portfolio mais ne sort pas dans le CV. */
  showInCv: boolean;
  /** Famille (Langages, Frameworks, Outils...) : le CV range par famille.
   *  `null` : « Autres ». */
  family: string | null;
}
