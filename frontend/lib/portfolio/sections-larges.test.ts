import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../i18n/i18n-context";
import { SectionShell } from "@/components/portfolio/section-shell";
import { bloc, cssNu, tableDesContenus, valeur } from "../parcours/feuille-test";

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const Coquille = SectionShell as ComponentType<{ cleTitre: string; index: number; largeur?: string }>;
const rendre = (largeur?: string) =>
  renderToStaticMarkup(
    createElement(Fournisseur, { defaultLocale: "fr" }, createElement(Coquille, { cleTitre: "nav.contact", index: 1, largeur }, "x")),
  );
const largeurDe = (id: string) =>
  /<SectionShell[^>]*\blargeur="([a-z-]+)"/.exec(tableDesContenus().find((e) => e.id === id)!.texte)?.[1] ?? "normale";

describe("la largeur des sections", () => {
  it("la coquille marque son bloc de sa largeur, sauf la largeur normale", () => {
    expect(rendre("large")).toMatch(/class="col-span-12 bloc-parcours"[^>]*data-largeur="large"/);
    expect(rendre("tres-large")).toContain('data-largeur="tres-large"');
    expect(rendre()).not.toContain("data-largeur");
  });

  it("presentation et experience sont larges, contact tres large, les autres normales", () => {
    expect(largeurDe("ouverture")).toBe("large");
    expect(largeurDe("experience")).toBe("large");
    expect(largeurDe("contact")).toBe("tres-large");
    for (const id of ["stats", "competences", "certifications", "projets", "a-propos"]) {
      expect(largeurDe(id), id).toBe("normale");
    }
  });

  it("des plafonds plus larges, mais toujours bornes par l ampoule", () => {
    const normale = valeur(bloc(/^\s*\.bloc-parcours\s*\{/m, cssNu), "--mesure-courante");
    const large = valeur(bloc(/\.bloc-parcours\[data-largeur="large"\]\s*\{/, cssNu), "--mesure-courante");
    const tresLarge = valeur(bloc(/\.bloc-parcours\[data-largeur="tres-large"\]\s*\{/, cssNu), "--mesure-courante");
    expect(normale).toContain("66ch");
    // Seul le plafond change ; la borne de l'ampoule, `--degagement`, reste.
    expect(large.replace("88ch", "66ch")).toBe(normale);
    expect(tresLarge.replace("100ch", "66ch")).toBe(normale);
  });
});
