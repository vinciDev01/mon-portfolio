import { describe, expect, it } from "vitest";
import { ECART_ARCHE, NAISSANCE_ARCHE, tracerArche } from "./arche";
import { bloc, cssNu } from "./feuille-test";

const points = (d: string) => [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);

describe("l arche du portrait, tracee a la main", () => {
  const ps = points(tracerArche("photo"));

  it("reste dans la boite, a tous les points", () => {
    for (const [x, y] of ps) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
    }
  });

  it("a un haut en demi-cercle et un bas droit", () => {
    const sommet = ps.reduce((a, b) => (b[1] < a[1] ? b : a));
    expect(Math.abs(sommet[0] - 0.5)).toBeLessThan(0.1);
    expect(sommet[1]).toBeLessThan(2 * ECART_ARCHE + 0.001);
    const bas = ps.filter(([, y]) => y > 0.95);
    expect(bas.length).toBeGreaterThan(4);
    // Les cotes passent la naissance de l'arche.
    expect(ps.some(([x, y]) => x > 0.95 && y > NAISSANCE_ARCHE)).toBe(true);
  });

  it("garde ses deux coins du bas : aucun pan coupe", () => {
    for (const graine of ["photo", "echo", "BF", "autre"]) {
      const p = points(tracerArche(graine));
      expect(p.some(([x, y]) => x < 0.02 && y > 0.98), `${graine} : coin bas gauche`).toBe(true);
      expect(p.some(([x, y]) => x > 0.98 && y > 0.98), `${graine} : coin bas droit`).toBe(true);
    }
  });

  it("ondule d un rien : aucun cote parfaitement droit", () => {
    const droite = ps.filter(([x, y]) => y > NAISSANCE_ARCHE + 0.05 && x > 0.9).map(([x]) => x);
    expect(new Set(droite).size).toBeGreaterThan(1);
    for (const x of droite) expect(1 - x).toBeLessThanOrEqual(ECART_ARCHE);
  });

  it("est deterministe, et l echo differe de la photo", () => {
    expect(tracerArche("photo")).toBe(tracerArche("photo"));
    expect(tracerArche("echo")).not.toBe(tracerArche("photo"));
  });

  it("decoupe la photo et l echo, l arrondi restant le repli", () => {
    expect(bloc(/^\s*\.medaillon\s*\{/m, cssNu)).toMatch(/clip-path:\s*var\(--arche-photo, none\)/);
    expect(bloc(/\.medaillon-niche::before\s*\{/, cssNu)).toMatch(/clip-path:\s*var\(--arche-echo, none\)/);
    expect(bloc(/\.medaillon-trait path\s*\{/, cssNu)).toMatch(/vector-effect:\s*non-scaling-stroke/);
  });
});
