// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import type { ProjectDto } from "@portfolio/shared-types";
import { JournalProjets } from "@/components/parcours/journal-projets";
import { I18nProvider } from "../i18n/i18n-context";
import { lire } from "./feuille-test";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;

const projet = (id: string, name: string, photo1Path: string | null = null): ProjectDto =>
  ({
    id, name, description: null, photo1Path, photo2Path: null,
    demoUrl: null, projectUrl: null, targetAudience: null,
    startDate: null, endDate: null,
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
          projets: [projet("a", "Alpha", "alpha.webp"), projet("b", "Beta"), projet("c", "Gamma")],
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

const details = (nom: string): HTMLButtonElement => {
  const art = [...hote.querySelectorAll("article")].find(
    (a) => a.querySelector("h3 button")?.textContent === nom,
  );
  const b = art?.querySelector<HTMLButtonElement>("button.journal-details");
  if (!b) throw new Error(`aucun bouton Details dans l'article de "${nom}"`);
  return b;
};

describe("le bouton Details (revision 3)", () => {
  it("chaque article en porte un, avec le mot visible", () => {
    expect(hote.querySelectorAll("button.journal-details")).toHaveLength(3);
    expect(details("Alpha").textContent).toBe("Détails");
    expect(details("Alpha").type).toBe("button");
  });

  it("ouvre le parchemin de SON projet, et le titre fonctionne toujours", () => {
    cliquer(details("Gamma"));
    expect(document.querySelectorAll("dialog")).toHaveLength(1);
    expect(document.querySelector("#parchemin-titre")!.textContent).toContain("Gamma");
    cliquer(document.querySelector<HTMLButtonElement>("dialog button")!);
    cliquer(declencheur("Beta"));
    expect(document.querySelector("#parchemin-titre")!.textContent).toContain("Beta");
  });

  it("passe par la meme garde : un second projet n'est pas ouvert par-dessus", () => {
    cliquer(details("Alpha"));
    cliquer(details("Beta"));
    expect(document.querySelectorAll("dialog")).toHaveLength(1);
    expect(document.querySelector("#parchemin-titre")!.textContent).toContain("Alpha");
  });
});

/* -------------------------------------------------------------------------
   Le bouton « Details » nomme SON titre (revision 4).

   L'implementation relie chaque bouton au `<h3>` de son article par `useId`.
   Trois mutations y survivaient : retirer l'`aria-describedby`, retirer l'`id`
   du `<h3>`, et faire pointer le `describedby` vers un identifiant inexistant.

   La resolution passe par `getElementById` et JAMAIS par
   `querySelector("#" + id)`. La forme du jeton de `useId` est une affaire
   interne de React et elle a change d'une version a l'autre : React 18 rendait
   `:r0:` et React 19 a rendu un temps `«r0»`, deux identifiants HTML legaux
   mais INVALIDES comme selecteurs CSS, sur lesquels `querySelector` LEVE au
   lieu de constater. MESURE sous React 19.2.4 : le jeton vaut `_r_o_`, qui
   passerait un selecteur ; la garde ne doit pas en dependre pour autant.
   `getElementById` est insensible a la forme du jeton, et c'est d'ailleurs la
   facon dont un lecteur d'ecran resout `aria-describedby`.
   ------------------------------------------------------------------------- */
describe("le bouton Details decrit le titre de SON article (revision 4)", () => {
  it("pointe vers un h3 non vide, celui de son propre article", () => {
    const articles = [...hote.querySelectorAll("article")];
    expect(articles, "aucun article rendu : l assertion serait vide").toHaveLength(3);
    const cibles: string[] = [];
    for (const art of articles) {
      const nom = art.querySelector("h3 button")?.textContent ?? "(sans nom)";
      const bouton = art.querySelector<HTMLButtonElement>("button.journal-details");
      expect(bouton, `aucun bouton Details dans l article de ${nom}`).not.toBeNull();
      const cible = bouton!.getAttribute("aria-describedby");
      expect(cible, `le bouton Details de ${nom} ne decrit aucun titre`).not.toBeNull();
      expect(cible!.trim(), `aria-describedby blanc sur ${nom}`).not.toBe("");
      const titre = document.getElementById(cible!);
      expect(titre, `aria-describedby de ${nom} pointe vers rien : ${cible}`)
        .not.toBeNull();
      expect(titre!.tagName, `la cible de ${nom} n est pas un titre`).toBe("H3");
      expect(
        art.contains(titre!),
        `le bouton Details de ${nom} decrit le titre d un AUTRE article`,
      ).toBe(true);
      expect(titre!.textContent?.trim(), `le titre de ${nom} est vide`).not.toBe("");
      cibles.push(cible!);
    }
    expect(
      new Set(cibles).size,
      "deux articles partagent un identifiant de titre : le lien est ambigu",
    ).toBe(3);
  });

  it("un nom de projet blanc se resout vers le titre de repli, jamais vers rien", () => {
    const hote2 = document.createElement("div");
    document.body.append(hote2);
    const racine2 = createRoot(hote2);
    act(() => {
      racine2.render(
        createElement(
          Fournisseur,
          { defaultLocale: "fr" },
          createElement(JournalProjets, { projets: [projet("z", "   ")] }),
        ),
      );
    });
    const bouton = hote2.querySelector<HTMLButtonElement>("button.journal-details");
    expect(bouton, "aucun bouton Details sur un projet au nom blanc").not.toBeNull();
    const cible = bouton!.getAttribute("aria-describedby");
    expect(cible, "le bouton Details ne decrit aucun titre").not.toBeNull();
    const titre = document.getElementById(cible!);
    expect(titre, `le titre de repli n est pas atteignable : ${cible}`).not.toBeNull();
    const fr = JSON.parse(lire("lib/i18n/fr.json")) as Record<string, string>;
    expect(titre!.textContent?.trim(), "le titre de repli n est pas celui du dictionnaire")
      .toBe(fr["projects.sansTitre"]);
    act(() => racine2.unmount());
    hote2.remove();
  });
});

const fermerParchemin = () =>
  cliquer(document.querySelector<HTMLButtonElement>("dialog button")!);

describe("ouvrir, fermer, rouvrir depuis le journal", () => {
  it("la photo de tete ouvre le parchemin de SON projet", () => {
    const photo = hote.querySelector<HTMLButtonElement>("button.journal-declencheur-image");
    if (!photo) throw new Error("aucun bouton de photo rendu");
    cliquer(photo);
    expect(document.querySelectorAll("dialog"), "le bouton de la photo est mort").toHaveLength(1);
    expect(document.querySelector("#parchemin-titre")!.textContent).toContain("Alpha");
  });

  it("apres fermeture, un AUTRE projet s'ouvre : les declencheurs ne restent pas muets", () => {
    cliquer(declencheur("Alpha"));
    expect(document.querySelectorAll("dialog")).toHaveLength(1);
    fermerParchemin();
    expect(document.querySelectorAll("dialog"), "le parchemin ne se ferme pas").toHaveLength(0);
    cliquer(declencheur("Beta"));
    expect(document.querySelectorAll("dialog"), "declencheurs muets apres fermeture").toHaveLength(1);
    expect(document.querySelector("#parchemin-titre")!.textContent).toContain("Beta");
  });
});
