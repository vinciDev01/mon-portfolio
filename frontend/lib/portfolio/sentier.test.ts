import { describe, expect, it } from "vitest";
import { AMPLITUDE_SENTIER, tracerPierre, tracerSentier } from "@/components/portfolio/sentier";
import { bloc, cssNu } from "../parcours/feuille-test";

const points = (d: string) => [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);

describe("sentier des experiences", () => {
  const d = tracerSentier(24, 320, 33, "exp-1");
  const ps = points(d);

  it("part et revient au milieu : les troncons se raccordent", () => {
    expect(ps[0]).toEqual([12, 0]);
    expect(ps.at(-1)).toEqual([12, 320]);
  });

  it("serpente, sans jamais sortir de la colonne", () => {
    const xs = ps.map(([x]) => x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(3);
    for (const x of xs) {
      expect(Math.abs(x - 12)).toBeLessThanOrEqual(AMPLITUDE_SENTIER + 0.6);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(24);
    }
  });

  it("passe par le milieu a hauteur de l etape, ou se pose la pierre", () => {
    const proche = ps.reduce((a, b) => (Math.abs(b[1] - 33) < Math.abs(a[1] - 33) ? b : a));
    expect(Math.abs(proche[0] - 12)).toBeLessThan(2.5);
  });

  it("est deterministe, et differe d une experience a l autre", () => {
    expect(tracerSentier(24, 320, 33, "exp-1")).toBe(d);
    expect(tracerSentier(24, 320, 33, "exp-2")).not.toBe(d);
    expect(tracerPierre(12, 33, "a")).toBe(tracerPierre(12, 33, "a"));
  });

  it("la pierre est un caillou irregulier centre sur l etape", () => {
    const pp = points(tracerPierre(12, 33, "exp-1"));
    const rayons = pp.map(([x, y]) => Math.hypot(x - 12, y - 33));
    expect(Math.max(...rayons) - Math.min(...rayons)).toBeGreaterThan(0.2);
    for (const r of rayons) expect(r).toBeLessThanOrEqual(6);
  });

  it("le chemin est en pointilles, immobile, et l etape est une longueur", () => {
    expect(bloc(/\.sentier-chemin\s*\{/)).toMatch(/stroke-dasharray/);
    expect(cssNu).toMatch(/@property --sentier-etape\s*\{[^}]*syntax:\s*"<length>"/);
    // Le chemin ne bouge pas : seule la pierre de l'experience en cours s'anime.
    expect(bloc(/\.sentier-chemin\s*\{/)).not.toMatch(/transition|animation/);
  });

  it("laisse un espace sous chaque experience sauf la derniere, malgre l enveloppe de la liste", () => {
    const ligne = bloc(/^\s*\.experience-ligne\s*\{/m);
    expect(ligne).toMatch(/--ecart-experiences:\s*var\(--espace-4\)/);
    expect(ligne).toMatch(/padding-block-end:\s*var\(--ecart-experiences\)/);
    // Le sentier traverse l'ecart : sa cellule s'etire dedans.
    expect(bloc(/^\s*\.experience-frise\s*\{/m)).toMatch(/margin-block-end:\s*calc\(-1 \* var\(--ecart-experiences\)\)/);
    // `:last-child` sur la ligne elle-meme viserait chaque ligne, seule dans son enveloppe.
    expect(cssNu).not.toMatch(/\.experience-ligne:last-child/);
    expect(cssNu).toMatch(/\.liste-experiences > :last-child > \.experience-ligne\s*\{[^}]*--ecart-experiences:\s*0px/);
  });

  it("le bord de l experience en cours s anime, s arrete au survol, et reste fixe pour moins de mouvement", () => {
    const trace = bloc(/\.bord-imparfait path\.bord-trace\s*\{/);
    expect(trace).toMatch(/animation:\s*tracer-bord[^;]*infinite/);
    expect(trace).toMatch(/fill:\s*none/);
    expect(bloc(/@keyframes tracer-bord\s*\{/)).toMatch(/stroke-dashoffset:\s*-100/);
    expect(bloc(/\.cadre-imparfait:hover \.bord-trace\s*\{/)).toMatch(/animation-play-state:\s*paused/);
    expect(bloc(/@media \(prefers-reduced-motion: reduce\)\s*\{(?=\s*\.bord-imparfait path\.bord-trace)/)).toMatch(/animation:\s*none/);
  });

  it("la pierre de l experience en cours eclate comme un feu d avion, sous trois eclats par seconde", () => {
    expect(bloc(/\.sentier-balise\s*\{/)).toMatch(/animation:\s*feu-balise 1\.8s[^;]*infinite/);
    const feu = bloc(/@keyframes feu-balise\s*\{/);
    // Deux eclats par cycle de 1,8 s.
    expect(feu.match(/opacity:\s*0\.55/g)).toHaveLength(2);
    expect(bloc(/@media \(prefers-reduced-motion: reduce\)\s*\{(?=\s*\.sentier-pierre)/)).toMatch(/animation:\s*none/);
  });
});
