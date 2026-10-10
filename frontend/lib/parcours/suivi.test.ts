import { describe, it, expect } from "vitest";
import { sectionCourante } from "./section-courante";

describe("regle de depart entre sections visibles (spec section 5.2)", () => {
  it("retient celle dont la part visible est la plus grande", () => {
    expect(sectionCourante([
      { ancre: "projets", part: 240, haut: 400 },
      { ancre: "services", part: 560, haut: 900 },
    ])).toBe("services");
  });

  it("compte les pixels visibles et non la fraction de la section", () => {
    // Le cas qui a motive le changement d'unite : une section courte (600 px
    // visibles, soit tout son contenu) contre une longue dont 900 px sont a
    // l'ecran. En ratio la courte vaudrait 1 et battrait la longue (0,3). En
    // pixels la longue couvre davantage l'ecran, donc elle gagne.
    expect(sectionCourante([
      { ancre: "courte", part: 600, haut: 400 },
      { ancre: "longue", part: 900, haut: 1000 },
    ])).toBe("longue");
  });

  it("a egalite, retient la plus haute dans le document", () => {
    // Le resultat doit etre deterministe, donc testable.
    expect(sectionCourante([
      { ancre: "services", part: 400, haut: 900 },
      { ancre: "projets", part: 400, haut: 400 },
    ])).toBe("projets");
  });

  it("rend null quand aucune section n est visible", () => {
    expect(sectionCourante([])).toBeNull();
  });

  it("ignore les sections de part nulle", () => {
    expect(sectionCourante([
      { ancre: "projets", part: 0, haut: 400 },
    ])).toBeNull();
  });

  it("est stable quel que soit l ordre d arrivee des entrees", () => {
    const a = [
      { ancre: "projets", part: 400, haut: 400 },
      { ancre: "services", part: 400, haut: 900 },
    ];
    expect(sectionCourante(a)).toBe(sectionCourante([...a].reverse()));
  });
});
