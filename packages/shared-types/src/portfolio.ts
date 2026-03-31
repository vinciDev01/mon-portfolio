import type { SiteSettingsDto } from "./site-settings";
import type { PersonalInfoDto } from "./personal-info";
import type { PresentationDto } from "./presentation";
import type { SkillDto } from "./skill";
import type { ExperienceDto } from "./experience";
import type { CertificationDto } from "./certification";
import type { ProjectDto } from "./project";
import type { ServiceDto } from "./service";
import type { AboutDto } from "./about";

export interface PortfolioData {
  siteSettings: SiteSettingsDto;
  personalInfo: PersonalInfoDto;
  presentations: PresentationDto[];
  skills: SkillDto[];
  experiences: ExperienceDto[];
  certifications: CertificationDto[];
  projects: ProjectDto[];
  services: ServiceDto[];
  about: AboutDto[];
}
