export interface CvSectionDto {
  id: string;
  titre: string;
  /** Une entree par ligne. */
  lignes: string;
  /** Fausse pour tout ce qui ne doit pas partir dans le CV telechargeable. */
  publique: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
