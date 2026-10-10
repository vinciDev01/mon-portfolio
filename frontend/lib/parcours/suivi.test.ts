import { describe, it, expect } from "vitest";
import { sectionCourante } from "./section-courante";

describe("regle de depart entre sections visibles (spec section 5.2)", () => {
  it("retient celle dont la part visible est la plus grande", () => {
    expect(sectionCourante([
      { ancre: "projets", part: 0.3, haut: 400 },
      { ancre: "services", part: 0.7, haut: 900 },
    ])).toBe("services");
  });

  it("a egalite, retient la plus haute dans le document", () => {
    // Le resultat doit etre deterministe, donc testable.
    expect(sectionCourante([
      { ancre: "services", part: 0.5, haut: 900 },
      { ancre: "projets", part: 0.5, haut: 400 },
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
      { ancre: "projets", part: 0.5, haut: 400 },
      { ancre: "services", part: 0.5, haut: 900 },
    ];
    expect(sectionCourante(a)).toBe(sectionCourante([...a].reverse()));
  });
});
