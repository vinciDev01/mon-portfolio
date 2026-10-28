export interface TechnologyFamilyDto {
  id: string;
  name: string;
  /** Version anglaise, pour le CV en anglais ; vide : le francais. */
  nameEn?: string | null;
  /** Ordre des familles dans le CV. */
  sortOrder: number;
}
