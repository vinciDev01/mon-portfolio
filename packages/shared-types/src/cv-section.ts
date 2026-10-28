export interface CvSectionDto {
  id: string;
  titre: string;
  /** Version anglaise, pour le CV en anglais ; vide : le francais. */
  titreEn?: string | null;
  /** Une entree par ligne. */
  lignes: string;
  /** Version anglaise, pour le CV en anglais ; vide : le francais. */
  lignesEn?: string | null;
  /** Fausse pour tout ce qui ne doit pas partir dans le CV telechargeable. */
  publique: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
