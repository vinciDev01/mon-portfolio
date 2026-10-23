import type { SiteSettingsDto } from "@portfolio/shared-types";

export type Section = {
  id: string;
  cleTitre: string;
  reglage: keyof SiteSettingsDto;
  /** Rendue quel que soit son reglage. */
  inconditionnelle?: true;
};

/**
 * Les pictogrammes des entrees de la colonne de passage, en boite 24 x 24.
 * Leurs cles sont les identifiants de section.
 */
export const PICTOS: Record<string, string> = {
  ouverture:
    '<path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  competences:
    '<path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  experience:
    '<rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" stroke-width="2" fill="none"/>',
  projets:
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  services:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  "a-propos":
    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/>',
  temoignages:
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  contact:
    '<rect width="20" height="16" x="2" y="4" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke="currentColor" stroke-width="2" fill="none"/>',
  certifications:
    '<circle cx="12" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  stats:
    '<path d="M4 20V10M12 20V4M20 20v-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
};

/**
 * La declaration UNIQUE de la liste des sections. Avant cette tache elle
 * existait en trois exemplaires qui divergeaient : ce module, les `id` et cles
 * ecrits en ligne dans page.tsx, et les deux tables du toast de section. La
 * colonne annoncait « Présentation. » quand le titre de la meme section
 * annoncait « Ouverture ».
 *
 * L'ordre fait autorite et un test le compare au rendu de page.tsx.
 */
export const SECTIONS: readonly Section[] = [
  // Section d'identite : elle porte le portrait et la ligne de disponibilite,
  // donc elle est toujours rendue. `showPresentations` ne commandera plus que
  // les cartes de presentation a l'interieur, pas la section elle-meme.
  {
    id: "ouverture",
    cleTitre: "nav.presentation",
    reglage: "showPresentations",
    inconditionnelle: true,
  },
  { id: "stats", cleTitre: "nav.stats", reglage: "showStats" },
  { id: "competences", cleTitre: "nav.skills", reglage: "showSkills" },
  { id: "experience", cleTitre: "nav.experience", reglage: "showExperiences" },
  { id: "certifications", cleTitre: "nav.certifications", reglage: "showCertifications" },
  { id: "projets", cleTitre: "nav.projects", reglage: "showProjects" },
  { id: "a-propos", cleTitre: "nav.about", reglage: "showAbout" },
  { id: "contact", cleTitre: "nav.contact", reglage: "showContact" },
  { id: "services", cleTitre: "nav.services", reglage: "showServices" },
  { id: "temoignages", cleTitre: "nav.testimonials", reglage: "showTestimonials" },
];

export function sectionsActives(reglages: SiteSettingsDto): Section[] {
  return SECTIONS.filter((s) => s.inconditionnelle || reglages[s.reglage]);
}
