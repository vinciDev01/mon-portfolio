import type { TechnologyDto } from "./technology";

export interface SkillDto {
  id: string;
  technologyId: string;
  technology: TechnologyDto;
  proficiency: number | null;
  sortOrder: number;
}
