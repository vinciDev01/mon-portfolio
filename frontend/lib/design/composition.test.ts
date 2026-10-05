import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { ratioContraste } from "@/lib/color/contrast";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";

/**
 * Contrastes apres composition des couches de lumiere (tache 11).
 *
 * Les couches `mix-blend-mode` modifient la luminance reelle du fond : les
 * ratios de `contrast.test.ts` ne valent que pour la page nue. Aucun outil
 * statique ne mesure cela, mais les formules de fusion sont normalisees
 * (CSS Compositing) : on les CALCULE ici, a partir des opacites et des
 * couleurs LUES dans `globals.css` et `couches-lumiere.tsx`. Si quelqu'un
 * alourdit une couche, ces tests echouent.
 */

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (relatif: string) => readFileSync(path.join(RACINE, relatif), "utf8");

type Rvb = [number, number, number];

// --- Couleurs --------------------------------------------------------------

function depuisHex(hex: string): Rvb {
  const n = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255) as Rvb;
}

function depuisHsl(h: number, s: number, l: number): Rvb {
  const sat = s / 100;
  const lum = l / 100;
  const a = sat * Math.min(lum, 1 - lum);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return lum - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

function luminance(c: Rvb): number {
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function enHex(c: Rvb): string {
  return (
    "#" +
    c
      .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

// --- Fusion (CSS Compositing) ---------------------------------------------

type Fusion = (dessous: number, dessus: number) => number;

const ecran: Fusion = (b, s) => b + s - b * s;

const lumiereDouce: Fusion = (b, s) => {
  if (s <= 0.5) return b - (1 - 2 * s) * b * (1 - b);
  const d = b <= 0.25 ? ((16 * b - 12) * b + 4) * b : Math.sqrt(b);
  return b + (2 * s - 1) * (d - b);
};

/** Cr = (1 - a) * Cb + a * Fusion(Cb, Cs), canal par canal. */
function composer(fond: Rvb, source: Rvb, alpha: number, fusion: Fusion): Rvb {
  return fond.map((b, i) => (1 - alpha) * b + alpha * fusion(b, source[i])) as Rvb;
}

// --- Parametres lus dans le code reel --------------------------------------

/** Premier arret du degrade du faisceau : couleur et opacite maximales. */
function faisceauMax(): { couleur: Rvb; alpha: number } {
  const src = lire("components/ampoule/couches-lumiere.tsx");
  const bloc = src.slice(src.indexOf("export function CoucheFaisceau"));
  const m = bloc.match(/<stop offset="0%" stopColor="(#[0-9a-fA-F]{6})" stopOpacity=\{([\d.]+)\}/);
  if (!m) throw new Error("premier arret du faisceau introuvable");
  return { couleur: depuisHex(m[1]), alpha: Number(m[2]) };
}

/** Les deux nappes de `body::before` au centre : couleur HSL et alpha. */
function nappesHalo(): { couleur: Rvb; alpha: number }[] {
  const css = lire("app/globals.css");
  const debut = css.indexOf("body::before {");
  const bloc = css.slice(debut, css.indexOf("}", css.indexOf("opacity: var(--t-halo", debut)));
  const arrets = [
    ...bloc.matchAll(/radial-gradient\(\s*[^,]+,\s*hsl\((\d+) (\d+)% (\d+)% \/ ([\d.]+)\) 0%/g),
  ];
  if (arrets.length !== 2) throw new Error("les deux nappes de body::before sont introuvables");
  return arrets.map((a) => ({
    couleur: depuisHsl(Number(a[1]), Number(a[2]), Number(a[3])),
    alpha: Number(a[4]),
  }));
}

/** Fond de page sous le halo au plus fort : ecran de la 2e nappe, puis lumiere douce de la 1re. */
function sousHalo(fond: Rvb): Rvb {
  const [premiere, seconde] = nappesHalo();
  const apresSeconde = composer(fond, seconde.couleur, seconde.alpha, ecran);
  return composer(apresSeconde, premiere.couleur, premiere.alpha, lumiereDouce);
}

function sousFaisceau(fond: Rvb): Rvb {
  const { couleur, alpha } = faisceauMax();
  return composer(fond, couleur, alpha, ecran);
}

// --- Garde-fou de l'annexe : variation de luminance du fond <= 0,04 --------

const VARIATION_MAX = 0.04;
const PLAGES = {
  clair: { fond: PALETTE_CLAIRE.fond, min: 0.843, max: 0.923 },
  sombre: { fond: PALETTE_SOMBRE.fond, min: 0, max: 0.047 },
};
const TOLERANCE = 0.001;

describe("garde-fou de luminance du fond (annexe, +/- 0,04)", () => {
  it("les plages admises correspondent a la variation maximale", () => {
    for (const p of Object.values(PLAGES)) {
      const l0 = luminance(depuisHex(p.fond));
      expect(p.max).toBeLessThanOrEqual(l0 + VARIATION_MAX + 0.001);
      expect(p.min).toBeGreaterThanOrEqual(Math.max(0, l0 - VARIATION_MAX - 0.001));
    }
  });

  it("fonds nus : clair 0,8833, sombre 0,0074", () => {
    expect(luminance(depuisHex(PALETTE_CLAIRE.fond))).toBeCloseTo(0.8833, 4);
    expect(luminance(depuisHex(PALETTE_SOMBRE.fond))).toBeCloseTo(0.0074, 4);
  });

  it("halo au plus fort, theme clair : L = 0,9012, dans la plage", () => {
    const l = luminance(sousHalo(depuisHex(PALETTE_CLAIRE.fond)));
    expect(Math.abs(l - 0.9012)).toBeLessThan(TOLERANCE);
    expect(l).toBeGreaterThanOrEqual(PLAGES.clair.min);
    expect(l).toBeLessThanOrEqual(PLAGES.clair.max);
  });

  it("halo au plus fort, theme sombre (pour memoire) : L = 0,0367, dans la plage", () => {
    const l = luminance(sousHalo(depuisHex(PALETTE_SOMBRE.fond)));
    expect(Math.abs(l - 0.0367)).toBeLessThan(TOLERANCE);
    expect(l).toBeGreaterThanOrEqual(PLAGES.sombre.min);
    expect(l).toBeLessThanOrEqual(PLAGES.sombre.max);
  });

  it("faisceau a la bouche, theme clair : L = 0,9172, dans la plage (marge 0,0061)", () => {
    const l = luminance(sousFaisceau(depuisHex(PALETTE_CLAIRE.fond)));
    expect(Math.abs(l - 0.9172)).toBeLessThan(TOLERANCE);
    expect(l).toBeGreaterThanOrEqual(PLAGES.clair.min);
    expect(l).toBeLessThanOrEqual(PLAGES.clair.max);
  });
});

// --- Plancher de l'anneau de focus sous le faisceau ------------------------

const SEUIL_COMPOSANT = 3;

describe.each([
  ["clair", PALETTE_CLAIRE],
  ["sombre", PALETTE_SOMBRE],
] as const)("anneau de focus sous le faisceau, palette %s", (_nom, p) => {
  it("l'accent recompose sur son fond recompose reste >= 3:1", () => {
    // Le faisceau est peint au-dessus du contenu (z-index 60) : il eclaircit
    // a la fois l'anneau et son pourtour. Ce test est la vraie protection :
    // il echoue si l'opacite du faisceau monte.
    const anneau = enHex(sousFaisceau(depuisHex(p.accent)));
    const fond = enHex(sousFaisceau(depuisHex(p.fond)));
    expect(ratioContraste(anneau, fond)).toBeGreaterThanOrEqual(SEUIL_COMPOSANT);
  });
});

describe("l'anneau compose, valeurs de reference", () => {
  it("clair 3,11:1 et sombre 3,18:1 sous le faisceau a 0,36", () => {
    const ratio = (p: { fond: string; accent: string }) =>
      ratioContraste(
        enHex(sousFaisceau(depuisHex(p.accent))),
        enHex(sousFaisceau(depuisHex(p.fond))),
      );
    expect(faisceauMax().alpha).toBeCloseTo(0.36, 2);
    expect(ratio(PALETTE_CLAIRE)).toBeCloseTo(3.11, 1);
    expect(ratio(PALETTE_SOMBRE)).toBeCloseTo(3.18, 1);
  });
});
