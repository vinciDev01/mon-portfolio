import { describe, it, expect } from "vitest";
import { capSuivant } from "./cap";

describe("le cap de l aiguille", () => {
  it("la premiere section est au nord, les autres reparties sur un tour", () => {
    expect(capSuivant(0, 0, 4)).toBe(0);
    expect(capSuivant(0, 1, 4)).toBe(90);
    expect(capSuivant(0, 2, 4)).toBe(180);
  });

  it("prend le chemin le plus court : de la derniere a la premiere, elle avance", () => {
    // 270 -> 0 : un quart de tour en avant (360), pas trois quarts en arriere.
    expect(capSuivant(270, 0, 4)).toBe(360);
    // Et inversement : de 0 vers la derniere, un quart de tour en arriere.
    expect(capSuivant(0, 3, 4)).toBe(-90);
  });

  it("cumule les tours sans jamais sauter", () => {
    let angle = 0;
    for (const i of [1, 2, 3, 0, 1]) angle = capSuivant(angle, i, 4);
    expect(angle).toBe(450);
  });

  it("reste au nord sans section, ou sur une section inconnue", () => {
    expect(capSuivant(90, -1, 4)).toBe(90);
    expect(capSuivant(0, 0, 0)).toBe(0);
  });
});
