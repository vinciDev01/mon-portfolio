import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ServiceDto, TestimonialDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { ServicesSection } from "@/components/portfolio/services-section";
import { TestimonialsSection } from "@/components/portfolio/testimonials-section";

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const rendre = (element: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(createElement(Fournisseur, { defaultLocale: "fr" }, element));

const service = (id: string) =>
  ({ id, label: `Service ${id}`, description: null, organization: null, sortOrder: 0 }) as unknown as ServiceDto;

const temoignage = (id: string) =>
  ({ id, firstName: "Ada", lastName: "Lovelace", role: null, company: null, content: `Avis ${id}` }) as unknown as TestimonialDto;

describe("les services, sur des fiches au bord imparfait", () => {
  it("chaque carte porte son bord et une feuille dessous", () => {
    const html = rendre(createElement(ServicesSection, { services: [service("a"), service("b")] }));
    expect(html.match(/class="service-carte cadre-imparfait/g)).toHaveLength(2);
    expect(html.match(/class="bord-imparfait feuille-dessous"/g)).toHaveLength(2);
    expect(html).not.toContain("animated-card");
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
