import type { TechnologyDto } from "./technology";

export interface ProjectCollaboratorDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  linkedinUrl: string | null;
  sortOrder: number;
}

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
  targetAudience: string | null;
  startDate: string | null;
  endDate: string | null;
  technologies: TechnologyDto[];
  collaborators: ProjectCollaboratorDto[];
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
  targetAudience: string | null;
  startDate: string | null;
  endDate: string | null;
  technologies: ProjectTechnologyDto[];
  collaborators: ProjectCollaboratorDto[];
  sortOrder: number;
}
