import { describe, expect, it } from "vitest";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";
import { CONTRASTE_LOGO, contraste, couleursLogo } from "./couleur-logo";
import { bloc, cssNu, tableDesContenus } from "../parcours/feuille-test";

describe("la couleur des logos", () => {
  it("garde la couleur de marque quand elle se voit dans les deux themes", () => {
    // Python, bleu moyen : lisible le jour comme la nuit.
    const { nuit, jour } = couleursLogo("3776AB");
    expect(jour).toBe("#3776AB");
    expect(contraste(jour, PALETTE_CLAIRE.surface)).toBeGreaterThanOrEqual(CONTRASTE_LOGO);
    expect(nuit === "#3776AB" || nuit === "var(--texte)").toBe(true);
  });

  it("un logo noir prend la couleur du texte la nuit, garde son noir le jour", () => {
    expect(couleursLogo("181717")).toEqual({ nuit: "var(--texte)", jour: "#181717" });
  });

  it("un logo tres clair prend la couleur du texte le jour", () => {
    expect(couleursLogo("F7DF1E").jour).toBe("var(--texte)");
    expect(couleursLogo("F7DF1E").nuit).toBe("#F7DF1E");
  });

  it("toute couleur retenue tient 3:1 sur la surface de son theme", () => {
    for (const hex of ["181717", "F7DF1E", "3776AB", "E34F26", "2496ED", "000000", "FFFFFF", "02569B"]) {
      const { nuit, jour } = couleursLogo(hex);
      if (nuit !== "var(--texte)") expect(contraste(nuit, PALETTE_SOMBRE.surface)).toBeGreaterThanOrEqual(3);
      if (jour !== "var(--texte)") expect(contraste(jour, PALETTE_CLAIRE.surface)).toBeGreaterThanOrEqual(3);
    }
  });

  it("sans couleur ou couleur invalide : le texte", () => {
    expect(couleursLogo(null)).toEqual({ nuit: "var(--texte)", jour: "var(--texte)" });
    expect(couleursLogo("zz")).toEqual({ nuit: "var(--texte)", jour: "var(--texte)" });
  });

  it("la feuille melange les deux couleurs selon le theme", () => {
    expect(bloc(/^\s*svg\.etiquette-logo path\s*\{/m, cssNu)).toMatch(
      /color-mix\(\s*in oklch,\s*var\(--logo-nuit, currentColor\),\s*var\(--logo-jour, currentColor\) calc\(var\(--t-page\) \* 100%\)/,
    );
  });

  it("la section Competences est large", () => {
    const entree = tableDesContenus().find((e) => e.id === "competences")!;
    expect(entree.texte).toMatch(/largeur="large"/);
  });
});
