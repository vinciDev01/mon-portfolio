import type { TechnologyDto } from "./technology";

export interface ProjectDto {
  id: string;
  name: string;
  description: string | null;
  photo1Path: string | null;
  photo2Path: string | null;
  demoUrl: string | null;
  technologies: TechnologyDto[];
  sortOrder: number;
}
