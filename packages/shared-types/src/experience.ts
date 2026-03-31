export interface ExperienceDto {
  id: string;
  company: string;
  role: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  sortOrder: number;
}
