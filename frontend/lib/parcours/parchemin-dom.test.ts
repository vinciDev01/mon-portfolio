// @vitest-environment jsdom
import { afterEach, describe, it, expect, beforeEach, vi } from "vitest";
import { createElement, useEffect, type ComponentType } from "react";
import type { ProjectDto } from "@portfolio/shared-types";
import { ParcheminProjet } from "@/components/parcours/parchemin-projet";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { I18nProvider } from "../i18n/i18n-context";
import {
  FournisseurSectionActive,
  ParcoursPagine,
  useChangerSurcouche,
} from "@/components/parcours/parcours-pagine";
import { SECTIONS } from "./sections";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Le fournisseur declare `children` en prop requise et `createElement` les
 *  passe en troisieme argument, que les surcharges de TypeScript ne comptent
 *  pas. Le cast ne masque rien : les enfants sont bien fournis. */
const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;

/** Bascule la surcouche depuis l'interieur de l'arbre, seul endroit d'ou le
 *  contexte est lisible. */
function Bascule({ ouverte }: { ouverte: boolean }) {
  const changer = useChangerSurcouche();
  // Un setter ne s'appelle pas pendant le rendu d'un autre composant : effet.
  useEffect(() => {
    changer(ouverte);
  }, [changer, ouverte]);
  return null;
}

let racine: ReturnType<typeof createRoot> | null = null;
let hote: HTMLDivElement;

beforeEach(() => {
  document.body.innerHTML = "";
  hote = document.createElement("div");
  document.body.append(hote);
  // jsdom n'implemente ni `scrollTo` ni `scrollBy` sur un element.
  Element.prototype.scrollTo = function () {};
  Element.prototype.scrollBy = function () {};
});

// Sans demontage, les ecouteurs de `window` d'un test survivraient au suivant.
afterEach(() => {
  if (racine) act(() => racine!.unmount());
  racine = null;
  hote.remove();
  document.body.innerHTML = "";
  window.history.replaceState(null, "", "/");
  // Les `mockRestore` en derniere ligne d'un test sont SAUTES des qu'une
  // assertion echoue avant eux, et `vi.spyOn` rend alors le meme espion, son
  // compteur compris, au test suivant : une mutation d'un seul site faisait
  // echouer un test voisin pour un appel herite.
  vi.restoreAllMocks();
  deposerClose?.();
  deposerClose = null;
});

function monter(ids: string[], ouverte = false) {
  const sections = SECTIONS.filter((s) => ids.includes(s.id));
  const enfants: Record<string, string> = {};
  for (const id of ids) enfants[id] = `CONTENU-${id}`;
  racine = createRoot(hote);
  act(() => {
    racine!.render(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(
          FournisseurSectionActive as ComponentType<{ initial: string | null }>,
          { initial: sections[0]?.id ?? null },
          createElement(Bascule, { ouverte }),
          createElement(ParcoursPagine, { sections, enfants, pied: "PIED" }),
        ),
      ),
    );
  });
}

function actif(): string | null {
  return hote.querySelector('[data-active="true"]')?.id ?? null;
}

describe("la garde est generique (spec section 5.3)", () => {
  it("sort pour tout element qui se declare proprietaire de son defilement", () => {
    monter(["ouverture", "projets"]);
    const prop = document.createElement("div");
    prop.setAttribute("data-defilement-propre", "");
    // Un element qui peut reellement defiler vers le bas.
    Object.defineProperties(prop, {
      scrollTop: { value: 0, writable: true },
      scrollHeight: { value: 1000, configurable: true },
      clientHeight: { value: 400, configurable: true },
    });
    hote.append(prop);
    act(() => {
      prop.dispatchEvent(
        new WheelEvent("wheel", { deltaY: 300, bubbles: true, cancelable: true }),
      );
    });
    expect(actif(), "la pagination a vole le defilement du proprietaire")
      .toBe("ouverture");
  });

  it("ne sort pas pour un proprietaire deja en butee dans ce sens", () => {
    monter(["ouverture", "projets"]);
    const prop = document.createElement("div");
    prop.setAttribute("data-defilement-propre", "");
    Object.defineProperties(prop, {
      scrollTop: { value: 600, writable: true },
      scrollHeight: { value: 1000, configurable: true },
      clientHeight: { value: 400, configurable: true },
    });
    hote.append(prop);
    act(() => {
      prop.dispatchEvent(
        new WheelEvent("wheel", { deltaY: 300, bubbles: true, cancelable: true }),
      );
    });
    // En butee vers le bas : la pagination reprend la main.
    expect(actif()).not.toBe("ouverture");
  });
});

describe("la pagination se suspend sous une surcouche (spec section 5.2)", () => {
  it("une molette ne change pas de section quand la surcouche est ouverte", () => {
    monter(["ouverture", "projets"], true);
    act(() => {
      window.dispatchEvent(
        new WheelEvent("wheel", { deltaY: 300, bubbles: true, cancelable: true }),
      );
    });
    expect(actif()).toBe("ouverture");
  });

  it("une touche de pagination ne change pas de section non plus", () => {
    monter(["ouverture", "projets"], true);
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "PageDown", bubbles: true, cancelable: true }),
      );
    });
    expect(actif()).toBe("ouverture");
  });

  // Spec section 5.4 : deux consommateurs du meme `popstate`, et celui du
  // parchemin doit primer sur celui du conteneur.
  it("un popstate ferme la surcouche et NE change PAS de section", () => {
    monter(["ouverture", "projets"], true);
    const avant = actif();
    // Le Retour du navigateur ramene a un fragment different de la section
    // active : sans cela `aller` ne ferait rien meme sans la garde, et le test
    // serait vide.
    window.history.replaceState(null, "", "#projets");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(actif(), "la section a change alors qu'une surcouche etait ouverte")
      .toBe(avant);
  });
});

/* ------------------------------------------------------------------
   Le parchemin lui-meme (spec sections 4, 5 et 6).

   Fait MESURE et non suppose : jsdom n'implemente pas `showModal` et ignore
   `inert`. Les quatre comportements modaux (capture du focus, inertie du reste
   de la page, voile natif, Echap gere par le navigateur) sont donc HORS de
   portee d'ici, et aucun test ci-dessous ne pretend les verifier. C'est le
   chemin de repli, celui qui pose l'attribut `open`, qui rend tout le reste
   observable.
   ------------------------------------------------------------------ */

function fabrique(p: Partial<ProjectDto>): ProjectDto {
  return {
    id: "x", name: "Projet", description: null,
    photo1Path: null, photo2Path: null, demoUrl: null, targetAudience: null,
    startDate: null, endDate: null, technologies: [], collaborators: [],
    sortOrder: 0, ...p,
  } as ProjectDto;
}

const projetNu = () => fabrique({ name: "Projet nu" });

const projetComplet = () => fabrique({
  name: "Projet complet",
  description: "Une description.",
  targetAudience: "Les gens",
  photo1Path: "projects/a.webp",
  photo2Path: "projects/b.webp",
  demoUrl: "https://exemple.test",
  startDate: "2024-03-01",
  endDate: "2025-01-01",
  // DEUX technologies, et non une : avec une seule, le point median n'est
  // jamais rendu et toute assertion sur le separateur serait vide.
  technologies: [
    { id: "t1", label: "Angular", logoPath: null, sortOrder: 0 },
    { id: "t2", label: "NestJS", logoPath: null, sortOrder: 1 },
  ],
  collaborators: [
    { id: "c1", firstName: "Ada", lastName: "Lovelace", email: null,
      linkedinUrl: "https://linkedin.test/in/ada", sortOrder: 0 },
  ],
});

/** Un debut sans terme : la seule forme qui execute la branche `enCours`.
 *  Aucune fabrique ne l'avait, donc la mention n'etait jamais rendue. */
const projetEnCours = () => fabrique({
  name: "Projet en cours",
  startDate: "2024-03-01",
  endDate: null,
});

/** Un chemin de photo BLANC a cote d'un chemin reel. Le bloc « photos » parait,
 *  puisque l'une des deux est renseignee, et le blanc ne doit rien rendre : une
 *  `<img>` sur un chemin blanc est une image rompue. Meme famille que les trois
 *  `photo1Path: null` qui avaient rendu un bouton inerte sans qu'un test ne
 *  bouge. */
const projetPhotoBlanche = () => fabrique({
  name: "Projet photo blanche",
  photo1Path: "   ",
  photo2Path: "projects/b.webp",
});

/** Grace d'abord dans le tableau mais `sortOrder` plus grand : le tri doit
 *  donc remonter Ada, et Grace n'a pas de lien. */
const projetAvecCredits = () => fabrique({
  name: "Projet credite",
  collaborators: [
    { id: "c2", firstName: "Grace", lastName: "Hopper", email: null,
      linkedinUrl: null, sortOrder: 1 },
    { id: "c1", firstName: "Ada", lastName: "Lovelace", email: null,
      linkedinUrl: "https://linkedin.test/in/ada", sortOrder: 0 },
  ],
});

/** Le parchemin SEUL, pour les tests de rendu. Le drapeau n'est pas observable
 *  ainsi : hors du fournisseur de `ParcoursPagine`, `useChangerSurcouche` rend
 *  la fonction VIDE du contexte par defaut, sans erreur ni avertissement. Les
 *  tests du drapeau passent donc par `monterAvecConteneur`. */
function monterParchemin(p: ProjectDto): HTMLDialogElement {
  racine = createRoot(hote);
  act(() => {
    racine!.render(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(ParcheminProjet, { projet: p, surFermeture: () => {} }),
      ),
    );
  });
  const d = hote.querySelector("dialog");
  if (!d) throw new Error("aucun <dialog> rendu");
  return d as HTMLDialogElement;
}

/** Le bouton de fermeture, et l'absence NOMMEE s'il manque : sans ce pas, les
 *  trois tests qui le cliquent leveraient un `TypeError` sur `null.click()`
 *  sans dire de quoi ils parlaient. Meme famille que le `toMatch(null)` du
 *  test des bandes. */
function boutonFermer(racineDom: ParentNode): HTMLButtonElement {
  const b = racineDom.querySelector("button[data-fermer]");
  expect(b, "aucun bouton `data-fermer` dans le parchemin").not.toBeNull();
  return b as HTMLButtonElement;
}

/**
 * Pose un `close` sur le prototype, que jsdom n'implemente pas plus que
 * `showModal`, et releve l'etat du noeud a CHAQUE appel : `connecte/ouvert`.
 * C'est `close` qui rend le focus au declencheur, et le navigateur ne peut le
 * faire que sur un noeud encore dans le document. Le focus lui-meme n'est pas
 * verifiable ici : jsdom ne gere ni couche superieure, ni restitution.
 */
function espionnerClose(journal?: string[]): string[] {
  const appels: string[] = [];
  const proto = HTMLDialogElement.prototype as unknown as { close?: () => void };
  const avait = Object.prototype.hasOwnProperty.call(proto, "close");
  proto.close = function (this: HTMLDialogElement) {
    appels.push(`${this.isConnected}/${this.hasAttribute("open")}`);
    journal?.push("close");
    this.removeAttribute("open");
  };
  // La depose est confiee a `afterEach` et non a la derniere ligne du test :
  // mesure faite, un `restaurer()` en fin de corps est SAUTE des qu'une
  // assertion echoue avant lui, et le test « jsdom n'a pas close » trouvait
  // alors une fonction heritee du test precedent.
  deposerClose = () => {
    if (!avait) delete proto.close;
  };
  return appels;
}

let deposerClose: (() => void) | null = null;

/**
 * Le parchemin seul, mais avec un `surFermeture` qui DEMONTE pour de bon, comme
 * le fera la section des projets. Indispensable a l'assertion de connexion :
 * avec un `surFermeture` vide, le noeud reste dans le document quoi qu'il
 * arrive, et « close() sur un noeud connecte » serait vrai sans rien prouver.
 */
function monterParcheminFermable(p: ProjectDto): HTMLDialogElement {
  racine = createRoot(hote);
  const rendre = (projet: ProjectDto | null) => {
    racine!.render(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(ParcheminProjet, { projet, surFermeture: () => rendre(null) }),
      ),
    );
  };
  act(() => rendre(p));
  const d = hote.querySelector("dialog");
  if (!d) throw new Error("aucun <dialog> rendu");
  return d as HTMLDialogElement;
}

const IDS_PARCOURS = ["ouverture", "projets", "contact"];

function sectionsEt(ids: string[]) {
  const sections = SECTIONS.filter((s) => ids.includes(s.id));
  const enfants: Record<string, string> = {};
  for (const id of ids) enfants[id] = `CONTENU-${id}`;
  return { sections, enfants };
}

/**
 * Le conteneur pagine ET le parchemin sous le MEME fournisseur : c'est la
 * seule facon de voir le drapeau. `surFermeture` re-rend l'arbre avec un
 * projet nul, comme le fera la section des projets.
 */
function rendreAvecConteneur(projet: ProjectDto | null) {
  const { sections, enfants } = sectionsEt(IDS_PARCOURS);
  racine!.render(
    createElement(
      Fournisseur,
      { defaultLocale: "fr" },
      createElement(
        FournisseurSectionActive as ComponentType<{ initial: string | null }>,
        { initial: sections[0]?.id ?? null },
        createElement(ParcoursPagine, { sections, enfants, pied: "PIED" }),
        createElement(ParcheminProjet, {
          projet,
          surFermeture: () => rendreAvecConteneur(null),
        }),
      ),
    ),
  );
}

function monterAvecConteneur(projet: ProjectDto | null) {
  racine = createRoot(hote);
  act(() => rendreAvecConteneur(projet));
}

/** Comme `monter`, mais RE-RENDABLE : fermer la surcouche au milieu d'un geste
 *  est le seul moyen d'isoler la garde du `touchstart` de celle du `touchend`,
 *  qui protegent le meme geste. */
function rendreBascule(ids: string[], ouverte: boolean) {
  const { sections, enfants } = sectionsEt(ids);
  racine!.render(
    createElement(
      Fournisseur,
      { defaultLocale: "fr" },
      createElement(
        FournisseurSectionActive as ComponentType<{ initial: string | null }>,
        { initial: sections[0]?.id ?? null },
        createElement(Bascule, { ouverte }),
        createElement(ParcoursPagine, { sections, enfants, pied: "PIED" }),
      ),
    ),
  );
}

let idsCourants: string[] = IDS_PARCOURS;

function monterBascule(ids: string[], ouverte: boolean) {
  racine = createRoot(hote);
  idsCourants = ids;
  act(() => rendreBascule(ids, ouverte));
}

function rebasculer(ouverte: boolean) {
  act(() => rendreBascule(idsCourants, ouverte));
}

/** jsdom expose `TouchEvent` mais pas `Touch` : un point est un simple objet,
 *  et c'est tout ce que les gestionnaires lisent (clientX, clientY). */
function tactile(type: "touchstart" | "touchend", x: number, y: number): TouchEvent {
  const point = { clientX: x, clientY: y } as unknown as Touch;
  const init: TouchEventInit = { bubbles: true, cancelable: true };
  if (type === "touchstart") init.touches = [point];
  else init.changedTouches = [point];
  return new TouchEvent(type, init);
}

const molette = () =>
  act(() => {
    window.dispatchEvent(
      new WheelEvent("wheel", { deltaY: 300, bubbles: true, cancelable: true }),
    );
  });

/** Laisse passer la sortie de section (180 ms de repli, jsdom ne calculant
 *  aucune transition), le verrou, et le `popstate` que jsdom emet en tache
 *  separee apres `history.back()`. */
const laisserRetomber = () => act(async () => {
  await new Promise((r) => setTimeout(r, 400));
});

describe("le parchemin (spec sections 4, 5 et 6)", () => {
  // Spec sections 1 et 5.1 : `showModal` est absente sous jsdom, et c'est le
  // repli par l'attribut `open` qui rend tout le reste observable.
  it("s ouvre par l attribut open quand showModal manque", () => {
    expect(typeof HTMLDialogElement.prototype.showModal,
      "jsdom a gagne showModal : adapter ce test").not.toBe("function");
    const d = monterParchemin(projetComplet());
    expect(d.hasAttribute("open")).toBe(true);
  });

  it("un projet nul ne rend aucun dialogue", () => {
    racine = createRoot(hote);
    act(() => {
      racine!.render(
        createElement(
          Fournisseur,
          { defaultLocale: "fr" },
          createElement(ParcheminProjet, { projet: null, surFermeture: () => {} }),
        ),
      );
    });
    expect(hote.querySelector("dialog")).toBeNull();
  });

  it("porte un nom accessible par le titre du projet", () => {
    const d = monterParchemin(projetComplet());
    const lie = d.getAttribute("aria-labelledby");
    expect(lie).toBeTruthy();
    expect(d.querySelector(`#${lie}`)?.textContent).toContain("Projet complet");
  });

  it("le bouton de fermeture a un nom accessible explicite", () => {
    const d = monterParchemin(projetComplet());
    const b = boutonFermer(d);
    expect(b?.getAttribute("aria-label") ?? b?.textContent).toMatch(/\S{4,}/);
  });

  // Spec section 6 : le bouton de fermeture porte un nom accessible EXPLICITE,
  // et non une croix seule. L'assertion precedente court-circuite par `??` des
  // qu'un `aria-label` existe, donc le texte VISIBLE n'y est jamais regarde :
  // les deux choses se constatent separement.
  it("le bouton de fermeture porte un texte visible, et non une croix seule", () => {
    const d = monterParchemin(projetComplet());
    const visible = (boutonFermer(d).textContent ?? "").trim();
    expect(visible,
      "le bouton n a pas de libelle visible : « cliquer sur Fermer » ne designerait rien")
      .toMatch(/\S{4,}/);
  });

  it("le nom accessible du bouton CONTIENT son texte visible (WCAG 2.5.3)", () => {
    const d = monterParchemin(projetComplet());
    const b = boutonFermer(d);
    const visible = (b.textContent ?? "").trim();
    // Sans `aria-label`, le nom accessible EST le texte visible : la regle est
    // tenue d'office, et le test precedent garde le libelle.
    const nom = b.getAttribute("aria-label") ?? visible;
    expect(nom, "le nom accessible ne contient pas le texte visible")
      .toContain(visible);
  });

  it("le corps se declare proprietaire de son defilement", () => {
    const d = monterParchemin(projetComplet());
    const corps = d.querySelector("[data-defilement-propre]");
    expect(corps).not.toBeNull();
    expect(corps!.classList.contains("parchemin-corps")).toBe(true);
  });

  // Spec section 4, la degradation champ par champ, cote rendu : chaque bloc
  // disparait quand sa donnee manque, sans espace ni titre vide. Les libelles
  // sont repris du dictionnaire
  // FRANCAIS, accents compris : « Public concerne » sans accent ne figure dans
  // aucune langue et l'assertion serait vraie meme bloc rendu.
  it("un projet depouille ne rend aucun bloc vide", () => {
    const d = monterParchemin(projetNu());
    expect(d.querySelectorAll("img")).toHaveLength(0);
    expect(d.textContent).not.toContain("Public concerné");
    expect(d.textContent).not.toContain("Collaborateurs");
    expect(d.textContent).not.toContain("Technologies");
    expect(d.querySelectorAll("a")).toHaveLength(0);
  });

  it("un projet complet rend les six blocs de blocsPresents", () => {
    const d = monterParchemin(projetComplet());
    expect(d.querySelectorAll("img")).toHaveLength(2);
    expect(d.textContent).toContain("Une description.");
    expect(d.textContent).toContain("Public concerné");
    expect(d.textContent).toContain("Les gens");
    expect(d.textContent).toContain("Technologies");
    expect(d.textContent).toContain("Angular");
    expect(d.textContent).toContain("Collaborateurs");
    expect(d.querySelector('a[href="https://exemple.test"]')).not.toBeNull();
  });

  // Spec section 4, bloc 2 : les dates propres du projet, formatees en UTC et
  // jamais depuis l'horloge. Ce bloc n'etait tenu par aucun test, et trois
  // mutations (paragraphe retire, mention retiree, `{true &&`) passaient.
  it("rend la ligne de dates du projet, formatee en UTC", () => {
    const d = monterParchemin(projetComplet());
    const ligne = d.querySelector("p.meta");
    expect(ligne, "aucun paragraphe de dates : le bloc 2 a disparu").not.toBeNull();
    // Le fuseau de vitest est `America/Los_Angeles` : 2024-03-01T00:00Z y
    // tombe le 29 fevrier, donc une lecture hors UTC dirait « fevrier 2024 ».
    expect(ligne!.textContent).toContain("de mars 2024 à janvier 2025");
  });

  it("un projet sans aucune date ne rend PAS de paragraphe de dates vide", () => {
    const d = monterParchemin(projetNu());
    // `ligneDateProjet` rend `null` : le bloc se cache de lui-meme. Un
    // `<p class="meta">` vide serait un bloc vide a cote du test qui les
    // interdit, et lui ne le verrait pas.
    expect(d.querySelector("p.meta"),
      "un paragraphe de dates VIDE est rendu pour un projet sans date")
      .toBeNull();
  });

  it("la mention En cours accompagne un debut sans terme, et lui seul", () => {
    const enCours = monterParchemin(projetEnCours());
    expect(enCours.querySelector("p.meta")?.textContent)
      .toContain("en mars 2024");
    expect(enCours.textContent,
      "un projet sans terme n est pas annonce en cours").toContain("En cours");
    // Demonte, puis remonte : l'autre moitie de la regle.
    act(() => racine!.unmount());
    racine = null;
    const termine = monterParchemin(projetComplet());
    expect(termine.textContent,
      "un projet termine est annonce « En cours »").not.toContain("En cours");
  });

  it("un collaborateur sans LinkedIn est nomme sans lien", () => {
    const d = monterParchemin(projetAvecCredits());
    const li = [...d.querySelectorAll("li")];
    const sansLien = li.find((e) => e.textContent?.includes("Grace Hopper"));
    expect(sansLien, "Grace n est pas nommee du tout").toBeDefined();
    expect(sansLien?.querySelector("a")).toBeNull();
    const avecLien = li.find((e) => e.textContent?.includes("Ada Lovelace"));
    expect(avecLien?.querySelector("a")?.getAttribute("href"))
      .toBe("https://linkedin.test/in/ada");
  });

  it("chaque lien LinkedIn porte le nom de la personne, pas LinkedIn seul", () => {
    const d = monterParchemin(projetAvecCredits());
    const a = d.querySelector("li a");
    const nom = a?.getAttribute("aria-label") ?? a?.textContent ?? "";
    expect(nom).toContain("Ada Lovelace");
  });

  it("les liens externes portent rel noopener noreferrer", () => {
    const d = monterParchemin(projetComplet());
    const liens = [...d.querySelectorAll('a[target="_blank"]')];
    expect(liens.length, "aucun lien externe : l assertion serait vide")
      .toBeGreaterThan(0);
    for (const a of liens) {
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("les photos portent un alt vide, le nom etant lu a cote", () => {
    const d = monterParchemin(projetComplet());
    const images = [...d.querySelectorAll("img")];
    expect(images.length, "aucune image : l assertion serait vide").toBeGreaterThan(0);
    for (const img of images) {
      expect(img.getAttribute("alt")).toBe("");
    }
  });

  it("un chemin de photo BLANC ne rend pas d image rompue", () => {
    const d = monterParchemin(projetPhotoBlanche());
    const images = [...d.querySelectorAll("img")];
    expect(images,
      "le chemin blanc est rendu comme une seconde image, donc rompue")
      .toHaveLength(1);
    expect(images[0]!.getAttribute("src") ?? "").toContain("b.webp");
  });

  it("les blancs autour d un chemin de photo sont rognes avant le src", () => {
    const d = monterParchemin(fabrique({
      name: "Projet photo espacee",
      photo1Path: "  projects/a.webp  ",
    }));
    const src = d.querySelector("img")?.getAttribute("src") ?? "";
    expect(src, "aucune image rendue : l assertion serait vide").toContain("a.webp");
    expect(src, "les blancs du chemin partent dans l URL de l image")
      .not.toMatch(/%20|\s/);
  });

  it("les technologies sont separees par un point median, comme dans le journal", () => {
    const projet = projetComplet();
    // Sans deux technologies au moins, aucun separateur n'est rendu et
    // l'assertion serait vide par construction.
    expect(projet.technologies.length,
      "la fixture ne porte pas deux technologies : aucun separateur a observer")
      .toBeGreaterThan(1);
    const d = monterParchemin(projet);
    const titre = [...d.querySelectorAll("h3")]
      .find((h) => h.textContent === "Technologies");
    expect(titre, "aucun titre Technologies : l assertion serait vide").toBeDefined();
    expect(titre!.nextElementSibling?.textContent,
      "les technologies ne sont plus separees par un point median")
      .toBe("Angular · NestJS");
  });

  it("un demoUrl non https ne rend ni bloc ni lien", () => {
    const d = monterParchemin(fabrique({
      name: "Projet douteux",
      demoUrl: "javascript:alert(1)",
    }));
    expect(d.querySelectorAll("a"),
      "un javascript: du backoffice est rendu comme un lien vivant").toHaveLength(0);
    expect(d.textContent,
      "le titre du bloc demonstration parait sans lien dessous")
      .not.toContain("Voir la démo");
  });

  it("le lien de demonstration rendu est EXACTEMENT celui que la regle autorise", () => {
    // Le composant doit lire `lienDemo` et non le champ brut : sinon un
    // `href` encadre de blancs partirait dans la page.
    const d = monterParchemin(fabrique({
      name: "Projet espace",
      demoUrl: "  https://exemple.test/demo  ",
    }));
    const lien = d.querySelector('a[target="_blank"]');
    expect(lien, "le bloc demonstration n est pas rendu").not.toBeNull();
    expect(lien!.getAttribute("href"),
      "le champ brut est injecte dans le href au lieu du lien valide")
      .toBe("https://exemple.test/demo");
  });

  it("aucune classe de mouvement dans le parchemin rendu", () => {
    const d = monterParchemin(projetComplet());
    for (const el of [d, ...d.querySelectorAll("*")]) {
      for (const classe of el.classList) {
        expect(classe, `classe de mouvement rendue : ${classe}`)
          .not.toMatch(/^(transition|animate|duration|ease|fade|slide)-/);
      }
    }
  });

  // Spec section 5.4 : fermer doit CONSOMMER l'entree posee a l'ouverture,
  // sans quoi un Retour plus tard fermerait un parchemin deja ferme.
  it("fermer consomme l entree d historique", () => {
    const back = vi.spyOn(history, "back").mockImplementation(() => {});
    const d = monterParchemin(projetComplet());
    act(() => {
      boutonFermer(d).click();
    });
    expect(back, "l entree resterait et un Retour fermerait un parchemin deja ferme")
      .toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  it("Echap passe par le meme chemin de fermeture, entree comprise", () => {
    const back = vi.spyOn(history, "back").mockImplementation(() => {});
    const d = monterParchemin(projetComplet());
    const evenement = new Event("cancel", { cancelable: true, bubbles: true });
    act(() => {
      d.dispatchEvent(evenement);
    });
    expect(evenement.defaultPrevented,
      "sans preventDefault le dialogue se ferme seul et l entree reste").toBe(true);
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  it("le clic hors de la feuille ferme, celui sur la feuille ne ferme pas", () => {
    const back = vi.spyOn(history, "back").mockImplementation(() => {});
    const d = monterParchemin(projetComplet());
    act(() => {
      (d.querySelector(".parchemin-corps") as HTMLElement).dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });
    expect(back, "un clic DANS la feuille a ferme le parchemin").not.toHaveBeenCalled();
    act(() => {
      d.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  // Spec section 6, exigence 3 : sans `close()`, le dialogue quitte l'arbre
  // ENCORE OUVERT, les etapes de `close` ne sont pas jouees et le focus ne
  // revient pas au declencheur.
  it("la fermeture par le bouton joue close() sur un noeud encore connecte et ouvert", () => {
    const appels = espionnerClose();
    vi.spyOn(history, "back").mockImplementation(() => {});
    // Monteur DEMONTANT : la fermeture retire vraiment le noeud, donc un
    // `close()` joue trop tard le trouverait detache.
    const d = monterParcheminFermable(projetComplet());
    act(() => {
      boutonFermer(d).click();
    });
    expect(hote.querySelector("dialog"), "le parchemin n a pas ete demonte").toBeNull();
    // `true/true` : au moment de l'appel le noeud etait dans le document et
    // encore ouvert. Un seul appel, et pas zero.
    expect(appels,
      "close() n est pas joue sur un noeud connecte et ouvert : le focus ne revient pas au declencheur")
      .toEqual(["true/true"]);
  });

  it("la fermeture par popstate joue close() elle aussi", () => {
    const appels = espionnerClose();
    monterParcheminFermable(projetComplet());
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(hote.querySelector("dialog"), "le parchemin n a pas ete demonte").toBeNull();
    expect(appels, "le Retour du navigateur abandonne un dialogue ouvert")
      .toEqual(["true/true"]);
  });

  it("sans close() dans l environnement, la fermeture ne leve pas", () => {
    // jsdom n'a pas `close` : c'est le cas par defaut de tout ce fichier. Le
    // repli retire l'attribut, et rien ne doit lever.
    expect(typeof HTMLDialogElement.prototype.close,
      "jsdom a gagne close : adapter ce test").not.toBe("function");
    vi.spyOn(history, "back").mockImplementation(() => {});
    const d = monterParchemin(projetComplet());
    act(() => {
      boutonFermer(d).click();
    });
    expect(d.hasAttribute("open"),
      "le dialogue reste ouvert alors qu il vient d etre ferme").toBe(false);
  });

  // Symetrique du test du bouton, et mesure a l'origine de son ajout : sans
  // lui, retirer l'appel explicite de `surRetour` ne faisait echouer AUCUN
  // test, le nettoyage de mise en page couvrant deja ce chemin quand
  // l'appelant demonte. Ici `surFermeture` ne demonte RIEN, donc aucun
  // nettoyage ne tourne et seul l'appel explicite peut refermer.
  it("un popstate referme le dialogue meme si l appelant ne demonte pas", () => {
    const d = monterParchemin(projetComplet());
    expect(d.hasAttribute("open")).toBe(true);
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(d.hasAttribute("open"),
      "le Retour laisse le dialogue ouvert, et son entree vient d etre consommee")
      .toBe(false);
  });

  it("l ouverture pose UNE SEULE entree d historique", () => {
    const push = vi.spyOn(history, "pushState");
    monterParchemin(projetComplet());
    // Une de plus et il faudrait deux Retour pour quitter la section ensuite,
    // la premiere fermant le parchemin et la seconde ne bougeant pas.
    expect(push, "l ouverture n empile pas exactement une entree")
      .toHaveBeenCalledTimes(1);
    push.mockRestore();
  });

  // L'ORDRE des trois etapes, et non seulement le fait qu'elles arrivent.
  it("la fermeture joue close(), consomme l entree, PUIS previent l appelant", () => {
    const ordre: string[] = [];
    espionnerClose(ordre);
    const back = vi.spyOn(history, "back").mockImplementation(() => {
      ordre.push("back");
    });
    racine = createRoot(hote);
    act(() => {
      racine!.render(
        createElement(
          Fournisseur,
          { defaultLocale: "fr" },
          createElement(ParcheminProjet, {
            projet: projetComplet(),
            surFermeture: () => ordre.push("fermeture"),
          }),
        ),
      );
    });
    act(() => {
      boutonFermer(hote).click();
    });
    // `surFermeture` demonte le parchemin : appelee d'abord, elle retirerait
    // l'ecouteur avant que `back` n'ait rien demande. Et `close` doit preceder
    // les deux : un appelant usant de `flushSync` detacherait le noeud des
    // `surFermeture`, et un `close()` tardif redeviendrait du code mort.
    expect(ordre, "l ordre de fermeture est inverse")
      .toEqual(["close", "back", "fermeture"]);
    back.mockRestore();
  });

  it("un popstate ferme le parchemin", () => {
    const fermetures: number[] = [];
    racine = createRoot(hote);
    act(() => {
      racine!.render(
        createElement(
          Fournisseur,
          { defaultLocale: "fr" },
          createElement(ParcheminProjet, {
            projet: projetComplet(),
            surFermeture: () => fermetures.push(1),
          }),
        ),
      );
    });
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(fermetures, "le Retour du navigateur ne ferme pas le parchemin")
      .toHaveLength(1);
  });
});

/* Les quatre voies de FERMETURE passent par `fermer` ou par `surRetour`, mais
   trois voies de DISPARITION ne passaient par aucune des deux, et le `<dialog>`
   quittait l'arbre en portant encore `open` : pas de focus rendu au
   declencheur, ce que la spec section 6, exigence 3, demande. C'est le
   nettoyage de l'effet de MISE EN PAGE qui les couvre : mesure, lui seul tourne
   avant que React detache les noeuds hotes. */
describe("close() sur les voies de DISPARITION", () => {
  /** Un rendu pilote de l'EXTERIEUR, sans passer par le chemin de fermeture du
   *  parchemin : c'est exactement ce qu'un appelant peut ecrire, et rien dans
   *  le composant ne l'en empeche. */
  function rendreur(): (p: ProjectDto | null) => void {
    racine = createRoot(hote);
    return (p) => {
      racine!.render(
        createElement(
          Fournisseur,
          { defaultLocale: "fr" },
          createElement(ParcheminProjet, { projet: p, surFermeture: () => {} }),
        ),
      );
    };
  }

  it("un changement de projet referme le dialogue SORTANT", () => {
    const appels = espionnerClose();
    const rendre = rendreur();
    act(() => rendre(fabrique({ id: "a", name: "Projet A" })));
    const sortant = hote.querySelector("dialog") as HTMLDialogElement;
    act(() => rendre(fabrique({ id: "b", name: "Projet B" })));
    expect(appels,
      "le dialogue sortant quitte l arbre encore ouvert : pas de focus rendu")
      .toEqual(["true/true"]);
    expect(sortant.hasAttribute("open")).toBe(false);
    // Et l'entrant est bien ouvert, lui : la remontee par cle a fait son
    // travail, le repli n'a pas ferme le mauvais noeud.
    const entrant = hote.querySelector("dialog") as HTMLDialogElement;
    expect(entrant).not.toBe(sortant);
    expect(entrant.hasAttribute("open")).toBe(true);
  });

  it("un projet remis a nul HORS du chemin de fermeture referme quand meme", () => {
    const appels = espionnerClose();
    const rendre = rendreur();
    act(() => rendre(fabrique({ id: "a", name: "Projet A" })));
    const d = hote.querySelector("dialog") as HTMLDialogElement;
    act(() => rendre(null));
    expect(hote.querySelector("dialog")).toBeNull();
    expect(appels,
      "l appelant peut faire disparaitre le parchemin en l abandonnant ouvert")
      .toEqual(["true/true"]);
    expect(d.hasAttribute("open")).toBe(false);
  });

  it("le demontage de la racine referme quand meme", () => {
    const appels = espionnerClose();
    const rendre = rendreur();
    act(() => rendre(fabrique({ id: "a", name: "Projet A" })));
    const d = hote.querySelector("dialog") as HTMLDialogElement;
    act(() => racine!.unmount());
    racine = null;
    expect(appels, "la page qui s en va abandonne un dialogue ouvert")
      .toEqual(["true/true"]);
    expect(d.hasAttribute("open")).toBe(false);
  });
});

/* Le contrat de structure que `globals.css` ecrit en commentaire au-dessus des
   regles du parchemin : la feuille est enfant DIRECT du dialogue, et elle a
   exactement trois enfants, bande, corps, bande. La grille `auto 1fr auto` en
   depend, et c'est ce `1fr` qui borne le corps et le fait defiler seul.
   Constate sur le DOM rendu, et non en cherchant une chaine dans le source. */
describe("le contrat de structure de la feuille", () => {
  it("la feuille est enfant DIRECT du dialogue", () => {
    const d = monterParchemin(projetComplet());
    const feuille = d.querySelector(".parchemin-feuille");
    expect(feuille).not.toBeNull();
    expect(feuille!.parentElement,
      "un conteneur intermediaire casse `max-height: inherit`").toBe(d);
  });

  it("la feuille a exactement trois enfants : bande, corps, bande", () => {
    const d = monterParchemin(projetComplet());
    const enfants = [...d.querySelector(".parchemin-feuille")!.children];
    // `className` d'un SVG est un `SVGAnimatedString` : on lit l'attribut.
    expect(enfants.map((e) => e.getAttribute("class")),
      "la grille `auto 1fr auto` ne borne plus le corps").toEqual([
      "parchemin-bande", "parchemin-corps", "parchemin-bande",
    ]);
    expect(enfants[0]!.tagName.toLowerCase()).toBe("svg");
    expect(enfants[2]!.tagName.toLowerCase()).toBe("svg");
  });

  it("les credits vivent DANS le corps, pas a cote", () => {
    const d = monterParchemin(projetAvecCredits());
    // TOUTES les listes, et non la premiere : une seconde liste posee a cote du
    // corps passerait inapercue si l'on ne regardait que celle du document.
    const listes = [...d.querySelectorAll(".parchemin-credits")];
    expect(listes).toHaveLength(1);
    for (const liste of listes) {
      expect(liste.closest(".parchemin-corps"),
        "les credits sont sortis du corps et deviendraient une rangee de grille")
        .not.toBeNull();
    }
  });

  it("la bande du bas est le trace du haut retourne par un transform d ATTRIBUT", () => {
    const d = monterParchemin(projetComplet());
    const traces = [...d.querySelectorAll(".parchemin-bande")].map((b) =>
      b.querySelector("path"),
    );
    expect(traces).toHaveLength(2);
    expect(traces[0]!.getAttribute("d")).toBe(traces[1]!.getAttribute("d"));
    expect(traces[0]!.getAttribute("transform")).toBeNull();
    const retournement = traces[1]!.getAttribute("transform");
    // Nomme d'abord l'absence : sans ce pas, `toMatch(null)` leve un TypeError
    // et l'echec ne dit plus de quoi il parle.
    expect(retournement,
      "la bande du bas ne porte aucun transform d attribut, la regle CSS n a pas droit au transform")
      .toEqual(expect.any(String));
    expect(retournement!).toMatch(/scale\(\s*1\s+-1\s*\)/);
  });
});

/* Le drapeau (spec section 5.2) et l'historique (section 5.4), observes depuis
   le conteneur. Tout ce qui suit est monte DANS le fournisseur : hors de lui le
   drapeau ne se leve jamais et ces tests seraient verts pour rien. */
describe("le parchemin et la pagination (spec sections 5.2 et 5.4)", () => {
  it("le parchemin ouvert leve le drapeau : la molette ne pagine plus", () => {
    monterAvecConteneur(projetComplet());
    expect(actif()).toBe("ouverture");
    molette();
    expect(actif(), "la pagination a bouge sous un parchemin ouvert")
      .toBe("ouverture");
  });

  // Le defaut le plus couteux de la branche : un parchemin demonte par une
  // autre voie laissait la pagination MORTE pour le reste de la session.
  it("le parchemin demonte rend la pagination a la molette", async () => {
    monterAvecConteneur(projetComplet());
    act(() => rendreAvecConteneur(null));
    expect(hote.querySelector("dialog"), "le parchemin n est pas demonte").toBeNull();
    molette();
    await laisserRetomber();
    expect(actif(), "la pagination est restee MORTE apres le demontage du parchemin")
      .toBe("projets");
  });

  // L'invariant de la section 5.4 : l'entree posee a l'ouverture
  // garde le fragment courant. Elle ne decrit aucun etat.
  it("l ouverture n emporte pas un fragment etranger", () => {
    window.history.replaceState(null, "", "#projets");
    monterAvecConteneur(projetComplet());
    expect(location.hash,
      "l entree posee a l ouverture a change de section sous le visiteur")
      .toBe("#projets");
  });

  // La section 5.4 de bout en bout.
  it("fermer par Echap laisse la section exactement ou elle etait", async () => {
    window.history.replaceState(null, "", "#projets");
    monterAvecConteneur(projetComplet());
    const avant = actif();
    expect(avant).toBe("projets");
    act(() => {
      hote
        .querySelector("dialog")!
        .dispatchEvent(new Event("cancel", { cancelable: true, bubbles: true }));
    });
    await laisserRetomber();
    expect(hote.querySelector("dialog")).toBeNull();
    expect(actif(), "la fermeture a change de section sous le visiteur").toBe(avant);
  });
});

/* Les QUATRE gardes de surcouche du conteneur de pagination, qu'aucun test ne
   tenait : `surClic`, `surDebutTactile` (deux sorties) et `surFinTactile`. Les
   trois premieres ont ete fermees d'abord, la quatrieme n'avait pas ete
   enumeree et restait sterile. Elles tiennent toutes la section 5.2 de la
   specification : la pagination se suspend sous une surcouche. */
describe("les quatre gardes de surcouche du conteneur", () => {
  it("un clic sur une ancre de la colonne ne pagine pas sous surcouche", () => {
    monterBascule(IDS_PARCOURS, true);
    const ancre = document.createElement("a");
    ancre.setAttribute("href", "#contact");
    hote.append(ancre);
    act(() => {
      ancre.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
      );
    });
    expect(actif(), "un clic a pagine alors que le parchemin etait ouvert")
      .toBe("ouverture");
  });

  it("un touchstart sous surcouche n arme pas le geste, meme si elle se ferme avant la fin", () => {
    monterBascule(IDS_PARCOURS, true);
    act(() => {
      window.dispatchEvent(tactile("touchstart", 10, 300));
    });
    // La surcouche se ferme ENTRE les deux moities du geste : la garde du
    // `touchend` ne couvre donc plus rien, seule celle du `touchstart` tient.
    rebasculer(false);
    act(() => {
      window.dispatchEvent(tactile("touchend", 10, 100));
    });
    expect(actif(), "un geste commence sous surcouche a pagine").toBe("ouverture");
  });

  /* La QUATRIEME garde, celle de `surFinTactile`. Pour l'isoler il faut
     l'inverse de ce que fait le test precedent : la surcouche s'OUVRE entre les
     deux moities du geste. Sans cela la garde du `touchstart` aurait deja remis
     `depart` a nul et celle du `touchend` ne serait jamais atteinte, ce qui est
     exactement ce qui la laissait sterile. */
  it("une surcouche ouverte en COURS de geste empeche encore la pagination", () => {
    monterBascule(IDS_PARCOURS, false);
    act(() => {
      window.dispatchEvent(tactile("touchstart", 10, 300));
    });
    // Le geste est bel et bien arme : rien ne l'a ecarte au depart.
    rebasculer(true);
    act(() => {
      window.dispatchEvent(tactile("touchend", 10, 100));
    });
    expect(actif(), "un geste acheve sous surcouche a pagine").toBe("ouverture");
  });

  it("un touchstart parti d un proprietaire du defilement n arme pas le geste", () => {
    monterBascule(IDS_PARCOURS, false);
    const prop = document.createElement("div");
    prop.setAttribute("data-defilement-propre", "");
    Object.defineProperties(prop, {
      scrollTop: { value: 0, writable: true },
      scrollHeight: { value: 1000, configurable: true },
      clientHeight: { value: 400, configurable: true },
    });
    hote.append(prop);
    act(() => {
      prop.dispatchEvent(tactile("touchstart", 10, 300));
    });
    act(() => {
      window.dispatchEvent(tactile("touchend", 10, 100));
    });
    expect(actif(), "la pagination a vole le geste du proprietaire du defilement")
      .toBe("ouverture");
  });
});
