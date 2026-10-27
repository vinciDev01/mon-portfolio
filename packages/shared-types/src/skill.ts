import type { TechnologyDto } from "./technology";
import type { TechnologyFamilyDto } from "./technology-family";

/**
 * Une competence : liee a une technologie (Java), dont elle prend le nom, le
 * logo et la famille ; ou libre (Management), avec son nom et sa famille.
 */
export interface SkillDto {
  id: string;
  technologyId: string | null;
  technology: TechnologyDto | null;
  /** Nom d'une competence libre ; null quand une technologie est liee. */
  label: string | null;
  familyId: string | null;
  /** Famille d'une competence libre. */
  family: TechnologyFamilyDto | null;
  proficiency: number | null;
  sortOrder: number;
}
