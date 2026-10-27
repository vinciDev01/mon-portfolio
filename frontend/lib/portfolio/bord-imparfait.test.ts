// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { SkillDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { tracerBord } from "@/components/portfolio/bord-imparfait";
import { SkillsSection } from "@/components/portfolio/skills-section";
import { bloc } from "../parcours/feuille-test";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const points = (d: string) => [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);

describe("trace du bord imparfait", () => {
  it("est deterministe pour une meme graine, different pour une autre", () => {
    expect(tracerBord(300, 160, "a")).toBe(tracerBord(300, 160, "a"));
    expect(tracerBord(300, 160, "a")).not.toBe(tracerBord(300, 160, "b"));
  });

  it("ondule sans jamais deborder de la boite, de 3 px au plus", () => {
    const d = tracerBord(880, 600, "certif", 1.5, 40);
    for (const [x, y] of points(d)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(880);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(600);
      // Chaque point colle a un cote, a 3 px pres.
      expect(Math.min(x!, 880 - x!, y!, 600 - y!)).toBeLessThanOrEqual(3);
    }
  });

  it("n est pas un rectangle : ses points ne sont pas tous sur les bords", () => {
    const ps = points(tracerBord(300, 160, "x"));
    expect(ps.length).toBeGreaterThan(8);
    expect(ps.some(([x, y]) => Math.min(x!, 300 - x!, y!, 160 - y!) > 0.3)).toBe(true);
  });

  it("garde le meme ecart en pixels sur une petite carte", () => {
    for (const [x, y] of points(tracerBord(148, 150, "carte"))) {
      expect(Math.min(x!, 148 - x!, y!, 150 - y!)).toBeLessThanOrEqual(3);
    }
  });

  it("porte fond et trait, sans animation, et suit le mode force", () => {
    const b = bloc(/\.bord-imparfait path\s*\{/);
    expect(b).toMatch(/fill:\s*var\(--bord-fond/);
    expect(b).toMatch(/vector-effect:\s*non-scaling-stroke/);
    expect(bloc(/\.cadre-imparfait\s*\{/)).toMatch(/isolation:\s*isolate/);
  });
});

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const competence = (i: number) =>
  ({ id: `s${i}`, proficiency: 50, technology: { id: `t${i}`, label: `Techno ${i}`, logoPath: null } }) as unknown as SkillDto;

describe("carrousel des competences", () => {
  let racine: Root;
  let hote: HTMLElement;
  beforeEach(() => {
    hote = document.createElement("div");
    document.body.appendChild(hote);
    racine = createRoot(hote);
  });
  afterEach(() => {
    act(() => racine.unmount());
    hote.remove();
  });

  const monter = (n: number) =>
    act(() => {
      racine.render(
        createElement(Fournisseur, { defaultLocale: "fr" }, createElement(SkillsSection, { skills: Array.from({ length: n }, (_, i) => competence(i)) })),
      );
    });

  it("montre TOUTES les competences, sans bouton Voir plus", () => {
    monter(14);
    expect(hote.querySelectorAll(".piste-competences > li")).toHaveLength(14);
    expect(hote.textContent).not.toMatch(/voir plus/i);
  });

  it("chaque carte porte son bord imparfait", () => {
    monter(3);
    for (const carte of hote.querySelectorAll(".carte-competence")) {
      expect(carte.querySelector(":scope > svg.bord-imparfait")).not.toBeNull();
    }
  });

  it("la piste prend le focus et porte un nom ; les fleches ont le leur", () => {
    monter(3);
    const piste = hote.querySelector(".piste-competences")!;
    expect(piste.getAttribute("tabindex")).toBe("0");
    expect(piste.getAttribute("aria-label")).toBeTruthy();
    const fleches = [...hote.querySelectorAll<HTMLButtonElement>(".fleche-carrousel")];
    expect(fleches).toHaveLength(2);
    for (const f of fleches) expect(f.getAttribute("aria-label")).toBeTruthy();
    // Au depart, on est a la butee gauche.
    expect(fleches[0]!.disabled).toBe(true);
  });

  it("rien sans competence", () => {
    monter(0);
    expect(hote.innerHTML).toBe("");
  });

  it("la piste s aimante et defile a l horizontale", () => {
    const b = bloc(/\.piste-competences\s*\{/);
    expect(b).toMatch(/overflow-x:\s*auto/);
    expect(b).toMatch(/scroll-snap-type:\s*x mandatory/);
  });
});
