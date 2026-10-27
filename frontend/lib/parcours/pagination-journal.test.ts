// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ProjectDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { JournalProjets } from "@/components/parcours/journal-projets";
import { PROJETS_PAR_PAGE, pageDeSuite } from "./journal";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const projet = (i: number) =>
  ({
    id: `p${i}`,
    name: `Projet ${i}`,
    description: null,
    photo1Path: null,
    photo2Path: null,
    demoUrl: null,
    projectUrl: null,
    targetAudience: null,
    startDate: null,
    endDate: null,
    sortOrder: i,
    technologies: [],
    collaborators: [],
  }) as unknown as ProjectDto;

describe("une page de la suite", () => {
  const suite = Array.from({ length: 14 }, (_, i) => i);

  it("coupe par six, et compte les pages", () => {
    expect(PROJETS_PAR_PAGE).toBe(6);
    expect(pageDeSuite(suite, 1)).toEqual({ elements: [0, 1, 2, 3, 4, 5], page: 1, pages: 3 });
    expect(pageDeSuite(suite, 3).elements).toEqual([12, 13]);
  });

  it("ramene une page hors bornes dans les bornes", () => {
    expect(pageDeSuite(suite, 9).page).toBe(3);
    expect(pageDeSuite(suite, 0).page).toBe(1);
    expect(pageDeSuite([], 4)).toEqual({ elements: [], page: 1, pages: 1 });
  });
});

describe("la pagination du journal", () => {
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
    act(() =>
      racine.render(
        createElement(
          I18nProvider as ComponentType<{ defaultLocale: string }>,
          { defaultLocale: "fr" },
          createElement(JournalProjets, { projets: Array.from({ length: n }, (_, i) => projet(i)) }),
        ),
      ),
    );
  const titres = () => [...hote.querySelectorAll(".journal-titre")].map((h) => h.textContent?.trim());
  const pageCourante = () => hote.querySelector('[aria-current="page"]')?.textContent;
  const cliquer = (nom: string) => act(() => hote.querySelector<HTMLButtonElement>(`button[aria-label="${nom}"]`)!.click());

  it("sept projets ou moins : aucune pagination", () => {
    monter(7);
    expect(hote.querySelector(".journal-pagination")).toBeNull();
    expect(titres()).toHaveLength(7);
  });

  it("le projet principal reste en tete a chaque page, la suite par six", () => {
    monter(18);
    expect(titres()).toHaveLength(7);
    expect(titres()[0]).toBe("Projet 0");
    expect(pageCourante()).toBe("1");
    cliquer("Page 3");
    expect(titres()[0]).toBe("Projet 0");
    expect(titres().slice(1)).toEqual(["Projet 13", "Projet 14", "Projet 15", "Projet 16", "Projet 17"]);
    expect(pageCourante()).toBe("3");
    expect(hote.querySelector('[role="status"]')?.textContent).toBe("Page 3 sur 3");
  });

  it("precedente et suivante, desactivees aux bouts", () => {
    monter(18);
    const precedente = () => hote.querySelector<HTMLButtonElement>('button[aria-label="Page précédente"]')!;
    const suivante = () => hote.querySelector<HTMLButtonElement>('button[aria-label="Page suivante"]')!;
    expect(precedente().disabled).toBe(true);
    cliquer("Page suivante");
    expect(pageCourante()).toBe("2");
    cliquer("Page suivante");
    expect(suivante().disabled).toBe(true);
    cliquer("Page précédente");
    expect(pageCourante()).toBe("2");
  });

  it("une navigation nommee, des boutons au bord imparfait", () => {
    monter(18);
    const nav = hote.querySelector('nav.journal-pagination[aria-label="Pages des projets"]')!;
    expect(nav).not.toBeNull();
    for (const b of nav.querySelectorAll("button")) expect(b.querySelector(":scope > svg.bord-imparfait")).not.toBeNull();
  });
});
