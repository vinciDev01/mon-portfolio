// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { I18nProvider } from "../i18n/i18n-context";
import {
  FournisseurSectionActive,
  ParcoursPagine,
} from "@/components/parcours/parcours-pagine";
import { SectionToastObserver } from "@/components/portfolio/section-toast-observer";
import { ColonnePassage } from "@/components/parcours/colonne-passage";
import type { PersonalInfoDto, SiteSettingsDto } from "@portfolio/shared-types";
import { SECTIONS } from "./sections";
import { DELAI_STABILISATION } from "./toast-section";
import { VERROU_APRES_MS } from "./sequence";

/* Les deux cablages du chantier sont ici exercices dans un DOM, la ou les
   tests de source ne font que compter des chaines : l'observateur du toast
   (`data-active` -> annonce) et le sequencement du conteneur (jamais deux
   sections actives, toujours un passage par le fond). */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const IDS = ["ouverture", "projets", "contact"];
/** Duree injectee dans la feuille du test. Volontairement differente de
 *  `SORTIE_REPLI_MS` (180) : si le conteneur se rabattait sur le repli, les
 *  durees observees ne coincideraient plus et le test echouerait. */
const SORTIE_FEUILLE_S = 0.3;
const SORTIE_MS = Math.round(SORTIE_FEUILLE_S * 1000);

let racine: Root;
let hote: HTMLElement;

function monter() {
  const sections = SECTIONS.filter((s) => IDS.includes(s.id));
  const enfants: Record<string, string> = {};
  for (const id of IDS) enfants[id] = `CONTENU-${id}`;
  act(() => {
    racine.render(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(
          FournisseurSectionActive as ComponentType<{ initial: string | null }>,
          { initial: IDS[0]! },
          createElement(SectionToastObserver),
          createElement(ParcoursPagine, { sections, enfants, pied: "PIED" }),
        ),
      ),
    );
  });
}

const actives = () =>
  [...document.querySelectorAll('.parcours-pagine > [data-active="true"]')].map((e) => e.id);
const toasts = () => document.querySelectorAll(".section-toast:not(.section-toast-exit)");
const avancer = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
/** `MutationObserver` livre ses enregistrements en micro-tache. */
const laisserObserver = () => act(async () => {});
const molette = () =>
  act(() => {
    window.dispatchEvent(
      new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true }),
    );
  });

beforeEach(() => {
  vi.useFakeTimers();
  // jsdom n'implemente pas `scrollTo` sur les elements.
  Element.prototype.scrollTo = () => {};
  // jsdom ne calcule aucune transition de lui-meme : on fournit la duree que
  // le conteneur lit sur la feuille.
  const feuille = document.createElement("style");
  feuille.textContent = `.section-paginee { transition-duration: ${SORTIE_FEUILLE_S}s; }`;
  document.head.appendChild(feuille);
  window.history.replaceState(null, "", "/");
  hote = document.createElement("div");
  document.body.appendChild(hote);
  racine = createRoot(hote);
});

afterEach(() => {
  act(() => racine.unmount());
  hote.remove();
  document.body.innerHTML = "";
  document.head.innerHTML = "";
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("le toast de section suit `data-active` (spec section 3)", () => {
  it("annonce la section d'arrivee une seule fois, apres la stabilisation", async () => {
    monter();
    avancer(DELAI_STABILISATION);
    expect(toasts()).toHaveLength(1);

    // Bascule a la main, comme le ferait le conteneur.
    const sortante = document.getElementById("ouverture")!;
    const entrante = document.getElementById("projets")!;
    sortante.removeAttribute("data-active");
    await laisserObserver();
    avancer(10);
    entrante.setAttribute("data-active", "true");
    await laisserObserver();
    avancer(DELAI_STABILISATION - 1);
    expect(document.querySelectorAll(".section-toast-title")).toHaveLength(1);

    avancer(1);
    const titres = [...document.querySelectorAll(".section-toast-title")].map((e) => e.textContent);
    expect(titres).toHaveLength(2); // l'ancien finit de sortir, le nouveau est la
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]!.textContent).toContain("Projets");

    // Rien de plus ne tombe tant que rien ne change.
    avancer(5000);
    expect(document.querySelectorAll(".section-toast")).toHaveLength(0);
  });
});

describe("le conteneur ne fait jamais de fondu croise (spec section 2)", () => {
  /** Releve l'ensemble des sections actives a chaque pas de 10 ms. */
  function enregistrer(duree: number) {
    const releves: string[][] = [actives()];
    for (let t = 0; t < duree; t += 10) {
      avancer(10);
      releves.push(actives());
    }
    return releves;
  }

  it("passe par l'etat sans section active entre la sortante et l'entrante", () => {
    monter();
    expect(actives()).toEqual(["ouverture"]);
    const avant = actives();
    molette();
    const releves = [avant, ...enregistrer(SORTIE_MS + VERROU_APRES_MS + 50)];

    // Sequence compressee des etats distincts successifs.
    const sequence = releves
      .map((r) => r.join(","))
      .filter((v, i, a) => i === 0 || v !== a[i - 1]);
    expect(sequence).toEqual(["ouverture", "", "projets"]);
    // Le fond nu dure la duree de la FEUILLE (300), pas celle du repli (180).
    expect(releves[SORTIE_MS / 10 - 1]).toEqual([]);
    expect(releves[SORTIE_MS / 10 + 1]).toEqual(["projets"]);
    for (const r of releves) expect(r.length).toBeLessThanOrEqual(1);
  });

  it("la molette est inerte pendant le changement, vive ensuite", () => {
    monter();
    molette();
    avancer(SORTIE_MS / 2);
    molette(); // verrouille : ignoree
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(actives()).toEqual(["projets"]);
    avancer(400); // vide l'accumulateur
    molette();
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(actives()).toEqual(["contact"]);
  });

  it("le focus suit la section d'arrivee meme pour une molette", () => {
    monter();
    molette();
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(document.activeElement).toBe(document.getElementById("projets"));
  });

  /** Une colonne dont on fixe les mesures : jsdom ne fait aucune mise en page. */
  function poserColonne(scrollHeight: number, clientHeight: number, scrollTop = 0) {
    const colonne = document.createElement("nav");
    colonne.className = "colonne-passage";
    // La garde lit la convention, plus la classe.
    colonne.setAttribute("data-defilement-propre", "");
    for (const [k, v] of Object.entries({ scrollHeight, clientHeight, scrollTop })) {
      Object.defineProperty(colonne, k, { value: v, configurable: true });
    }
    document.body.appendChild(colonne);
    return colonne;
  }
  const rouler = (cible: Element) => {
    const e = new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true });
    act(() => void cible.dispatchEvent(e));
    return e;
  };

  it("une colonne qui ne defile pas laisse paginer (zone morte corrigee)", () => {
    monter();
    const e = rouler(poserColonne(500, 500));
    expect(e.defaultPrevented).toBe(true);
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(actives()).toEqual(["projets"]);
  });

  it("une colonne qui defile garde son evenement", () => {
    monter();
    const e = rouler(poserColonne(900, 500));
    expect(e.defaultPrevented).toBe(false);
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(actives()).toEqual(["ouverture"]);
  });

  it("une colonne au bout de son defilement laisse paginer dans ce sens", () => {
    monter();
    rouler(poserColonne(900, 500, 400));
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(actives()).toEqual(["projets"]);
  });
});

describe("le quota de l'historique ne tue pas la navigation (Safari)", () => {
  it("si replaceState leve, le verrou se leve et la navigation continue", () => {
    monter();
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {
      throw new DOMException("quota", "SecurityError");
    });
    molette();
    avancer(SORTIE_MS + VERROU_APRES_MS + 400);
    expect(actives()).toEqual(["projets"]);
    molette();
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(actives()).toEqual(["contact"]);
  });
});

describe("le filet de visibilite", () => {
  it("au retour de l'onglet, la cible en attente est activee tout de suite", () => {
    monter();
    molette();
    avancer(20);
    expect(actives()).toEqual([]);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(actives()).toEqual(["projets"]);
  });
});

/* La colonne de passage est l'AUTRE client de la garde generique de la section
   5.3 de la specification du parchemin : elle declare son defilement propre, et
   la garde ne la laisse tranquille que parce qu'elle le declare.

   Avant la generalisation, cette garde lisait la classe `.colonne-passage`, que
   la mise en forme rend indelebile. Elle lit desormais un attribut invisible,
   que plus rien ne tenait : mesure faite, l'attribut retire du `<nav>` reel
   laissait toute la suite verte, et une molette aux paliers etroits aurait
   rendu la main a la pagination au lieu de faire defiler la colonne.

   Constate sur le DOM RENDU, et non en cherchant une chaine dans le source. */
describe("la colonne declare son defilement propre (spec du parchemin, section 5.3)", () => {
  const reglages = {
    showProjects: true,
    showCvDownload: true,
    logoPath: null,
    availabilityStatus: "available",
    availabilityLabel: null,
  } as unknown as SiteSettingsDto;
  const infos = {
    name: "Bertrand",
    surname: "Fanuel",
    avatarPath: null,
  } as unknown as PersonalInfoDto;

  function monterColonne() {
    act(() => {
      racine.render(
        createElement(
          Fournisseur,
          { defaultLocale: "fr" },
          createElement(ColonnePassage, { reglages, infos }),
        ),
      );
    });
  }

  it("le nav rendu porte data-defilement-propre", () => {
    monterColonne();
    const nav = hote.querySelector("nav.colonne-passage");
    expect(nav, "aucune colonne de passage rendue : l assertion serait vide").not.toBeNull();
    expect(
      nav!.hasAttribute("data-defilement-propre"),
      "la colonne ne se declare plus proprietaire de son defilement : la pagination lui volerait molettes et gestes aux paliers etroits",
    ).toBe(true);
  });

  it("c'est l element qui defile qui le declare, et non un parent", () => {
    monterColonne();
    const proprietaires = [...hote.querySelectorAll("[data-defilement-propre]")];
    expect(proprietaires, "un seul proprietaire du defilement dans la colonne").toHaveLength(1);
    // La feuille pose `overflow-y: auto` sur `.colonne-passage` : la
    // declaration doit vivre sur CE noeud, la garde ne remontant que jusqu'au
    // plus proche porteur de l'attribut.
    expect(
      proprietaires[0]!.classList.contains("colonne-passage"),
      "la declaration a glisse sur un autre noeud que celui qui defile",
    ).toBe(true);
  });
});
