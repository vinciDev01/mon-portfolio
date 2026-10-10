import type { SiteSettingsDto } from "@portfolio/shared-types";

export type EntreeSection = { ancre: string; cleTitre: string };

/**
 * Les ancres suivent les identifiants francais rendus par SectionShell dans
 * app/page.tsx. « certifications » n'a pas d'entree propre : c'est un sous-bloc
 * de « experience », et une entree dediee ferait doublon.
 * L'ordre suit exactement le rendu de page.tsx, qui fait autorite (un test le
 * verifie).
 */
const TOUTES: Array<EntreeSection & { reglage: keyof SiteSettingsDto }> = [
  { ancre: "ouverture", cleTitre: "nav.presentation", reglage: "showPresentations" },
  { ancre: "stats", cleTitre: "section.stats", reglage: "showStats" },
  { ancre: "competences", cleTitre: "nav.skills", reglage: "showSkills" },
  { ancre: "experience", cleTitre: "nav.experience", reglage: "showExperiences" },
  { ancre: "projets", cleTitre: "nav.projects", reglage: "showProjects" },
  { ancre: "a-propos", cleTitre: "nav.about", reglage: "showAbout" },
  { ancre: "contact", cleTitre: "nav.contact", reglage: "showContact" },
  { ancre: "services", cleTitre: "nav.services", reglage: "showServices" },
  { ancre: "temoignages", cleTitre: "nav.testimonials", reglage: "showTestimonials" },
];

export function entreesSections(reglages: SiteSettingsDto): EntreeSection[] {
  return TOUTES.filter((e) => reglages[e.reglage]).map(
    ({ ancre, cleTitre }) => ({ ancre, cleTitre }),
  );
}
