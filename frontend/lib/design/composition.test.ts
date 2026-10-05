import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { ratioContraste } from "@/lib/color/contrast";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";
import { IMAGES_ALLUMAGE } from "@/lib/ampoule/animation";

/**
 * Contrastes apres composition des couches de lumiere (tache 11, ronde de
 * correction 1).
 *
 * Halo (L5, `body::before`), moucheture (L6) et faisceau (L4) sont peints
 * DERRIERE le contenu : ils ne modifient que le fond, jamais le texte. Les
 * ratios de `contrast.test.ts` ne valent donc que sur le fond COMPOSE. Les
 * formules de fusion sont normalisees (CSS Compositing) : on les calcule
 * ici, a partir des opacites et couleurs LUES dans `globals.css`,
 * `couches-lumiere.tsx` et `animation.ts`. Si quelqu'un alourdit une
 * couche ou releve `--lumiere-plafond`, ces tests echouent.
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

const incrustation: Fusion = (b, s) => (b <= 0.5 ? 2 * b * s : 1 - 2 * (1 - b) * (1 - s));

type Calque = { couleur: Rvb; alpha: number };

/**
 * Composition de `dessus` sur `dessous`, calque a calque, avec fusion
 * (semantique stricte de `background-blend-mode`) : la couleur source est
 * d'abord melangee a la fusion avec l'arriere-plan selon l'alpha de
 * celui-ci, puis les deux se composent en alpha.
 */
function composerCalques(dessus: Calque, dessous: Calque, fusion: Fusion): Calque {
  const ab = dessous.alpha;
  const as = dessus.alpha;
  const ar = as + ab * (1 - as);
  const couleur = dessus.couleur.map((cs, i) => {
    const cb = dessous.couleur[i];
    const csPrime = (1 - ab) * cs + ab * fusion(cb, cs);
    return ((1 - as) * ab * cb + as * csPrime) / ar;
  }) as Rvb;
  return { couleur, alpha: ar };
}

// --- Parametres lus dans le code reel --------------------------------------

/** Maximum d'une variable `--t-*` sur le jeu d'images-cles de l'allumage. */
function maxVariable(nom: string): number {
  const valeurs = IMAGES_ALLUMAGE.map((i) => i[nom]).filter((v): v is number => typeof v === "number");
  return Math.max(...valeurs);
}

/** Le plafond commun, tel que declare dans `globals.css`. */
function plafond(): number {
  const m = lire("app/globals.css").match(/--lumiere-plafond:\s*([\d.]+)\s*;/);
  if (!m) throw new Error("--lumiere-plafond introuvable");
  return Number(m[1]);
}

/** Premier arret du degrade du faisceau : couleur et opacite maximales. */
function faisceauMax(): Calque {
  const src = lire("components/ampoule/couches-lumiere.tsx");
  const bloc = src.slice(src.indexOf("export function CoucheFaisceau"));
  const m = bloc.match(/<stop offset="0%" stopColor="(#[0-9a-fA-F]{6})" stopOpacity=\{([\d.]+)\}/);
  if (!m) throw new Error("premier arret du faisceau introuvable");
  return { couleur: depuisHex(m[1]), alpha: Number(m[2]) };
}

/** Teinte claire de l'interstice de la moucheture : le cas le plus eclaircissant. */
function intersticeMoucheture(): Calque {
  const src = lire("components/ampoule/couches-lumiere.tsx");
  const m = src.match(/floodColor="hsl\((\d+) (\d+)% (\d+)%\)" floodOpacity=\{([\d.]+)\} result="teinte-interstice"/);
  if (!m) throw new Error("teinte de l'interstice introuvable");
  return { couleur: depuisHsl(Number(m[1]), Number(m[2]), Number(m[3])), alpha: Number(m[4]) };
}

/** Les deux nappes de `body::before` au centre, de haut en bas. */
function nappesHalo(): Calque[] {
  const css = lire("app/globals.css");
  const debut = css.indexOf("body::before {");
  const bloc = css.slice(debut, css.indexOf("opacity: calc(var(--t-halo", debut));
  const arrets = [
    ...bloc.matchAll(/radial-gradient\(\s*[^,]+,\s*hsl\((\d+) (\d+)% (\d+)% \/ ([\d.]+)\) 0%/g),
  ];
  if (arrets.length !== 2) throw new Error("les deux nappes de body::before sont introuvables");
  return arrets.map((a) => ({
    couleur: depuisHsl(Number(a[1]), Number(a[2]), Number(a[3])),
    alpha: Number(a[4]),
  }));
}

/**
 * Halo au plus fort : `background-blend-mode: soft-light, screen`. La nappe
 * du dessous fusionne `screen` sur un fond transparent, donc se rend telle
 * quelle ; celle du dessus fusionne `soft-light` sur elle ; puis l'element
 * fusionne `soft-light` sur la page, a l'opacite `--t-halo * plafond`.
 */
function appliquerHalo(fond: Rvb, k: number): Rvb {
  const [dessus, dessous] = nappesHalo();
  const nappe = composerCalques(dessus, dessous, lumiereDouce);
  return composer(fond, nappe.couleur, nappe.alpha * maxVariable("--t-halo") * k, lumiereDouce);
}

function appliquerMoucheture(fond: Rvb, k: number): Rvb {
  const { couleur, alpha } = intersticeMoucheture();
  return composer(fond, couleur, alpha * maxVariable("--t-moucheture") * k, incrustation);
}

function appliquerFaisceau(fond: Rvb, k: number): Rvb {
  const { couleur, alpha } = faisceauMax();
  return composer(fond, couleur, alpha * maxVariable("--t-faisceau") * k, ecran);
}

/** Empilement complet, dans l'ordre de peinture : halo -> moucheture -> faisceau. */
function fondCompose(fond: Rvb, k = plafond()): Rvb {
  return appliquerFaisceau(appliquerMoucheture(appliquerHalo(fond, k), k), k);
}

/**
 * Etat STABLE d'un theme : en clair la lampe est allumee (couches au
 * plafond) ; en sombre elle est eteinte, toutes les variables `--t-*`
 * valent 0 et le fond reste nu. Les excursions des 900 ms de l'allumage ne
 * sont pas couvertes par le garde-fou.
 */
function fondStable(theme: "clair" | "sombre"): Rvb {
  const fond = depuisHex(PLAGES_FONDS[theme]);
  return theme === "clair" ? fondCompose(fond) : fond;
}
const PLAGES_FONDS = { clair: PALETTE_CLAIRE.fond, sombre: PALETTE_SOMBRE.fond };

// --- Garde-fou de l'annexe : variation de luminance du fond <= 0,04 --------

const VARIATION_MAX = 0.04;
const PLAGES = {
  clair: { fond: PALETTE_CLAIRE.fond, min: 0.843, max: 0.923 },
  sombre: { fond: PALETTE_SOMBRE.fond, min: 0, max: 0.047 },
};

describe("garde-fou de luminance du fond (annexe, +/- 0,04)", () => {
  it("fonds nus : clair 0,8833, sombre 0,0074", () => {
    expect(luminance(depuisHex(PALETTE_CLAIRE.fond))).toBeCloseTo(0.8833, 4);
    expect(luminance(depuisHex(PALETTE_SOMBRE.fond))).toBeCloseTo(0.0074, 4);
  });

  it("les plages admises correspondent a la variation maximale", () => {
    for (const p of Object.values(PLAGES)) {
      const l0 = luminance(depuisHex(p.fond));
      expect(p.max).toBeLessThanOrEqual(l0 + VARIATION_MAX + 0.001);
      expect(p.min).toBeGreaterThanOrEqual(Math.max(0, l0 - VARIATION_MAX - 0.001));
    }
  });

  it.each(["clair", "sombre"] as const)(
    "l'empilement complet plafonne reste dans la plage, theme %s",
    (theme) => {
      const l = luminance(fondStable(theme));
      expect(l).toBeGreaterThanOrEqual(PLAGES[theme].min);
      expect(l).toBeLessThanOrEqual(PLAGES[theme].max);
    },
  );

  it("valeur calculee, theme clair : ~0,9178 (ecart ~+0,0345), tolerance du modele", () => {
    const l = luminance(fondCompose(depuisHex(PALETTE_CLAIRE.fond)));
    expect(Math.abs(l - 0.9178)).toBeLessThan(0.002);
  });

  it("sans plafond, l'empilement sortirait de la plage : le plafond est necessaire", () => {
    const l = luminance(fondCompose(depuisHex(PALETTE_CLAIRE.fond), 1));
    expect(l).toBeGreaterThan(PLAGES.clair.max);
  });

  it("le plafond n'excede pas ce que le garde-fou admet", () => {
    expect(plafond()).toBeGreaterThan(0);
    expect(plafond()).toBeLessThanOrEqual(1);
    const l = luminance(fondCompose(depuisHex(PALETTE_CLAIRE.fond), plafond()));
    expect(l - luminance(depuisHex(PALETTE_CLAIRE.fond))).toBeLessThanOrEqual(VARIATION_MAX);
  });

  it("chaque couche, isolee, tient aussi dans la plage (theme clair, plafond 1)", () => {
    const nu = depuisHex(PALETTE_CLAIRE.fond);
    for (const f of [appliquerHalo, appliquerMoucheture, appliquerFaisceau]) {
      expect(luminance(f(nu, 1))).toBeLessThanOrEqual(PLAGES.clair.max);
    }
  });
});

// --- Contrastes sur le fond compose ----------------------------------------

const SEUIL_TEXTE = 4.5;
const SEUIL_COMPOSANT = 3;

describe.each([
  ["clair", PALETTE_CLAIRE],
  ["sombre", PALETTE_SOMBRE],
] as const)("jetons sur le fond compose, palette %s", (nom, p) => {
  // La lumiere est derriere le contenu : le texte garde sa couleur, seul le
  // fond change. On teste donc chaque jeton sur le fond compose.
  const fond = () => enHex(fondStable(nom));

  it("le texte principal atteint 4,5:1", () => {
    expect(ratioContraste(p.textePrincipal, fond())).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("le texte secondaire atteint 4,5:1", () => {
    expect(ratioContraste(p.texteSecondaire, fond())).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("l'accent atteint 4,5:1 (texte de lien) ", () => {
    expect(ratioContraste(p.accent, fond())).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("la bordure signifiante atteint 3:1", () => {
    expect(ratioContraste(p.bordureSignifiante, fond())).toBeGreaterThanOrEqual(SEUIL_COMPOSANT);
  });

  it("l'anneau de focus (accent) atteint 3:1 : plus fusionne, seuil non critique", () => {
    // L'anneau repose sur le fond compose sans etre eclairci lui-meme
    // (~6,45:1 en clair) ; ce plancher de 3:1 n'est plus qu'un filet.
    expect(ratioContraste(p.accent, fond())).toBeGreaterThanOrEqual(SEUIL_COMPOSANT);
  });
});

describe("valeurs de reference, theme clair", () => {
  it("fond compose, puis contrastes proches des valeurs calculees", () => {
    const fond = enHex(fondCompose(depuisHex(PALETTE_CLAIRE.fond)));
    expect(ratioContraste(PALETTE_CLAIRE.textePrincipal, fond)).toBeCloseTo(14.67, 0);
    expect(ratioContraste(PALETTE_CLAIRE.texteSecondaire, fond)).toBeCloseTo(6.66, 0);
    expect(ratioContraste(PALETTE_CLAIRE.accent, fond)).toBeCloseTo(6.45, 0);
    expect(ratioContraste(PALETTE_CLAIRE.bordureSignifiante, fond)).toBeCloseTo(3.44, 0);
  });
});

// --- Absence de fusion au-dessus du contenu --------------------------------

describe("architecture des couches", () => {
  it("le SVG de la lumiere est derriere le contenu, l'objet reste a 60", () => {
    const css = lire("app/globals.css");
    // Selecteur DOUBLE exige : a specificite egale, `.ampoule-lumiere` seul ne
    // l'emporterait sur `.ampoule { z-index: 60 }` que par l'ordre du fichier ;
    // un reordonnancement remettrait la lumiere au-dessus du texte (texte
    // secondaire 6,42:1 -> 3,15:1).
    expect(css).toMatch(/\.ampoule\.ampoule-lumiere\s*\{\s*z-index:\s*-1;/);
    expect(css).toMatch(/\.ampoule\s*\{[^}]*z-index:\s*60;/);
    expect(css).toMatch(/body::before\s*\{[^}]*z-index:\s*-1;/);
  });

  it("la fusion est portee par l'element <svg> fixe, pas par un enfant", () => {
    // `position: fixed` forme un contexte d'empilement isole : un
    // mix-blend-mode sur un enfant ne fusionnerait pas avec la page.
    const src = lire("components/ampoule/ampoule.tsx");
    expect(src).toMatch(/className="ampoule ampoule-lumiere couche-moucheture"/);
    expect(src).toMatch(/className="ampoule ampoule-lumiere couche-faisceau"/);
    expect(lire("components/ampoule/couches-lumiere.tsx")).not.toMatch(/<g className="couche-(faisceau|moucheture)"/);
  });
});
