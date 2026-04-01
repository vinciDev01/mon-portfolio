import type { TechnologyDto } from "./technology";

export interface ProjectTechnologyDto {
  id: string;
  technologyId: string;
  technology: TechnologyDto;
}

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

/** Raw project as returned by /api/projects (with join table) */
export interface ProjectRawDto {
  id: string;
  name: string;
  description: string | null;
  photo1Path: string | null;
  photo2Path: string | null;
  demoUrl: string | null;
  technologies: ProjectTechnologyDto[];
  sortOrder: number;
}
