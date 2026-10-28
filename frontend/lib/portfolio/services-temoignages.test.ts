import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ServiceDto, TestimonialDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { ServicesSection } from "@/components/portfolio/services-section";
import { TestimonialsSection } from "@/components/portfolio/testimonials-section";
import { bloc, cssNu } from "../parcours/feuille-test";

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const rendre = (element: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(createElement(Fournisseur, { defaultLocale: "fr" }, element));

const service = (id: string) =>
  ({ id, label: `Service ${id}`, description: null, organization: null, sortOrder: 0 }) as unknown as ServiceDto;

const temoignage = (id: string) =>
  ({ id, firstName: "Ada", lastName: "Lovelace", role: null, company: null, content: `Avis ${id}` }) as unknown as TestimonialDto;

describe("les services, en carte des prestations", () => {
  const avecOrganisme = {
    ...service("a"),
    description: "Analyse des flux.",
    organization: { id: "f", label: "Fortinet", logoPath: "organizations/f.webp", websiteUrl: null, sortOrder: 0 },
  } as unknown as ServiceDto;

  it("une seule feuille au bord imparfait, plus de grille de cartes", () => {
    const html = rendre(createElement(ServicesSection, { services: [service("a"), service("b")] }));
    expect(html.match(/class="carte-prestations cadre-imparfait"/g)).toHaveLength(1);
    expect(html).not.toContain("service-carte");
    expect(html).not.toContain("grid-cols");
  });

  it("un entete traduit, decoratif : le titre de la section l annonce deja", () => {
    const html = rendre(createElement(ServicesSection, { services: [service("a")] }));
    expect(html).toMatch(/<p class="carte-prestations-entete" aria-hidden="true">Prestations<\/p>/);
  });

  it("une entree par service, dans l ordre, tous affiches sans « voir plus »", () => {
    const services = ["a", "b", "c", "d", "e", "f"].map(service);
    const html = rendre(createElement(ServicesSection, { services }));
    const noms = [...html.matchAll(/<h3 class="prestation-nom">([^<]*)<\/h3>/g)].map((m) => m[1]);
    expect(noms).toEqual(services.map((s) => s.label));
    expect(html).not.toMatch(/<button/);
  });

  it("titre, points de conduite decoratifs, organisme, puis description", () => {
    const html = rendre(createElement(ServicesSection, { services: [avecOrganisme] }));
    const nom = html.indexOf('class="prestation-nom"');
    const points = html.indexOf('class="prestation-points" aria-hidden="true"');
    const organisme = html.indexOf('<span class="prestation-organisme">Fortinet</span>');
    const description = html.indexOf('<p class="prestation-description">Analyse des flux.</p>');
    expect(nom).toBeGreaterThan(-1);
    expect(points).toBeGreaterThan(nom);
    expect(organisme).toBeGreaterThan(points);
    expect(description).toBeGreaterThan(organisme);
  });

  it("ni logo ni organisme vide quand il n y en a pas", () => {
    expect(rendre(createElement(ServicesSection, { services: [avecOrganisme] }))).not.toMatch(/<img/);
    const html = rendre(createElement(ServicesSection, { services: [service("a")] }));
    expect(html).not.toContain("prestation-organisme");
    expect(html).not.toContain("prestation-description");
  });

  it("ne rend rien sans service", () => {
    expect(rendre(createElement(ServicesSection, { services: [] }))).toBe("");
  });
});

describe("la feuille de la carte des prestations", () => {
  it("le fleuron separe les entrees, cache aux lecteurs d ecran", () => {
    const regle = bloc(/\.prestation \+ \.prestation::before\s*\{/);
    expect(regle).toMatch(/content:\s*"[^"]+"\s*\/\s*""/);
  });

  it("sur telephone, les points de conduite disparaissent", () => {
    expect(cssNu).toMatch(/@media \(max-width: 599px\)\s*\{[^}]*\.prestation-points\s*\{\s*display:\s*none/);
  });
});

describe("les temoignages, sur des fiches au bord imparfait", () => {
  it("la carte et les boutons de navigation ont un bord imparfait", () => {
    const html = rendre(
      createElement(TestimonialsSection, { testimonials: [temoignage("a"), temoignage("b")], allowSubmission: false }),
    );
    expect(html).toMatch(/class="temoignage-carte cadre-imparfait/);
    const boutons = html.match(/<button[^>]*class="pagination-bouton cadre-imparfait"[^>]*><svg class="bord-imparfait"/g);
    expect(boutons).toHaveLength(2);
    expect(html).not.toMatch(/border-border/);
  });
});
