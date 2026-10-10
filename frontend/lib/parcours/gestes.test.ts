import { describe, it, expect, vi } from "vitest";
import { actionClavier, directionTactile, traiterMolette } from "./gestes";
import { creerAccumulateur } from "./pagination";

function molette(ctrlKey: boolean, delta: number, enButee = true) {
  const preventDefault = vi.fn();
  const aller = vi.fn();
  const acc = creerAccumulateur(() => 0);
  traiterMolette({ deltaY: delta, ctrlKey, preventDefault }, delta, {
    enButee: () => enButee,
    verrouille: () => false,
    pousser: (d) => acc.pousser(d),
    aller,
  });
  return { preventDefault, aller };
}

describe("traiterMolette", () => {
  it("Ctrl + molette (zoom) ne pagine pas et ne bloque pas l'evenement", () => {
    const r = molette(true, 500);
    expect(r.aller).not.toHaveBeenCalled();
    expect(r.preventDefault).not.toHaveBeenCalled();
  });
  it("en butee, une molette franche pagine et capte l'evenement", () => {
    const r = molette(false, 500);
    expect(r.aller).toHaveBeenCalledWith(1);
    expect(r.preventDefault).toHaveBeenCalled();
  });
  it("hors butee, laisse la section defiler", () => {
    const r = molette(false, 500, false);
    expect(r.aller).not.toHaveBeenCalled();
    expect(r.preventDefault).not.toHaveBeenCalled();
  });
});

describe("actionClavier", () => {
  const butee = (v: boolean) => () => v;
  it.each(["PageDown", " ", "ArrowDown"])("%s defile hors butee, ne pagine pas", (k) => {
    expect(actionClavier(k, false, 1, 5, butee(false), 800)?.type).toBe("defiler");
  });
  it.each(["PageDown", " ", "ArrowDown"])("%s pagine en butee", (k) => {
    expect(actionClavier(k, false, 1, 5, butee(true), 800)).toEqual({ type: "aller", cible: 2 });
  });
  it("Maj + espace remonte", () => {
    expect(actionClavier(" ", true, 1, 5, butee(true), 800)).toEqual({ type: "aller", cible: 0 });
    const a = actionClavier(" ", true, 1, 5, butee(false), 800);
    expect(a?.type === "defiler" && a.dy < 0).toBe(true);
  });
  it("PageUp hors butee defile vers le haut", () => {
    const a = actionClavier("PageUp", false, 1, 5, butee(false), 800);
    expect(a?.type === "defiler" && a.dy < 0).toBe(true);
  });
  it("Home et End sautent aux extremites meme hors butee", () => {
    expect(actionClavier("End", false, 1, 5, butee(false), 800)).toEqual({ type: "aller", cible: 4 });
    expect(actionClavier("Home", false, 3, 5, butee(false), 800)).toEqual({ type: "aller", cible: 0 });
  });
  it("aux extremites, la butee ne fait pas rebondir", () => {
    expect(actionClavier("PageUp", false, 0, 5, butee(true), 800)).toEqual({ type: "aller", cible: 0 });
  });
  it("ignore les autres touches", () => {
    expect(actionClavier("a", false, 0, 5, butee(true), 800)).toBeNull();
  });
});

describe("directionTactile", () => {
  it("pagine sur un balayage vertical assez long", () => {
    expect(directionTactile(0, 100)).toBe(1);
    expect(directionTactile(5, -100)).toBe(-1);
  });
  it("ignore un geste court", () => {
    expect(directionTactile(0, 47)).toBeNull();
  });
  it("ignore un balayage ou l'horizontal domine, meme long", () => {
    expect(directionTactile(200, 100)).toBeNull();
    expect(directionTactile(100, 100)).toBeNull();
  });
});
