import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  analyserDuree,
  creerSequenceur,
  VERROU_APRES_MS,
} from "./sequence";

describe("analyserDuree", () => {
  it.each([
    ["0.18s", 180],
    ["180ms", 180],
    ["0s", 0],
    ["0.18s, 0.22s", 180],
  ])("lit %s comme %d ms", (v, ms) => {
    expect(analyserDuree(v)).toBeCloseTo(ms);
  });

  it("rend null, et non zero, quand rien n'est lisible", () => {
    expect(analyserDuree("")).toBeNull();
    expect(analyserDuree("auto")).toBeNull();
    expect(analyserDuree("calc(400ms * 1)")).toBeNull();
  });
});

/** Un journal ordonne des trois etats, pour verifier la SEQUENCE et non la
 *  presence de mots : c'est ce que le fondu croise violerait. */
function monter(duree = 180) {
  const journal: string[] = [];
  let attente = duree;
  const s = creerSequenceur({
    dureeSortie: () => attente,
    desactiver: () => journal.push("aucune"),
    activer: (c) => journal.push(`active:${c}`),
    surDeverrouillage: () => journal.push("deverrouille"),
  });
  return { s, journal, regler: (ms: number) => (attente = ms) };
}

describe("creerSequenceur : trois etats", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("desactive tout, attend la sortie, puis seulement active la cible", () => {
    const { s, journal } = monter(180);
    s.aller(3);
    expect(journal).toEqual(["aucune"]);
    vi.advanceTimersByTime(179);
    expect(journal).toEqual(["aucune"]);
    vi.advanceTimersByTime(1);
    expect(journal).toEqual(["aucune", "active:3"]);
  });

  it("ne laisse jamais deux sections actives : la cible n'est activee qu'apres l'etat vide", () => {
    const { s, journal } = monter(180);
    s.aller(1);
    vi.runAllTimers();
    expect(journal.indexOf("aucune")).toBeLessThan(journal.indexOf("active:1"));
  });

  it("verrouille pendant la sortie et VERROU_APRES_MS apres l'activation", () => {
    const { s, journal } = monter(180);
    expect(s.aller(1)).toBe(true);
    expect(s.aller(2)).toBe(false);
    vi.advanceTimersByTime(180);
    expect(s.verrouille).toBe(true);
    expect(s.aller(2)).toBe(false);
    vi.advanceTimersByTime(VERROU_APRES_MS - 1);
    expect(s.verrouille).toBe(true);
    vi.advanceTimersByTime(1);
    expect(s.verrouille).toBe(false);
    expect(journal).toEqual(["aucune", "active:1", "deverrouille"]);
    expect(s.aller(2)).toBe(true);
  });

  it("relit la duree a chaque changement (reglage de vitesse du backoffice)", () => {
    const { s, journal, regler } = monter(180);
    s.aller(1);
    vi.runAllTimers();
    regler(360);
    s.aller(2);
    vi.advanceTimersByTime(359);
    expect(journal).not.toContain("active:2");
    vi.advanceTimersByTime(1);
    expect(journal).toContain("active:2");
  });

  it("mouvement reduit : une attente nulle rend le changement immediat, sans branche", () => {
    const { s, journal } = monter(0);
    s.aller(1);
    vi.advanceTimersByTime(0);
    expect(journal).toEqual(["aucune", "active:1"]);
  });

  it("annuler leve le verrou et abandonne l'activation en attente", () => {
    const { s, journal } = monter(180);
    s.aller(1);
    s.annuler();
    vi.runAllTimers();
    expect(journal).toEqual(["aucune"]);
    expect(s.verrouille).toBe(false);
  });
});

describe("creerSequenceur : le verrou ne fuit jamais", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("si `activer` lance, le verrou se leve quand meme", () => {
    const deverrouille = vi.fn();
    let echoue = true;
    const s = creerSequenceur({
      dureeSortie: () => 100,
      desactiver: () => {},
      activer: () => {
        if (echoue) throw new Error("SecurityError");
      },
      surDeverrouillage: deverrouille,
    });
    s.aller(1);
    expect(() => vi.advanceTimersByTime(100)).toThrow("SecurityError");
    vi.advanceTimersByTime(VERROU_APRES_MS);
    expect(s.verrouille).toBe(false);
    expect(deverrouille).toHaveBeenCalledTimes(1);
    echoue = false;
    expect(s.aller(2)).toBe(true);
  });

  it("rattraper active tout de suite la cible en attente, une seule fois", () => {
    const { s, journal } = monter(1000);
    s.aller(4);
    s.rattraper();
    expect(journal).toEqual(["aucune", "active:4"]);
    vi.advanceTimersByTime(5000);
    expect(journal).toEqual(["aucune", "active:4", "deverrouille"]);
    s.rattraper();
    expect(journal).toHaveLength(3);
  });
});

describe("parcours-pagine.tsx : ce que le composant ne doit pas faire", () => {
  const source = readFileSync(
    path.resolve(import.meta.dirname, "../../components/parcours/parcours-pagine.tsx"),
    "utf8",
  ).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  it("passe par le sequenceur : aucun changement d'index hors de `activer`", () => {
    // Un appel direct a setActif(cible) hors du sequenceur ferait un fondu croise.
    const appels = [...source.matchAll(/setActif\(([^)]*)\)/g)].map((m) => m[1]);
    expect(appels.filter((a) => a === "null")).toHaveLength(1);
    expect(source).toContain("creerSequenceur(");
  });

  it("n'introduit aucun mouvement propre", () => {
    expect(source).not.toMatch(/transform|translate|scale|animate/);
  });
});
