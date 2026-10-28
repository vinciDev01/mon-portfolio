import { describe, it, expect } from "vitest";
import { bloc, cssNu, valeur } from "../parcours/feuille-test";

describe("la feuille de l etagere", () => {
  it("aucun degrade dans les regles des cours", () => {
    const debut = cssNu.indexOf(".etagere {");
    expect(debut, "regles de l etagere introuvables").toBeGreaterThan(-1);
    // Jusqu'a la derniere regle des cours, le bouton de telechargement.
    const derniere = cssNu.indexOf(".livre-telecharger:focus-visible");
    expect(derniere, "derniere regle des cours introuvable").toBeGreaterThan(debut);
    expect(cssNu.slice(debut, cssNu.indexOf("}", derniere))).not.toMatch(/gradient/);
  });

  it("la fenetre du livre est centree, malgre le preflight", () => {
    expect(valeur(bloc(/^\s*\.livre-ouvert\s*\{/m, cssNu), "margin")).toBe("auto");
  });

  it("un livre est une cible d au moins 24 px", () => {
    expect(parseInt(valeur(bloc(/^\s*\.livre-cours\s*\{/m, cssNu), "min-inline-size"))).toBeGreaterThanOrEqual(24);
  });

  it("une rangee pleine passe a la ligne, et chaque livre porte son morceau de planche", () => {
    expect(valeur(bloc(/^\s*\.rangee-livres\s*\{/m, cssNu), "flex-wrap")).toBe("wrap");
    expect(bloc(/^\s*\.livre-cours::after\s*\{/m, cssNu)).toMatch(/content:/);
  });

  it("la planche court sur toute la largeur, meme sous une rangee de deux livres", () => {
    const planche = bloc(/^\s*\.rangee-livres::after\s*\{/m, cssNu);
    expect(valeur(planche, "inset-inline")).toBe("0");
    expect(valeur(bloc(/^\s*\.rangee-livres\s*\{/m, cssNu), "position")).toBe("relative");
  });

  it("un titre trop long est coupe proprement sur la tranche", () => {
    const tranche = bloc(/^\s*\.livre-tranche\s*\{/m, cssNu);
    expect(valeur(tranche, "text-overflow")).toBe("ellipsis");
    // En ecriture verticale, l'axe EN LIGNE est vertical : c'est lui qu'il
    // faut borner a la hauteur du livre. `max-block-size` bornerait la
    // largeur, et le titre deborderait du livre en haut et en bas.
    expect(valeur(tranche, "writing-mode")).toBe("vertical-rl");
    expect(valeur(tranche, "max-inline-size")).toBe("calc(var(--hauteur, 140px) - 16px)");
    expect(tranche).not.toMatch(/max-block-size/);
  });
});

describe("le bois brut et le livre tire", () => {
  it("les planches ont un dessus irregulier", () => {
    expect(bloc(/^\s*\.etagere\s*\{/m, cssNu)).toMatch(/--planche-brute:\s*polygon\(/);
    expect(valeur(bloc(/^\s*\.rangee-livres::after\s*\{/m, cssNu), "clip-path")).toBe("var(--planche-brute)");
    expect(valeur(bloc(/^\s*\.livre-cours::after\s*\{/m, cssNu), "clip-path")).toBe("var(--planche-brute)");
  });

  it("un livre survole sort a peine du rang, sauf pour moins de mouvement", () => {
    expect(cssNu).toMatch(/\.livre-cours:hover > \.bord-imparfait[^{]*\{\s*translate:\s*0 -6px/);
    expect(bloc(/@media \(prefers-reduced-motion: reduce\)\s*\{(?=\s*\.livre-cours > \.bord-imparfait)/, cssNu)).toMatch(/transition:\s*none/);
  });

  it("le livre pose sur sa planche, sans jour entre eux", () => {
    const livre = bloc(/^\s*\.livre-cours\s*\{/m, cssNu);
    const marge = valeur(livre, "margin").split(/\s+/)[2];
    const piece = bloc(/^\s*\.livre-cours::after\s*\{/m, cssNu);
    expect(valeur(piece, "inset-block-end")).toBe(`-${marge}`);
    expect(valeur(piece, "block-size")).toBe(marge);
  });
});

describe("le livre ouvert suit le theme", () => {
  it("pages, textes et bouton prennent les couleurs du theme ; la couverture reste en bois", () => {
    const page = bloc(/^\s*\.livre-page\s*\{/m, cssNu);
    expect(valeur(page, "--bord-fond")).toBe("var(--surface)");
    expect(valeur(page, "color")).toBe("var(--texte)");
    const bouton = bloc(/^\s*\.livre-telecharger\s*\{/m, cssNu);
    expect(valeur(bouton, "--bord-fond")).toBe("var(--accent)");
    expect(valeur(bouton, "color")).toBe("var(--fond)");
    expect(valeur(bloc(/^\s*\.livre-reliure-ouverte\s*\{/m, cssNu), "--bord-fond")).toBe("#3b2819");
  });

  it("aucune couleur fixe dans les pages", () => {
    const debut = cssNu.indexOf(".livre-page {");
    const fin = cssNu.indexOf("}", cssNu.indexOf(".livre-telecharger:focus-visible"));
    expect(cssNu.slice(debut, fin)).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
});
