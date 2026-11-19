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
  allowTestimonialSubmission: boolean;
  defaultLanguage: string;
  availabilityStatus: string;
  availabilityLabel: string | null;
  maintenanceMode: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoImagePath: string | null;
  notificationEmail: string | null;
  themeParDefaut: "auto" | "clair" | "sombre";
  showStats: boolean;
  typeScale: "compact" | "normal" | "airy";
  lineHeight: number;
  zigzagAmplitude: number;
  sectionSpacing: number;
  animationsEnabled: boolean;
  animationSpeed: number;
  respectReducedMotion: boolean;
  cvFontFamily: string;
  showCvDownload: boolean;
  /** Le poste vise, imprime sous le nom en tete du CV ; `null` : pas de ligne. */
  cvJobTitle: string | null;
  /** Version anglaise, pour le CV en anglais ; vide : le francais. */
  cvJobTitleEn?: string | null;
  /** L'adresse publique du portfolio : lien et QR code du CV. */
  siteUrl: string | null;
  /** Le QR code du portfolio en tete du CV, quand l'adresse est renseignee. */
  cvAfficherQr: boolean;
  /** « Fait a ..., le ... » en fin de CV. */
  cvFaitA: boolean;
  /** Le lieu ; null : une ligne pointillee a remplir. */
  cvLieu: string | null;
  /** La date (AAAA-MM-JJ) ; null : le jour de la generation. */
  cvDateFaitA: string | null;
  /** Un blanc reserve sous la date, pour signer. */
  cvEspaceSignature: boolean;
  /** Les sections retirees du CV general : cles de la base et identifiants
   *  des sections libres. Vide : toutes incluses. */
  cvBaseMasquees: string[];
  /** Le rang de chaque section de la base dans le CV, regle par les fleches
   *  de la page « Sections du CV ». Une cle absente : le rang d'origine. */
  cvRangsBase: Record<string, number>;
  /** L'en-tete commun des lettres de motivation, une ligne par information ;
   *  null : deduit des informations personnelles. */
  lettreEnTete: string | null;
  /** Affiche la section Cours. */
  showCours: boolean;
  accentHue: number;
  accentSaturation: number;
}
