import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/api";
import { urlDuSite } from "@/lib/seo/seo";

/**
 * Le robots.txt : tout le site est indexable, sauf les routes d'API ; en
 * maintenance, rien ne l'est. Il indique ou trouver le plan du site.
 */
export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const reglages = await getSiteSettings().catch(() => null);
  const site = urlDuSite(reglages);
  return {
    rules: reglages?.maintenanceMode ? { userAgent: "*", disallow: "/" } : { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
