// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { I18nProvider } from "../i18n/i18n-context";
import { FournisseurSectionActive, ParcoursPagine } from "@/components/parcours/parcours-pagine";
import { SECTIONS } from "./sections";
import { leverArrivee, scriptArrivee } from "./script-arrivee";
import { bloc, valeur } from "./feuille-test";

/* Actualiser la page sur une section ne doit pas montrer l'accueil.

   Le fragment n'arrive pas au serveur : le HTML active toujours la section 0.
   Avant React, la page est un long document, et a l'actualisation le
   navigateur restaure une position de defilement nulle : on voit l'accueil
   jusqu'a l'hydratation. Le script d'arrivee, execute pendant l'analyse du
   HTML, affiche la section du fragment avant toute peinture ; le conteneur
   reprend la main ensuite et le retire. */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const IDS = ["ouverture", "projets", "contact"];
const racineHtml = document.documentElement;

/** Le HTML du serveur : la section 0 active, les autres non. */
function sectionsServeur() {
  const parcours = document.createElement("div");
  parcours.className = "parcours-pagine";
  for (const [i, id] of IDS.entries()) {
    const s = document.createElement("div");
    s.id = id;
    s.className = "section-paginee";
    if (i === 0) s.setAttribute("data-active", "true");
    parcours.appendChild(s);
  }
  document.body.appendChild(parcours);
}

/** Feuille minimale de la pagination, comme `globals.css`. */
function feuillePagination() {
  const f = document.createElement("style");
  f.textContent = `
    [data-pagination="active"] .section-paginee { visibility: hidden; }
    [data-pagination="active"] .section-paginee[data-active="true"] { visibility: visible; }`;
  document.head.appendChild(f);
}

const executer = (ids: readonly string[]) => new Function(scriptArrivee(ids))();
const visible = (id: string) => getComputedStyle(document.getElementById(id)!).visibility;

beforeEach(() => {
  feuillePagination();
});

afterEach(() => {
  leverArrivee();
  racineHtml.removeAttribute("data-pagination");
  document.body.innerHTML = "";
  document.head.innerHTML = "";
  window.history.replaceState(null, "", "/");
});

describe("le script d arrivee", () => {
  it("affiche la section du fragment, et elle seule, avant React", () => {
    sectionsServeur();
    window.history.replaceState(null, "", "#contact");
    executer(IDS);
    expect(racineHtml.getAttribute("data-pagination")).toBe("active");
    expect(racineHtml.getAttribute("data-arrivee")).toBe("contact");
    expect(visible("contact")).toBe("visible");
    expect(visible("ouverture")).toBe("hidden");
    expect(visible("projets")).toBe("hidden");
  });

  it("ne fait rien sans fragment, sur la premiere section ou sur un fragment inconnu", () => {
    for (const fragment of ["/", "#ouverture", "#inconnu", "#"]) {
      window.history.replaceState(null, "", fragment);
      executer(IDS);
      expect(racineHtml.hasAttribute("data-arrivee"), fragment).toBe(false);
      expect(racineHtml.hasAttribute("data-pagination"), fragment).toBe(false);
      expect(document.getElementById("style-arrivee"), fragment).toBeNull();
    }
  });

  it("n accepte que les identifiants de section, jamais le fragment brut", () => {
    window.history.replaceState(null, "", "#contact%7Bcolor:red%7D");
    executer(IDS);
    expect(racineHtml.hasAttribute("data-arrivee")).toBe(false);
  });

  it("ecarte un identifiant qui pourrait sortir de la balise ou du selecteur", () => {
    const script = scriptArrivee(["ouverture", "</script><b>", "a{}"]);
    expect(script).not.toContain("</script");
    expect(script).not.toContain("a{}");
  });

  it("leverArrivee rend la main a la pagination ordinaire", () => {
    sectionsServeur();
    window.history.replaceState(null, "", "#contact");
    executer(IDS);
    leverArrivee();
    expect(racineHtml.hasAttribute("data-arrivee")).toBe(false);
    expect(document.getElementById("style-arrivee")).toBeNull();
    expect(visible("ouverture")).toBe("visible");
  });
});

describe("la colonne, avant React, designe deja la section du fragment", () => {
  it("le script reprend les valeurs de l entree active de la feuille, et neutralise les autres", () => {
    const script = scriptArrivee(IDS);
    const actif = (sel: RegExp, prop: string) => valeur(bloc(sel), prop);
    // L'entree visee : exactement le style de `[aria-current="true"]`.
    for (const [sel, prop] of [
      [/\.entree-parcours\[aria-current="true"\]\s*\{/, "color"],
      [/\.entree-parcours\[aria-current="true"\] \.picto-section > \*\s*\{/, "stroke-width"],
      [/\.entree-parcours\[aria-current="true"\] \.entree-nom\s*\{/, "font-weight"],
      [/\.entree-parcours\[aria-current="true"\] \.entree-nom\s*\{/, "text-decoration"],
    ] as const) {
      expect(script, `${prop} de l entree active`).toContain(`${prop}:${actif(sel, prop)}`);
    }
    // L'entree que le serveur a marquee : rendue a son style de repos.
    expect(script).toContain(`color:${valeur(bloc(/^\s*\.entree-parcours\s*\{/m), "color")}`);
    expect(script).toContain(`stroke-width:${valeur(bloc(/^\s*\.picto-section > \*\s*\{/m), "stroke-width")}`);
  });

  it("vise l entree de la section du fragment par son ancre", () => {
    sectionsServeur();
    window.history.replaceState(null, "", "#contact");
    executer(IDS);
    const feuille = document.getElementById("style-arrivee")!.textContent!;
    expect(feuille).toContain('.entree-parcours[href="#contact"]');
  });
});

describe("le conteneur reprend la main apres le script d arrivee", () => {
  let racine: Root;
  let hote: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    Element.prototype.scrollTo = () => {};
    hote = document.createElement("div");
    document.body.appendChild(hote);
    racine = createRoot(hote);
  });

  afterEach(() => {
    act(() => racine.unmount());
    vi.useRealTimers();
  });

  function monter() {
    const sections = SECTIONS.filter((s) => IDS.includes(s.id));
    const enfants = Object.fromEntries(IDS.map((id) => [id, `CONTENU-${id}`]));
    act(() => {
      racine.render(
        createElement(
          I18nProvider as ComponentType<{ defaultLocale: string }>,
          { defaultLocale: "fr" },
          createElement(
            FournisseurSectionActive as ComponentType<{ initial: string | null }>,
            { initial: IDS[0]! },
            createElement(ParcoursPagine, { sections, enfants, pied: "PIED" }),
          ),
        ),
      );
    });
  }

  it("active la section visee, puis retire le script d arrivee", () => {
    window.history.replaceState(null, "", "#contact");
    executer(IDS);
    monter();
    act(() => void vi.advanceTimersByTime(100));
    const actives = [...document.querySelectorAll('.parcours-pagine > [data-active="true"]')].map((e) => e.id);
    expect(actives).toEqual(["contact"]);
    expect(racineHtml.hasAttribute("data-arrivee")).toBe(false);
    expect(document.getElementById("style-arrivee")).toBeNull();
  });
});
