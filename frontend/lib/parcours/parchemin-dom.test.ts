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

/** Le fournisseur declare `children` en prop requise et `createElement` les
 *  passe en troisieme argument, que les surcharges de TypeScript ne comptent
 *  pas. Le cast ne masque rien : les enfants sont bien fournis. */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

  // Point de vigilance 4.
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
  technologies: [{ id: "t1", label: "Angular", logoPath: null, sortOrder: 0 }],
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
function espionnerClose(): string[] {
  const appels: string[] = [];
  const proto = HTMLDialogElement.prototype as unknown as { close?: () => void };
  const avait = Object.prototype.hasOwnProperty.call(proto, "close");
  proto.close = function (this: HTMLDialogElement) {
    appels.push(`${this.isConnected}/${this.hasAttribute("open")}`);
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
  // Point de vigilance 3 : `showModal` absente, cas de jsdom.
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

  // Addendum section D : l'assertion retiree de la tache 3, dont le fichier
  // n'existait pas encore. Constatee sur le DOM rendu.
  // I1 : l'assertion precedente court-circuite par `??`, donc le texte VISIBLE
  // n'etait jamais regarde. Les deux choses se constatent separement.
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

  // Point de vigilance 1, cote rendu. Les libelles sont repris du dictionnaire
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

  // Point de vigilance 2, cote rendu.
  // I2, le bloc 2 : il n'etait tenu par aucun test. Les trois mutations de la
  // revue (paragraphe retire, mention retiree, `{true &&`) passaient toutes.
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

  // Point de vigilance 5.
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

  // Promu par le coordinateur : sans `close()`, le dialogue quitte l'arbre
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

  it("l ouverture pose UNE SEULE entree d historique", () => {
    const push = vi.spyOn(history, "pushState");
    monterParchemin(projetComplet());
    // Une de plus et il faudrait deux Retour pour quitter la section ensuite,
    // la premiere fermant le parchemin et la seconde ne bougeant pas.
    expect(push, "l ouverture n empile pas exactement une entree")
      .toHaveBeenCalledTimes(1);
    push.mockRestore();
  });

  // Addendum section A : l'ordre, et non seulement le fait.
  it("la fermeture consomme l entree AVANT de prevenir l appelant", () => {
    const ordre: string[] = [];
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
    // l'ecouteur avant que `back` n'ait rien demande.
    expect(ordre, "l ordre de fermeture est inverse").toEqual(["back", "fermeture"]);
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

/* Addendum section G : le contrat de structure, ecrit en commentaire dans
   `globals.css` par la tache 3 et reporte ici, faute de composant a l'epoque.
   Constate sur le DOM rendu, et non en cherchant une chaine dans le source. */
describe("le contrat de structure de la feuille (tache 3, reporte)", () => {
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

/* Addendum sections A, B et F : le drapeau et l'historique, observes depuis le
   conteneur. Tout ce qui suit est monte DANS le fournisseur : hors de lui le
   drapeau ne se leve jamais et ces tests seraient verts pour rien. */
describe("le parchemin et la pagination (addendum A, B, F)", () => {
  it("le parchemin ouvert leve le drapeau : la molette ne pagine plus", () => {
    monterAvecConteneur(projetComplet());
    expect(actif()).toBe("ouverture");
    molette();
    expect(actif(), "la pagination a bouge sous un parchemin ouvert")
      .toBe("ouverture");
  });

  // Addendum section B : le defaut le plus couteux de la branche.
  it("le parchemin demonte rend la pagination a la molette", async () => {
    monterAvecConteneur(projetComplet());
    act(() => rendreAvecConteneur(null));
    expect(hote.querySelector("dialog"), "le parchemin n est pas demonte").toBeNull();
    molette();
    await laisserRetomber();
    expect(actif(), "la pagination est restee MORTE apres le demontage du parchemin")
      .toBe("projets");
  });

  // Addendum section A, l'invariant lui-meme : l'entree posee a l'ouverture
  // garde le fragment courant. Elle ne decrit aucun etat.
  it("l ouverture n emporte pas un fragment etranger", () => {
    window.history.replaceState(null, "", "#projets");
    monterAvecConteneur(projetComplet());
    expect(location.hash,
      "l entree posee a l ouverture a change de section sous le visiteur")
      .toBe("#projets");
  });

  // Addendum section A, de bout en bout.
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

/* Addendum section C : trois sites de garde du conteneur que la revue de la
   tache 1 a trouves tenus par AUCUN test. */
describe("les trois gardes du conteneur restees nues (addendum C)", () => {
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
