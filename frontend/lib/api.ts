import type { PortfolioData, SiteSettingsDto } from "@portfolio/shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function getPortfolioData(): Promise<PortfolioData> {
  const res = await fetch(`${API_URL}/api/portfolio`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch portfolio data");
  return res.json() as Promise<PortfolioData>;
}

export async function getSiteSettings(): Promise<SiteSettingsDto> {
  const res = await fetch(`${API_URL}/api/site-settings`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch site settings");
  return res.json() as Promise<SiteSettingsDto>;
}

/** L'adresse de telechargement d'un cours : la route publique, qui verifie
 *  que le cours est public et compte le telechargement. Jamais `/uploads`. */
export function getCoursUrl(id: string): string {
  return `${API_URL}/api/cours/${encodeURIComponent(id)}/telecharger`;
}

export function getFileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}/uploads/${path}`;
}
