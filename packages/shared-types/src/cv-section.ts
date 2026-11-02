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
  /** La presentation du corps : une puce par entree, les entrees separees
   *  par des virgules, ou une entree par ligne sans puce. */
  format: "puces" | "virgules" | "lignes";
  createdAt: string;
  updatedAt: string;
}
