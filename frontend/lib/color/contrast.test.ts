import { describe, it, expect } from "vitest";
import { ratioContraste } from "./contrast";
import { PALETTES } from "@/lib/design/tokens";

const SEUIL_TEXTE = 4.5;
const SEUIL_COMPOSANT = 3;

describe.each(Object.entries(PALETTES))("palette %s", (nom, p) => {
  it("le texte principal atteint AA sur le fond", () => {
    expect(ratioContraste(p.textePrincipal, p.fond)).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("le texte principal atteint AA sur la surface", () => {
    expect(ratioContraste(p.textePrincipal, p.surface)).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("le texte secondaire atteint AA sur le fond", () => {
    expect(ratioContraste(p.texteSecondaire, p.fond)).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("le texte secondaire atteint AA sur la surface", () => {
    expect(ratioContraste(p.texteSecondaire, p.surface)).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("l accent atteint AA sur le fond", () => {
    expect(ratioContraste(p.accent, p.fond)).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("le fond atteint AA sur l accent, pour un bouton plein", () => {
    expect(ratioContraste(p.fond, p.accent)).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("la bordure signifiante atteint le seuil des composants", () => {
    expect(ratioContraste(p.bordureSignifiante, p.fond)).toBeGreaterThanOrEqual(SEUIL_COMPOSANT);
  });

  it(`${nom} : toutes les couleurs sont des hexadecimaux a six chiffres`, () => {
    for (const valeur of Object.values(p)) {
      expect(valeur).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("les deux palettes", () => {
  it("portent exactement les memes cles", () => {
    expect(Object.keys(PALETTES.clair).sort()).toEqual(Object.keys(PALETTES.sombre).sort());
  });

  it("ne partagent aucune couleur de fond", () => {
    expect(PALETTES.clair.fond).not.toBe(PALETTES.sombre.fond);
  });
});
