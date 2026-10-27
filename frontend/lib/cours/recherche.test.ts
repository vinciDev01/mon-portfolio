// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { CoursPublicDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { CoursSection } from "@/components/portfolio/cours-section";
import { filtrerCours } from "./recherche";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fam = (name: string) => ({ id: name, name, sortOrder: 0 });
const cours = (id: string, titre: string, techno: string, famille: string, description: string | null = null) =>
  ({
    id,
    titre,
    titreCourt: null,
    description,
    niveau: "debutant",
    pages: 10,
    taille: 1000,
    sortOrder: 0,
    updatedAt: "2026-10-01T00:00:00.000Z",
    technology: { id: techno, label: techno, sortOrder: 0, family: fam(famille) },
  }) as unknown as CoursPublicDto;

const java = cours("j", "Java, des bases aux objets", "Java", "Langages", "Les classes et l'héritage.");
const docker = cours("d", "Conteneurs pas à pas", "Docker", "Outils");

describe("recherche d un cours", () => {
  it("sans mot, tous les cours", () => {
    expect(filtrerCours([java, docker], "  ")).toEqual([java, docker]);
  });

  it("cherche dans le titre, la description, la technologie et la famille", () => {
    expect(filtrerCours([java, docker], "objets")).toEqual([java]);
    expect(filtrerCours([java, docker], "heritage")).toEqual([java]);
    expect(filtrerCours([java, docker], "docker")).toEqual([docker]);
    expect(filtrerCours([java, docker], "OUTILS")).toEqual([docker]);
  });

  it("chaque mot doit se trouver, accents et casse ignores", () => {
    expect(filtrerCours([java, docker], "java héritage")).toEqual([java]);
    expect(filtrerCours([java, docker], "java docker")).toEqual([]);
  });
});

describe("la recherche sur l etagere", () => {
  let racine: Root;
  let hote: HTMLElement;
  beforeEach(() => {
    hote = document.createElement("div");
    document.body.appendChild(hote);
    racine = createRoot(hote);
    act(() =>
      racine.render(
        createElement(
          I18nProvider as ComponentType<{ defaultLocale: string }>,
          { defaultLocale: "fr" },
          createElement(CoursSection, { cours: [java, docker] }),
        ),
      ),
    );
  });
  afterEach(() => {
    act(() => racine.unmount());
    hote.remove();
  });

  const saisir = (texte: string) =>
    act(() => {
      const champ = hote.querySelector<HTMLInputElement>("#recherche-cours")!;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(champ, texte);
      champ.dispatchEvent(new Event("input", { bubbles: true }));
    });
  const livres = () => [...hote.querySelectorAll("button.livre-cours")].map((b) => b.getAttribute("aria-label"));

  it("a un champ nomme, dans une zone de recherche", () => {
    expect(hote.querySelector('[role="search"] input#recherche-cours')).not.toBeNull();
    expect(hote.querySelector('label[for="recherche-cours"]')?.textContent).toBe("Rechercher un cours");
  });

  it("ne garde sur l etagere que les livres trouves, et l annonce", () => {
    saisir("docker");
    expect(livres()).toHaveLength(1);
    expect(livres()[0]).toContain("Conteneurs");
    expect(hote.querySelector('[role="status"]')?.textContent).toBe("Cours trouvés : 1");
  });

  it("dit quand rien ne correspond", () => {
    saisir("cobol");
    expect(livres()).toHaveLength(0);
    expect(hote.textContent).toContain("Aucun cours ne correspond");
  });
});
