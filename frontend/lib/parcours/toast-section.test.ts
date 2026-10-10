import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  DELAI_STABILISATION,
  annonceAPoser,
  creerAnnonceur,
} from "./toast-section";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");

describe("la regle de stabilisation (spec section 3.2)", () => {
  it("le delai de stabilisation vaut 400 ms", () => {
    expect(DELAI_STABILISATION).toBe(400);
  });

  // Point de vigilance 5 : une rafale ne doit pas mettre neuf annonces en file.
  it("une rafale ne laisse qu une annonce, celle de l arrivee", () => {
    const poses: string[] = [];
    const r = annonceAPoser((id) => poses.push(id), DELAI_STABILISATION);
    r.planifier("stats");
    r.planifier("competences");
    r.planifier("projets");
    r.ecouler(DELAI_STABILISATION - 1);
    expect(poses).toEqual([]);
    r.ecouler(1);
    expect(poses).toEqual(["projets"]);
  });

  it("n annonce rien si l on repart avant la fin du delai", () => {
    const poses: string[] = [];
    const r = annonceAPoser((id) => poses.push(id), DELAI_STABILISATION);
    r.planifier("stats");
    r.ecouler(300);
    r.planifier("projets");
    r.ecouler(300);
    expect(poses).toEqual([]);
    r.ecouler(100);
    expect(poses).toEqual(["projets"]);
  });

  it("une annonce posee ne se repose pas, une annulee ne se pose jamais", () => {
    const poses: string[] = [];
    const r = annonceAPoser((id) => poses.push(id), 400);
    r.planifier("a");
    r.ecouler(400);
    r.ecouler(400);
    expect(poses).toEqual(["a"]);
    r.planifier("b");
    r.annuler();
    r.ecouler(1000);
    expect(poses).toEqual(["a"]);
  });
});

// Le ccâblage avec une vraie minuterie, sur l'horloge simulee de vitest.
describe("l annonceur branche sur une minuterie", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("saut initial vers #projets : la section 0 n est jamais annoncee", () => {
    const poses: string[] = [];
    const a = creerAnnonceur((id) => poses.push(id));
    // Le composant voit d'abord la section 0 active, puis la cible, dans le
    // meme tour ou presque.
    a.signaler("presentation");
    vi.advanceTimersByTime(50);
    a.signaler("projets");
    vi.advanceTimersByTime(DELAI_STABILISATION - 1);
    expect(poses).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(poses).toEqual(["projets"]);
    vi.advanceTimersByTime(5000);
    expect(poses).toEqual(["projets"]);
  });

  it("une rafale de changements ne produit qu une annonce", () => {
    const poses: string[] = [];
    const a = creerAnnonceur((id) => poses.push(id));
    for (const id of ["a", "b", "c", "d"]) {
      a.signaler(id);
      vi.advanceTimersByTime(200);
    }
    expect(poses).toEqual([]);
    vi.advanceTimersByTime(200);
    expect(poses).toEqual(["d"]);
  });

  it("arreter abandonne l annonce en attente (demontage du composant)", () => {
    const poses: string[] = [];
    const a = creerAnnonceur((id) => poses.push(id));
    a.signaler("projets");
    a.arreter();
    vi.advanceTimersByTime(5000);
    expect(poses).toEqual([]);
  });
});

describe("le composant applique la regle", () => {
  const src = lire("components/portfolio/section-toast-observer.tsx");

  it("passe par l annonceur, annule au demontage, n annonce pas en direct", () => {
    expect(src).toContain("creerAnnonceur(");
    expect(src).toContain("annonceur.arreter()");
    // Tout changement passe par `signaler` : aucun appel direct a showToast
    // hors de l'annonceur.
    expect(src.match(/showToast\(/g)).toHaveLength(2); // definition + appel dans le poser
    const poser = src.slice(src.indexOf("creerAnnonceur("), src.indexOf("const annoncer"));
    expect(poser).toContain("showToast(id)");
    const annoncer = src.slice(src.indexOf("const annoncer"), src.indexOf("const actives"));
    expect(annoncer).toContain("annonceur.signaler(");
    expect(annoncer).not.toContain("showToast");
  });
});

describe("les retraits (spec section 3.1)", () => {
  it("le suivi par observation est supprime", () => {
    expect(() => lire("lib/parcours/section-courante.ts")).toThrow();
    expect(() => lire("lib/parcours/suivi.test.ts")).toThrow();
  });

  it("plus rien ne l importe", () => {
    for (const f of [
      "components/parcours/colonne-passage.tsx",
      "components/parcours/parcours-pagine.tsx",
      "components/portfolio/section-toast-observer.tsx",
    ]) {
      expect(lire(f), f).not.toContain("section-courante");
      expect(lire(f), f).not.toContain("useSectionCourante");
    }
  });

  it("le toast n observe plus rien par intersection", () => {
    expect(lire("components/portfolio/section-toast-observer.tsx")).not.toContain(
      "IntersectionObserver",
    );
  });
});
