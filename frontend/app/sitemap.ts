import type { MetadataRoute } from "next";
import { getPortfolioData, getSiteSettings } from "@/lib/api";
import { urlDuSite } from "@/lib/seo/seo";

/**
 * Le plan du site, pour les moteurs de recherche : l'accueil, le blog et
 * chaque article publie, avec sa date. Ce que l'API ne fournit pas (elle
 * est injoignable) se reduit a l'accueil plutot que de faire echouer le plan.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const data = await getPortfolioData();
    const site = urlDuSite(data.siteSettings);
    const articles = data.blogPosts.map((a) => ({
      url: `${site}/blog/${encodeURIComponent(a.slug)}`,
      lastModified: new Date(a.updatedAt ?? a.publishedAt ?? a.createdAt),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    }));
    return [
      { url: site, changeFrequency: "monthly", priority: 1 },
      { url: `${site}/blog`, changeFrequency: "weekly", priority: 0.7 },
      ...articles,
    ];
  } catch {
    const site = urlDuSite(await getSiteSettings().catch(() => null));
    return [{ url: site, priority: 1 }];
  }
}
