// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { SkillDto, TechnologyDto } from "@portfolio/shared-types";
import { niveauDe, rangerParFamille, remplirBande } from "@/lib/competences/outillage";
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
const fam = (id: string, sortOrder: number) => ({ id, name: id, sortOrder });
const techno = (id: string, famille: ReturnType<typeof fam> | null, sortOrder = 0) =>
  ({ id, label: id, logoPath: null, sortOrder, showInCv: true, familyId: famille?.id ?? null, family: famille }) as TechnologyDto;
const competence = (t: TechnologyDto, proficiency: number | null) =>
  ({ id: `s-${t.id}`, technologyId: t.id, proficiency, sortOrder: 0, technology: t }) as SkillDto;

describe("rangement et bande", () => {
  it("range par famille dans leur ordre, Autres en dernier, sans tiroir vide", () => {
    const web = fam("Web", 2);
    const lang = fam("Langages", 1);
    const tiroirs = rangerParFamille([techno("CSS", web, 1), techno("Git", null), techno("Java", lang), techno("HTML", web, 0)]);
    expect(tiroirs.map((t) => t.famille?.name ?? "autres")).toEqual(["Langages", "Web", "autres"]);
    expect(tiroirs[1]!.technologies.map((t) => t.label)).toEqual(["HTML", "CSS"]);
  });

  it("remplit une bande courte par repetition, sans toucher une longue", () => {
    expect(remplirBande(["a", "b", "c"], 10)).toHaveLength(12);
    expect(remplirBande(["a", "b", "c"], 10).slice(3, 6)).toEqual(["a", "b", "c"]);
    expect(remplirBande(Array.from({ length: 12 }, (_, i) => i), 10)).toHaveLength(12);
    expect(remplirBande([], 10)).toEqual([]);
  });

  it("traduit la maitrise en une a trois pierres", () => {
    expect([null, 40, 60, 79, 80, 100].map(niveauDe)).toEqual([0, 1, 2, 2, 3, 3]);
  });
});

describe("competences en rangees qui defilent", () => {
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

  const web = fam("Web", 1);
  const html = techno("HTML", web);
  const css = techno("CSS", web, 1);
  const git = techno("Git", null);
  const monter = (props: { skills: SkillDto[]; technologies?: TechnologyDto[] }) =>
    act(() => {
      racine.render(createElement(Fournisseur, { defaultLocale: "fr" }, createElement(SkillsSection, props)));
    });

  it("une seule vue : ni carrousel, ni seconde liste", () => {
    monter({ skills: [competence(html, 90)], technologies: [html, css, git] });
    expect(hote.querySelector(".carrousel-competences, .carte-competence")).toBeNull();
    expect(hote.querySelectorAll(".boite-outils")).toHaveLength(1);
  });

  it("une rangee par famille, et chaque technologie lue une seule fois", () => {
    monter({ skills: [], technologies: [html, css, git] });
    expect([...hote.querySelectorAll("dt")].map((d) => d.textContent)).toEqual(["Web", "Autres"]);
    // Les listes lues : chaque technologie une fois.
    const lues = [...hote.querySelectorAll(".liste-outils-fixe > li")].map((li) => li.textContent);
    expect(lues).toEqual(["HTML", "CSS", "Git"]);
    // La bande defilante n'est pas lue.
    for (const b of hote.querySelectorAll(".bande-outils")) expect(b.getAttribute("aria-hidden")).toBe("true");
  });

  it("la bande porte deux copies identiques, assez longues pour boucler", () => {
    monter({ skills: [], technologies: [html, css] });
    const pistes = [...hote.querySelectorAll(".bande-outils .piste-outils")];
    expect(pistes).toHaveLength(2);
    expect(pistes[0]!.textContent).toBe(pistes[1]!.textContent);
    expect(pistes[0]!.querySelectorAll("li").length).toBeGreaterThanOrEqual(10);
  });

  it("une rangee sur deux defile dans l autre sens", () => {
    monter({ skills: [], technologies: [html, git] });
    const rangees = [...hote.querySelectorAll(".rangee-outils")];
    expect(rangees[0]!.getAttribute("data-sens")).toBeNull();
    expect(rangees[1]!.getAttribute("data-sens")).toBe("inverse");
  });

  it("chaque etiquette a son bord imparfait, et une competence ses pierres", () => {
    monter({ skills: [competence(html, 90)], technologies: [html, css] });
    const fixes = [...hote.querySelectorAll(".liste-outils-fixe > li")];
    for (const e of fixes) expect(e.querySelector(":scope > svg.bord-imparfait")).not.toBeNull();
    expect(fixes[0]!.querySelector(".etiquette-niveau")?.getAttribute("data-niveau")).toBe("3");
    expect(fixes[1]!.querySelector(".etiquette-niveau")).toBeNull();
  });

  it("le bouton met en pause et reprend", () => {
    monter({ skills: [], technologies: [html] });
    const bouton = hote.querySelector<HTMLButtonElement>(".pause-outils")!;
    const avant = bouton.textContent;
    act(() => bouton.click());
    expect(hote.querySelector(".boite-outils")!.getAttribute("data-pause")).toBe("true");
    expect(bouton.textContent).not.toBe(avant);
    act(() => bouton.click());
    expect(hote.querySelector(".boite-outils")!.getAttribute("data-pause")).toBeNull();
  });

  it("sans liste de technologies, celles des competences suffisent ; rien sans aucune", () => {
    monter({ skills: [competence(git, 50)] });
    expect(hote.querySelectorAll(".liste-outils-fixe > li")).toHaveLength(1);
    monter({ skills: [] });
    expect(hote.innerHTML).toBe("");
  });

  it("defile en boucle, s arrete au survol, en pause, et pour moins de mouvement", () => {
    expect(bloc(/\.bande-outils\s*\{/)).toMatch(/animation:\s*defiler-outils[^;]*infinite/);
    expect(bloc(/@keyframes defiler-outils\s*\{/)).toMatch(/translate:\s*-50% 0/);
    expect(bloc(/\.boite-outils\[data-pause="true"\] \.bande-outils\s*\{/)).toMatch(/animation-play-state:\s*paused/);
    const reduit = bloc(/@media \(prefers-reduced-motion: reduce\)\s*\{(?=\s*\.bande-outils)/);
    expect(reduit).toMatch(/display:\s*none/);
    expect(reduit).toMatch(/\.liste-outils-fixe\s*\{[^}]*position:\s*static/);
    expect(bloc(/\.defilement-outils\s*\{/)).toMatch(/overflow:\s*hidden/);
  });
});
