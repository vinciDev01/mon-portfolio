// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { SkillDto, TechnologyDto } from "@portfolio/shared-types";
import { competenceDe, niveauDe, rangerParFamille, remplirBande } from "@/lib/competences/outillage";
import { I18nProvider } from "../i18n/i18n-context";
import { tracerBord } from "@/components/portfolio/bord-imparfait";
import { SECONDES_PAR_ETIQUETTE, SkillsSection } from "@/components/portfolio/skills-section";
import { bloc, cssNu } from "../parcours/feuille-test";

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
  ({ id, label: id, logoPath: null, logoSlug: null, logoTrace: null, sortOrder, showInCv: true, familyId: famille?.id ?? null, family: famille }) as TechnologyDto;
/** Une competence liee a une technologie. */
const competence = (t: TechnologyDto, proficiency: number | null, sortOrder = 0) =>
  ({ id: `s-${t.id}`, technologyId: t.id, technology: t, label: null, familyId: null, family: null, proficiency, sortOrder }) as SkillDto;
/** Une competence libre, sans technologie. */
const libre = (label: string, famille: ReturnType<typeof fam> | null, proficiency: number | null = null) =>
  ({ id: `l-${label}`, technologyId: null, technology: null, label, familyId: famille?.id ?? null, family: famille, proficiency, sortOrder: 0 }) as SkillDto;

describe("rangement et bande", () => {
  it("une competence liee prend nom, famille et logo de sa technologie ; une libre garde les siens", () => {
    const web = fam("Web", 1);
    const gestion = fam("Gestion", 5);
    const html = { ...techno("HTML", web), logoPath: "technologies/html.webp" };
    expect(competenceDe(competence(html, 90))).toMatchObject({ nom: "HTML", famille: web, logoPath: "technologies/html.webp", niveau: 3 });
    expect(competenceDe(libre("Management", gestion, 70))).toMatchObject({ nom: "Management", famille: gestion, logoPath: null, niveau: 2 });
  });

  it("range par famille dans leur ordre, Autres en dernier ; dans un tiroir, l ordre saisi", () => {
    const web = fam("Web", 2);
    const gestion = fam("Gestion", 1);
    const tiroirs = rangerParFamille(
      [competence(techno("CSS", web), 50, 2), libre("Veille", null), libre("Management", gestion), competence(techno("HTML", web), 50, 1)].map(competenceDe),
    );
    expect(tiroirs.map((t) => t.famille?.name ?? "autres")).toEqual(["Gestion", "Web", "autres"]);
    expect(tiroirs[1]!.competences.map((c) => c.nom)).toEqual(["HTML", "CSS"]);
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
  const monter = (skills: SkillDto[]) =>
    act(() => {
      racine.render(createElement(Fournisseur, { defaultLocale: "fr" }, createElement(SkillsSection, { skills })));
    });

  it("n affiche que les competences, techniques ou non", () => {
    monter([competence(html, 90), libre("Management", fam("Gestion", 2), 80)]);
    const lues = [...hote.querySelectorAll(".liste-outils-fixe .etiquette-nom")].map((n) => n.textContent);
    expect(lues).toEqual(["HTML", "Management"]);
    expect([...hote.querySelectorAll("dt")].map((d) => d.textContent)).toEqual(["Web", "Gestion"]);
  });

  it("une rangee par famille, chaque competence lue une seule fois, la bande muette", () => {
    monter([competence(html, null, 0), competence(css, null, 1), competence(git, null)]);
    expect([...hote.querySelectorAll("dt")].map((d) => d.textContent)).toEqual(["Web", "Autres"]);
    const lues = [...hote.querySelectorAll(".liste-outils-fixe .etiquette-nom")].map((n) => n.textContent);
    expect(lues).toEqual(["HTML", "CSS", "Git"]);
    for (const b of hote.querySelectorAll(".bande-outils")) expect(b.getAttribute("aria-hidden")).toBe("true");
  });

  it("la bande porte deux copies identiques, assez longues pour boucler", () => {
    monter([competence(html, null), competence(css, null)]);
    const pistes = [...hote.querySelectorAll(".bande-outils .piste-outils")];
    expect(pistes).toHaveLength(2);
    expect(pistes[0]!.textContent).toBe(pistes[1]!.textContent);
    expect(pistes[0]!.querySelectorAll("li").length).toBeGreaterThanOrEqual(12);
  });

  it("defile lentement : la duree suit le nombre d etiquettes", () => {
    expect(SECONDES_PAR_ETIQUETTE).toBeGreaterThanOrEqual(7);
    monter([competence(html, null), competence(css, null)]);
    const duree = parseFloat((hote.querySelector(".rangee-outils") as HTMLElement).style.getPropertyValue("--duree"));
    const etiquettes = hote.querySelectorAll(".bande-outils .piste-outils")[0]!.querySelectorAll("li").length;
    expect(duree).toBe(etiquettes * SECONDES_PAR_ETIQUETTE);
  });

  it("une rangee sur deux defile dans l autre sens", () => {
    monter([competence(html, null), competence(git, null)]);
    const rangees = [...hote.querySelectorAll(".rangee-outils")];
    expect(rangees[0]!.getAttribute("data-sens")).toBeNull();
    expect(rangees[1]!.getAttribute("data-sens")).toBe("inverse");
  });

  it("chaque etiquette a son bord imparfait, et ses pierres si un niveau est saisi", () => {
    monter([competence(html, 90, 0), competence(css, null, 1)]);
    const fixes = [...hote.querySelectorAll(".liste-outils-fixe > li")];
    for (const e of fixes) expect(e.querySelector(":scope > svg.bord-imparfait")).not.toBeNull();
    expect(fixes[0]!.querySelector(".etiquette-niveau")?.getAttribute("data-niveau")).toBe("3");
    expect(fixes[1]!.querySelector(".etiquette-niveau")).toBeNull();
  });

  it("chaque etiquette porte un logo : le trace du catalogue joint par l API, sinon l initiale", () => {
    const avecLogo = { ...html, logoSlug: "html5", logoTrace: "M1 1h22v22H1z", logoHex: "E34F26" };
    monter([competence(avecLogo, null), libre("Management", null)]);
    const fixes = [...hote.querySelectorAll(".liste-outils-fixe > li")];
    expect(fixes[0]!.querySelector("svg.etiquette-logo path")?.getAttribute("d")).toBe("M1 1h22v22H1z");
    // La couleur de marque, par theme.
    const style = fixes[0]!.querySelector<SVGElement>("svg.etiquette-logo")!.style;
    expect(style.getPropertyValue("--logo-jour")).toBe("#E34F26");
    expect(fixes[1]!.querySelector(".etiquette-initiale")?.textContent).toBe("M");
    for (const l of hote.querySelectorAll(".etiquette-logo")) expect(l.getAttribute("aria-hidden")).toBe("true");
  });

  it("le bouton met en pause et reprend", () => {
    monter([competence(html, null)]);
    const bouton = hote.querySelector<HTMLButtonElement>(".pause-outils")!;
    const avant = bouton.textContent;
    act(() => bouton.click());
    expect(hote.querySelector(".boite-outils")!.getAttribute("data-pause")).toBe("true");
    expect(bouton.textContent).not.toBe(avant);
    act(() => bouton.click());
    expect(hote.querySelector(".boite-outils")!.getAttribute("data-pause")).toBeNull();
  });

  it("rien sans competence", () => {
    monter([]);
    expect(hote.innerHTML).toBe("");
  });

  it("defile en boucle, s arrete au survol, en pause, et pour moins de mouvement", () => {
    expect(bloc(/\.bande-outils\s*\{/)).toMatch(/animation:\s*defiler-outils[^;]*infinite/);
    expect(bloc(/@keyframes defiler-outils\s*\{/)).toMatch(/translate:\s*-50% 0/);
    expect(bloc(/\.boite-outils\[data-pause="true"\] \.bande-outils\s*\{/)).toMatch(/animation-play-state:\s*paused/);
    const reduit = bloc(/@media \(prefers-reduced-motion: reduce\)\s*\{(?=\s*\.bande-outils)/);
    expect(reduit).toMatch(/display:\s*none/);
    expect(reduit).toMatch(/\.liste-outils-fixe\s*\{[^}]*position:\s*static/);
    const fenetre = bloc(/\.defilement-outils\s*\{/);
    expect(fenetre).toMatch(/overflow:\s*hidden/);
    expect(fenetre).toMatch(/mask-image:\s*linear-gradient\(\s*to right,\s*transparent/);
    expect(cssNu).not.toMatch(/margin-inline-end:\s*-100vw/);
  });
});
