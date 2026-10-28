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
  /** Breve description pour le CV ; vide, le CV prend le debut de la description. */
  cvSummary?: string | null;
  photo1Path: string | null;
  photo2Path: string | null;
  /** L'adresse de la DEMONSTRATION : une video, un bac a sable, une maquette. */
  demoUrl: string | null;
  /** L'adresse du projet LUI-MEME, son site en ligne. Nullable en base. */
  projectUrl: string | null;
  targetAudience: string | null;
  startDate: string | null;
  endDate: string | null;
  /** L'experience professionnelle du projet, ou `null` pour un projet
   *  personnel. */
  experienceId: string | null;
  technologies: TechnologyDto[];
  collaborators: ProjectCollaboratorDto[];
  sortOrder: number;
}

/** Raw project as returned by /api/projects (with join table) */
export interface ProjectRawDto {
  id: string;
  name: string;
  description: string | null;
  /** Breve description pour le CV ; vide, le CV prend le debut de la description. */
  cvSummary?: string | null;
  photo1Path: string | null;
  photo2Path: string | null;
  /** L'adresse de la DEMONSTRATION : une video, un bac a sable, une maquette. */
  demoUrl: string | null;
  /** L'adresse du projet LUI-MEME, son site en ligne. Nullable en base. */
  projectUrl: string | null;
  targetAudience: string | null;
  startDate: string | null;
  endDate: string | null;
  /** L'experience professionnelle du projet, ou `null` pour un projet
   *  personnel. */
  experienceId: string | null;
  technologies: ProjectTechnologyDto[];
  collaborators: ProjectCollaboratorDto[];
  sortOrder: number;
}
