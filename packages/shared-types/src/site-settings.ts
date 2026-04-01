export interface SiteSettingsDto {
  id: string;
  faviconPath: string | null;
  logoPath: string | null;
  bgColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  toastMessage: string | null;
  toastDelayMs: number;
  cvFilePath: string | null;
  showPresentations: boolean;
  showSkills: boolean;
  showExperiences: boolean;
  showCertifications: boolean;
  showProjects: boolean;
  showServices: boolean;
  showAbout: boolean;
  showContact: boolean;
  showTestimonials: boolean;
  defaultLanguage: string;
}
