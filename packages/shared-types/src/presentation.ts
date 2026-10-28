export interface PresentationDto {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  /** Version anglaise, pour le CV en anglais ; vide : le francais. */
  descriptionEn?: string | null;
  sortOrder: number;
}
