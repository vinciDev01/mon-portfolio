// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import type { ProjectDto } from "@portfolio/shared-types";
import { JournalProjets } from "@/components/parcours/journal-projets";
import { I18nProvider } from "../i18n/i18n-context";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;

const projet = (id: string, name: string): ProjectDto =>
  ({
    id, name, description: null, photo1Path: null, photo2Path: null,
    demoUrl: null, targetAudience: null, startDate: null, endDate: null,
    technologies: [], collaborators: [], sortOrder: 0,
  }) as ProjectDto;

let racine: ReturnType<typeof createRoot> | null = null;
let hote: HTMLDivElement;

beforeEach(() => {
  document.body.innerHTML = "";
  hote = document.createElement("div");
  document.body.append(hote);
  racine = createRoot(hote);
  act(() => {
    racine!.render(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(JournalProjets, {
          projets: [projet("a", "Alpha"), projet("b", "Beta"), projet("c", "Gamma")],
        }),
      ),
    );
  });
});

afterEach(() => {
  if (racine) act(() => racine!.unmount());
  racine = null;
  hote.remove();
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

const declencheur = (nom: string): HTMLButtonElement => {
  const b = [...hote.querySelectorAll<HTMLButtonElement>("h3 button")].find(
    (x) => x.textContent === nom,
  );
  if (!b) throw new Error(`aucun bouton dans le titre de "${nom}"`);
  return b;
};
const cliquer = (b: HTMLElement) => act(() => b.click());

describe("le journal tient UN parchemin (taches 4 et 5)", () => {
  it("rien n'est monte tant que rien n'est ouvert", () => {
    expect(document.querySelectorAll("dialog")).toHaveLength(0);
  });

  it("ouvert, il n'y a qu'un dialogue et qu'un identifiant de titre", () => {
    cliquer(declencheur("Beta"));
    expect(document.querySelectorAll("dialog"), "un dialogue par carte").toHaveLength(1);
    expect(
      document.querySelectorAll("#parchemin-titre"),
      "deux titres de meme id",
    ).toHaveLength(1);
    expect(document.querySelector("#parchemin-titre")!.textContent).toContain("Beta");
  });

  it("ne passe jamais d'un projet a un autre : une seule entree d'historique", () => {
    const pousser = vi.spyOn(window.history, "pushState");
    cliquer(declencheur("Alpha"));
    cliquer(declencheur("Beta"));
    cliquer(declencheur("Gamma"));
    expect(pousser, "entrees d'historique orphelines").toHaveBeenCalledTimes(1);
    expect(document.querySelector("#parchemin-titre")!.textContent).toContain("Alpha");
  });
});

describe("l'article n'est pas le declencheur", () => {
  it("cliquer l'article lui-meme, hors de ses boutons, n'ouvre rien", () => {
    // `renderToStaticMarkup` n'imprime jamais un gestionnaire : seul le DOM
    // vivant constate qu'un `onClick` a ete pose sur l'article.
    const article = hote.querySelector("article")!;
    cliquer(article);
    expect(document.querySelectorAll("dialog"), "l'article ouvre le parchemin").toHaveLength(0);
  });

  it("les declencheurs sont de vrais boutons focalisables", () => {
    const titre = declencheur("Alpha");
    expect(titre.tagName).toBe("BUTTON");
    expect(titre.type).toBe("button");
    expect(titre.disabled).toBe(false);
    expect(titre.tabIndex).toBeGreaterThanOrEqual(0);
    titre.focus();
    expect(document.activeElement).toBe(titre);
  });
});
