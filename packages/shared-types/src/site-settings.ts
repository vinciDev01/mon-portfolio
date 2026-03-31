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
}
