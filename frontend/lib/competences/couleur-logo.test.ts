import { describe, expect, it } from "vitest";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";
import { CONTRASTE_LOGO, contraste, couleursLogo, teinteLisible } from "./couleur-logo";
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

  it("un logo trop clair le jour garde sa teinte, foncee jusqu'a 3:1", () => {
    const { nuit, jour } = couleursLogo("F7DF1E");
    expect(nuit).toBe("#F7DF1E");
    expect(jour).not.toBe("var(--texte)");
    expect(contraste(jour, PALETTE_CLAIRE.surface)).toBeGreaterThanOrEqual(CONTRASTE_LOGO);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(jour.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(b);
    expect(g).toBeGreaterThan(b);
  });

  it("un logo trop sombre la nuit garde sa teinte, eclaircie jusqu'a 3:1", () => {
    // Le violet de CSS et le bleu fonce de Flutter.
    for (const hex of ["663399", "02569B"]) {
      const { nuit } = couleursLogo(hex);
      expect(nuit).not.toBe("var(--texte)");
      expect(contraste(nuit, PALETTE_SOMBRE.surface)).toBeGreaterThanOrEqual(CONTRASTE_LOGO);
      const [r, , b] = [1, 3, 5].map((i) => parseInt(nuit.slice(i, i + 2), 16));
      expect(b).toBeGreaterThan(r);
    }
  });

  it("Java et Angular, noirs au catalogue, prennent leur couleur de marque", () => {
    expect(couleursLogo("000000", "openjdk").jour).toMatch(/^#/);
    expect(couleursLogo("000000", "openjdk").nuit).toMatch(/^#/);
    expect(couleursLogo("0F0F11", "angular").nuit).toMatch(/^#/);
    // Next.js est vraiment noir : la nuit, la couleur du texte.
    expect(couleursLogo("000000", "nextdotjs").nuit).toBe("var(--texte)");
  });

  it("teinteLisible atteint 3:1 meme depuis une couleur tres proche du fond", () => {
    expect(contraste(teinteLisible("#1A1D25", PALETTE_SOMBRE.surface), PALETTE_SOMBRE.surface)).toBeGreaterThanOrEqual(3);
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
