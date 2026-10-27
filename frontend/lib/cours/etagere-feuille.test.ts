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
