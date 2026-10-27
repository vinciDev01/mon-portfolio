// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Sentier } from "@/components/portfolio/sentier";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* La colonne du sentier mesuree : jsdom ne met rien en page, on lui donne
   une taille. */
const boiteOrigine = Element.prototype.getBoundingClientRect;
let racine: Root;
let hote: HTMLElement;
beforeEach(() => {
  Element.prototype.getBoundingClientRect = () => ({ width: 24, height: 200, x: 0, y: 0, top: 0, left: 0, right: 24, bottom: 200, toJSON() {} }) as DOMRect;
  hote = document.createElement("div");
  document.body.appendChild(hote);
  racine = createRoot(hote);
});
afterEach(() => {
  act(() => racine.unmount());
  hote.remove();
  Element.prototype.getBoundingClientRect = boiteOrigine;
});

const monter = (enCours: boolean) => act(() => racine.render(createElement(Sentier, { graine: "x", enCours })));

describe("l etape du sentier", () => {
  it("l experience en cours porte un avion, feux rouge et vert, eclats et balise", () => {
    monter(true);
    expect(hote.querySelector(".sentier-avion .avion-corps")).not.toBeNull();
    expect(hote.querySelector(".avion-feu-gauche")).not.toBeNull();
    expect(hote.querySelector(".avion-feu-droit")).not.toBeNull();
    expect(hote.querySelectorAll(".avion-eclat")).toHaveLength(2);
    expect(hote.querySelector(".avion-balise")).not.toBeNull();
    expect(hote.querySelector(".sentier-pierre")).toBeNull();
  });

  it("une experience passee garde sa pierre, sans avion", () => {
    monter(false);
    expect(hote.querySelector(".sentier-pierre")).not.toBeNull();
    expect(hote.querySelector(".sentier-avion")).toBeNull();
  });

  it("l avion reste decoratif", () => {
    monter(true);
    expect(hote.querySelector("svg.sentier")!.getAttribute("aria-hidden")).toBe("true");
  });
});
