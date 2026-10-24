// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { I18nProvider } from "../i18n/i18n-context";
import {
  DUREE_SIGNAL_MS,
  FournisseurSectionActive,
  ParcoursPagine,
} from "@/components/parcours/parcours-pagine";
import { ColonnePassage } from "@/components/parcours/colonne-passage";
import type { PersonalInfoDto, SiteSettingsDto } from "@portfolio/shared-types";
import { SECTIONS } from "./sections";
import { VERROU_APRES_MS } from "./sequence";

/* Les cablages du conteneur sont ici exercices dans un DOM, la ou les tests
   de source ne font que compter des chaines : le sequencement (jamais deux
   sections actives, toujours un passage par le fond) et le signal (en butee,
   la molette et le balayage font clignoter l'entree de la section voisine
   dans la colonne, sans y aller). */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const IDS = ["ouverture", "projets", "contact"];
/** Reglages qui allument exactement les sections de `IDS`. */
const REGLAGES = {
  showProjects: true,
  showContact: true,
  showCvDownload: false,
  logoPath: null,
  availabilityStatus: "available",
  availabilityLabel: null,
} as unknown as SiteSettingsDto;
const INFOS = { name: "Bertrand", surname: "Fanuel", avatarPath: null } as unknown as PersonalInfoDto;
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
          createElement(ColonnePassage, { reglages: REGLAGES, infos: INFOS }),
          createElement(ParcoursPagine, { sections, enfants, pied: "PIED" }),
        ),
      ),
    );
  });
}

const actives = () =>
  [...document.querySelectorAll('.parcours-pagine > [data-active="true"]')].map((e) => e.id);
/** Les entrees de la colonne qui clignotent, par leur ancre. */
const signalees = () =>
  [...document.querySelectorAll('.entree-parcours[data-signal="true"]')].map((e) =>
    e.getAttribute("href"),
  );
const avancer = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const molette = (deltaY = 120) =>
  act(() => {
    window.dispatchEvent(
      new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true }),
    );
  });
/** La touche Page suivante pagine toujours : c'est elle qui sert ici de
 *  declencheur aux tests du sequencement. */
const pageSuivante = () =>
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "PageDown", bubbles: true, cancelable: true }),
    );
  });
/** jsdom expose `TouchEvent` mais pas `Touch` : un point est un simple objet. */
function balayer(dy: number) {
  const point = (y: number) => [{ clientX: 10, clientY: y } as unknown as Touch];
  act(() => {
    window.dispatchEvent(new TouchEvent("touchstart", { touches: point(300) }));
    window.dispatchEvent(new TouchEvent("touchend", { changedTouches: point(300 - dy) }));
  });
}

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

describe("en butee, la molette et le balayage signalent sans changer de section", () => {
  it("une molette en butee fait clignoter l entree suivante, la section reste", () => {
    monter();
    expect(signalees()).toEqual([]);
    molette();
    expect(signalees()).toEqual(["#projets"]);
    avancer(SORTIE_MS + VERROU_APRES_MS + 400);
    expect(actives()).toEqual(["ouverture"]);
  });

  it("le signal s eteint apres sa duree, que la feuille declare aussi", () => {
    monter();
    molette();
    avancer(DUREE_SIGNAL_MS - 1);
    expect(signalees()).toEqual(["#projets"]);
    avancer(1);
    expect(signalees()).toEqual([]);
  });

  it("une rafale sur la meme cible ne relance pas le signal", () => {
    monter();
    molette();
    // Plus long que la fenetre de l'accumulateur : le second cran franchit le
    // seuil de lui-meme, PENDANT le signal.
    avancer(1000);
    molette();
    expect(signalees()).toEqual(["#projets"]);
    avancer(DUREE_SIGNAL_MS - 1000);
    expect(signalees(), "le signal a ete relance et paraitrait fige").toEqual([]);
  });

  it("vers le haut, c est la section precedente qui clignote", () => {
    window.history.replaceState(null, "", "#projets");
    monter();
    avancer(50);
    expect(actives()).toEqual(["projets"]);
    molette(-120);
    expect(signalees()).toEqual(["#ouverture"]);
  });

  it("aux extremites, rien ne clignote", () => {
    monter();
    molette(-120);
    expect(signalees()).toEqual([]);
  });

  it("un balayage en butee fait clignoter l entree suivante, la section reste", () => {
    monter();
    balayer(200);
    expect(signalees()).toEqual(["#projets"]);
    avancer(SORTIE_MS + VERROU_APRES_MS + 400);
    expect(actives()).toEqual(["ouverture"]);
  });

  it("un balayage trop court ne signale rien", () => {
    monter();
    balayer(10);
    expect(signalees()).toEqual([]);
  });

  it("une molette hors butee laisse la section defiler, sans signal", () => {
    monter();
    const ouverture = document.getElementById("ouverture")!;
    for (const [k, v] of Object.entries({ scrollHeight: 900, clientHeight: 500, scrollTop: 0 })) {
      Object.defineProperty(ouverture, k, { value: v, configurable: true });
    }
    molette();
    expect(signalees()).toEqual([]);
  });

  it("un balayage parti hors butee ne signale rien, meme s il y finit", () => {
    monter();
    const ouverture = document.getElementById("ouverture")!;
    for (const [k, v] of Object.entries({ scrollHeight: 900, clientHeight: 500, scrollTop: 0 })) {
      Object.defineProperty(ouverture, k, { value: v, configurable: true });
    }
    balayer(200);
    expect(signalees()).toEqual([]);
  });

  it("le clavier, lui, pagine toujours", () => {
    monter();
    pageSuivante();
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(actives()).toEqual(["projets"]);
    expect(signalees()).toEqual([]);
  });
});

describe("la decouverte : une section s anime a sa premiere arrivee seulement", () => {
  const decouvertes = () =>
    [...document.querySelectorAll('.parcours-pagine > [data-decouverte="true"]')].map((e) => e.id);

  it("la section d arrivee est decouverte des le chargement, pas les autres", () => {
    monter();
    expect(decouvertes()).toEqual(["ouverture"]);
  });

  it("une section l est a sa premiere activation, et le reste", () => {
    monter();
    pageSuivante();
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(actives()).toEqual(["projets"]);
    expect(decouvertes()).toEqual(["ouverture", "projets"]);
  });

  it("revenir sur une section deja vue ne la redecouvre pas", () => {
    monter();
    const ouverture = document.getElementById("ouverture")!;
    pageSuivante();
    avancer(SORTIE_MS + VERROU_APRES_MS);
    // L'attribut pose a la premiere arrivee n'est ni retire ni repose : sans
    // changement d'attribut, l'animation CSS ne rejoue pas.
    const avant = ouverture.getAttribute("data-decouverte");
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "PageUp", bubbles: true, cancelable: true }));
    });
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(actives()).toEqual(["ouverture"]);
    expect(ouverture.getAttribute("data-decouverte")).toBe(avant);
  });

  it("une arrivee par fragment decouvre la section visee", () => {
    window.history.replaceState(null, "", "#contact");
    monter();
    avancer(50);
    expect(decouvertes()).toContain("contact");
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
    pageSuivante();
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

  it("la pagination est inerte pendant le changement, vive ensuite", () => {
    monter();
    pageSuivante();
    avancer(SORTIE_MS / 2);
    pageSuivante(); // verrouille : ignoree
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(actives()).toEqual(["projets"]);
    pageSuivante();
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(actives()).toEqual(["contact"]);
  });

  it("la molette ne signale rien pendant le changement", () => {
    monter();
    pageSuivante();
    avancer(SORTIE_MS / 2);
    molette();
    expect(signalees()).toEqual([]);
  });

  it("le focus suit la section d'arrivee", () => {
    monter();
    pageSuivante();
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

  it("une colonne qui ne defile pas laisse signaler (zone morte corrigee)", () => {
    monter();
    const e = rouler(poserColonne(500, 500));
    expect(e.defaultPrevented).toBe(true);
    expect(signalees()).toEqual(["#projets"]);
  });

  it("une colonne qui defile garde son evenement", () => {
    monter();
    const e = rouler(poserColonne(900, 500));
    expect(e.defaultPrevented).toBe(false);
    expect(signalees()).toEqual([]);
  });

  it("une colonne au bout de son defilement laisse signaler dans ce sens", () => {
    monter();
    rouler(poserColonne(900, 500, 400));
    expect(signalees()).toEqual(["#projets"]);
  });
});

describe("le quota de l'historique ne tue pas la navigation (Safari)", () => {
  it("si replaceState leve, le verrou se leve et la navigation continue", () => {
    monter();
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {
      throw new DOMException("quota", "SecurityError");
    });
    pageSuivante();
    avancer(SORTIE_MS + VERROU_APRES_MS + 400);
    expect(actives()).toEqual(["projets"]);
    pageSuivante();
    avancer(SORTIE_MS + VERROU_APRES_MS);
    expect(actives()).toEqual(["contact"]);
  });
});

describe("le filet de visibilite", () => {
  it("au retour de l'onglet, la cible en attente est activee tout de suite", () => {
    monter();
    pageSuivante();
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

  it("chaque entree de section porte son pictogramme, son nom et son infobulle", () => {
    monterColonne();
    const entrees = [...hote.querySelectorAll<HTMLAnchorElement>('a.entree-parcours[href^="#"]')];
    expect(entrees.map((a) => a.getAttribute("href"))).toEqual(["#ouverture", "#projets"]);
    for (const a of entrees) {
      const href = a.getAttribute("href")!;
      const picto = a.querySelector("svg.picto-section");
      expect(picto, `${href} sans pictogramme`).not.toBeNull();
      expect(picto!.getAttribute("aria-hidden")).toBe("true");
      expect(picto!.querySelector("path, rect, circle"), `${href} : pictogramme vide`).not.toBeNull();
      const nom = a.querySelector(".entree-nom")?.textContent ?? "";
      expect(nom, `${href} sans nom accessible`).not.toBe("");
      expect(a.title, `${href} : l infobulle ne dit pas le nom`).toBe(nom);
    }
  });

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
