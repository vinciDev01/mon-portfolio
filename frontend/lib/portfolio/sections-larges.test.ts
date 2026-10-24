import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../i18n/i18n-context";
import { SectionShell } from "@/components/portfolio/section-shell";
import { bloc, cssNu, tableDesContenus, valeur } from "../parcours/feuille-test";

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const Coquille = SectionShell as ComponentType<{ cleTitre: string; index: number; large?: boolean }>;
const rendre = (large?: boolean) =>
  renderToStaticMarkup(
    createElement(Fournisseur, { defaultLocale: "fr" }, createElement(Coquille, { cleTitre: "nav.contact", index: 1, large }, "x")),
  );

describe("les sections larges : experience et contact", () => {
  it("la coquille marque son bloc quand la section est large, et seulement alors", () => {
    expect(rendre(true)).toMatch(/class="col-span-12 bloc-parcours"[^>]*data-large="true"/);
    expect(rendre()).not.toContain("data-large");
  });

  it("experience et contact sont larges, pas les autres", () => {
    const larges = tableDesContenus()
      .filter((e) => /<SectionShell[^>]*\blarge\b/.test(e.texte))
      .map((e) => e.id);
    expect(larges.sort()).toEqual(["contact", "experience"]);
  });

  it("un plafond plus large, mais toujours borne par l ampoule", () => {
    const large = valeur(bloc(/\.bloc-parcours\[data-large="true"\]\s*\{/, cssNu), "--mesure-courante");
    const normale = valeur(bloc(/^\s*\.bloc-parcours\s*\{/m, cssNu), "--mesure-courante");
    expect(normale).toContain("66ch");
    expect(large).toContain("88ch");
    // La meme borne : le degagement de l'ampoule, jamais franchi.
    expect(large).toContain("var(--degagement)");
    expect(large.replace("88ch", "66ch")).toBe(normale);
  });
});
