import type { PortfolioData, SiteSettingsDto } from "@portfolio/shared-types";

/**
 * Le referencement : l'adresse publique du site, et les fiches de donnees
 * structurees (schema.org, en JSON-LD) que lisent Google et les reseaux
 * sociaux. Fonctions pures, testees sans rendu.
 */

/**
 * L'adresse publique du site, sans barre finale : celle saisie au backoffice
 * (« Adresse publique du portfolio »), sinon `NEXT_PUBLIC_SITE_URL`, sinon
 * l'adresse locale de developpement.
 */
export function urlDuSite(reglages: Pick<SiteSettingsDto, "siteUrl"> | null | undefined): string {
  const brute = reglages?.siteUrl?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return brute.replace(/\/+$/, "");
}

/** Une adresse absolue : les fiches et les apercus n'acceptent pas de chemin relatif. */
export function absolue(chemin: string, base: string): string {
  return /^https?:\/\//i.test(chemin) ? chemin : `${base}${chemin.startsWith("/") ? "" : "/"}${chemin}`;
}

const https = (u: string | null | undefined): u is string => typeof u === "string" && /^https:\/\//i.test(u.trim());

/**
 * La fiche « Personne » : nom (nom de famille d'abord, comme sur le CV), poste, adresse du site, photo, profils
 * (LinkedIn, GitHub), employeur actuel et competences. C'est elle qui permet
 * a Google de relier le portfolio a la personne dans ses resultats.
 */
export function fichePersonne(data: PortfolioData, site: string, photo: string | null) {
  const p = data.personalInfo;
  const nom = `${p.name} ${p.surname}`.trim();
  const posteActuel = data.experiences.find((e) => e.isCurrent);
  const poste = data.siteSettings.cvJobTitle?.trim() || data.presentations[0]?.title || posteActuel?.role;
  const competences = data.skills
    .map((s) => s.technology?.label ?? s.label)
    .filter((x): x is string => Boolean(x));
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: nom,
    url: site,
    ...(poste ? { jobTitle: poste } : {}),
    ...(photo ? { image: photo } : {}),
    ...(p.email ? { email: `mailto:${p.email}` } : {}),
    sameAs: [p.linkedinUrl, p.githubUrl].filter(https).map((u) => u.trim()),
    ...(posteActuel ? { worksFor: { "@type": "Organization", name: posteActuel.company } } : {}),
    ...(competences.length ? { knowsAbout: competences } : {}),
  };
}

/** La fiche « Site web », avec la personne pour auteur et ses langues. */
export function ficheSite(data: PortfolioData, site: string) {
  const p = data.personalInfo;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: data.siteSettings.seoTitle?.trim() || `${p.name} ${p.surname}`.trim(),
    url: site,
    inLanguage: ["fr", "en", "de"],
    author: { "@type": "Person", name: `${p.name} ${p.surname}`.trim() },
  };
}

/**
 * Une fiche prete a poser dans un `<script type="application/ld+json">` :
 * « < » echappe, pour qu'un texte saisi au backoffice ne puisse jamais
 * fermer la balise et injecter du HTML.
 */
export function enJsonLd(fiche: unknown): string {
  return JSON.stringify(fiche).replace(/</g, "\\u003c");
}
