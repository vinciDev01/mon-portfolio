export interface ExperienceDto {
  id: string;
  company: string;
  role: string;
  /** Version anglaise, pour le CV en anglais ; vide : le francais. */
  roleEn?: string | null;
  description: string | null;
  /** Version anglaise, pour le CV en anglais ; vide : le francais. */
  descriptionEn?: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  sortOrder: number;
}
