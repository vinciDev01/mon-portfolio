import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PersonalInfoDto, SiteSettingsDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { ColonnePassage } from "@/components/parcours/colonne-passage";
import { bloc, lire } from "../parcours/feuille-test";

/* Les pages du blog portent la colonne de navigation du portfolio. Elles
   n'ont pas de sections : les entrees ramenent a celles du portfolio, et
   l'entree « Blog » du pied designe la page courante. */

const REGLAGES = {
  showProjects: true,
  showContact: true,
  showCvDownload: false,
  logoPath: null,
  availabilityStatus: "available",
  availabilityLabel: null,
} as unknown as SiteSettingsDto;
const INFOS = { name: "Bertrand", surname: "Fanuel", avatarPath: null } as unknown as PersonalInfoDto;

const rendre = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    createElement(
      I18nProvider as ComponentType<{ defaultLocale: string }>,
      { defaultLocale: "fr" },
      createElement(ColonnePassage, { reglages: REGLAGES, infos: INFOS, ...props }),
    ),
  );

const lienBlog = (html: string) => /<a[^>]*href="\/blog"[^>]*>/.exec(html)?.[0] ?? "";

describe("la colonne sur le portfolio, inchangee", () => {
  it("des ancres locales, et le blog n est pas la page courante", () => {
    const html = rendre();
    expect(html).toContain('href="#projets"');
    expect(lienBlog(html)).not.toContain("aria-current");
  });
});

describe("la colonne sur le blog", () => {
  it("les entrees ramenent aux sections du portfolio", () => {
    const html = rendre({ racine: "/", page: "blog" });
    expect(html).toContain('href="/#projets"');
    expect(html).toContain('href="/#contact"');
    expect(html).not.toMatch(/href="#projets"/);
  });

  it("l entree Blog est la page courante", () => {
    expect(lienBlog(rendre({ racine: "/", page: "blog" }))).toContain('aria-current="page"');
  });

  it("la page courante a le style de l entree active", () => {
    // Groupee avec l'entree active : memes valeurs, une seule declaration.
    for (const regle of [
      /\.entree-parcours\[aria-current="page"\],\s*\.entree-parcours\[aria-current="true"\]\s*\{/,
      /\.entree-parcours\[aria-current="page"\] \.entree-nom,\s*\.entree-parcours\[aria-current="true"\] \.entree-nom\s*\{/,
    ]) {
      expect(() => bloc(regle), String(regle)).not.toThrow();
    }
  });

  it("la mise en page du blog pose la colonne et reserve sa place", () => {
    const mise = lire("app/blog/layout.tsx");
    expect(mise).toMatch(/<ColonnePassage[^>]*racine="\/"[^>]*page="blog"/);
    expect(mise.indexOf("<FournisseurSectionActive")).toBeLessThan(mise.indexOf("<ColonnePassage"));
    expect(mise).toContain("gouttiere-parcours");
    // La navigation ne s imbrique pas dans le repere `main`.
    expect(mise.indexOf("<ColonnePassage")).toBeLessThan(mise.indexOf("<main"));
  });
});
