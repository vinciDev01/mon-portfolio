import { describe, it, expect } from "vitest";
import { lienSur, renseigne } from "./liens";

describe("lienSur (regle partagee des liens)", () => {
  it("n accepte que https:", () => {
    expect(lienSur("https://exemple.test/a")).toBe("https://exemple.test/a");
    expect(lienSur("http://exemple.test/a")).toBeNull();
    expect(lienSur("javascript:alert(1)")).toBeNull();
    expect(lienSur("JavaScript:alert(1)")).toBeNull();
    expect(lienSur("data:text/html,x")).toBeNull();
    expect(lienSur("exemple.test")).toBeNull();
    expect(lienSur("https:")).toBeNull();
  });

  it("rogne les blancs autour de l URL", () => {
    expect(lienSur("  https://exemple.test/a  ")).toBe("https://exemple.test/a");
  });

  it("traite le blanc comme une absence", () => {
    for (const v of ["", "   ", null, undefined]) expect(lienSur(v)).toBeNull();
  });
});

describe("renseigne", () => {
  it("est faux pour le vide, le blanc, le nul et l indefini", () => {
    for (const v of ["", "   ", null, undefined]) expect(renseigne(v)).toBe(false);
    expect(renseigne("x")).toBe(true);
  });
});
