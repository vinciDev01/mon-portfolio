// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { StrictMode, act, createElement, type ComponentType, type ReactNode } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "./theme-context";
import { Interrupteur } from "@/components/ampoule/interrupteur";
import { DUREE_ALLUMAGE } from "@/lib/ampoule/animation";

/*
 * Garde-fou du defaut d'hydratation de l'interrupteur.
 *
 * Les tests de source du depot comptent des chaines ; ceux-la jouent la
 * sequence reelle du navigateur, la seule ou le defaut apparait :
 *   1. le serveur rend le HTML SANS `document` (il ignore l'heure locale et
 *      le stockage du visiteur) ;
 *   2. le script en ligne (`script-initial.ts`) pose la classe reelle sur
 *      <html> avant le premier trace — de nuit, « clair » ;
 *   3. React hydrate ce HTML dans ce DOM-la.
 *
 * Le premier rendu client doit rendre EXACTEMENT ce que le serveur a rendu
 * (sinon divergence), puis s'aligner sur l'etat reel. La valeur finale de
 * `aria-checked` doit donc etre celle de l'etat REEL : c'est ce qui
 * distingue une vraie correction d'un `suppressHydrationWarning`, lequel
 * ferait taire l'avertissement en laissant l'attribut faux (React annonce
 * « this won't be patched up » : il ne repare pas un attribut divergent).
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SOURCE_INTERRUPTEUR = path.resolve(
  import.meta.dirname,
  "../../components/ampoule/interrupteur.tsx",
);

/** `children` est fourni par le troisieme argument de `createElement`. */
const Fournisseur = ThemeProvider as ComponentType<{ strategie: "auto" | "clair" | "sombre" }>;

function arbre(strategie: "auto" | "clair" | "sombre" = "auto"): ReactNode {
  return createElement(Fournisseur, { strategie }, createElement(Interrupteur));
}

/**
 * Rend l'arbre par le CHEMIN SERVEUR : `document` retire le temps du rendu,
 * exactement comme dans le processus Node de Next. Sans ce retrait, jsdom
 * fournirait un `document` et le rendu emprunterait le chemin client, ce
 * qui ferait disparaitre le defaut que ce fichier doit attraper.
 */
function rendreCommeLeServeur(strategie: "auto" | "clair" | "sombre" = "auto"): string {
  vi.stubGlobal("document", undefined);
  try {
    return renderToStaticMarkup(arbre(strategie));
  } finally {
    vi.unstubAllGlobals();
  }
}

/** Double factice de l'unique `Animation` : jsdom n'implemente pas la WAAPI. */
function animationFactice() {
  let duree = DUREE_ALLUMAGE;
  return {
    currentTime: null as number | null,
    playbackRate: 1,
    effect: {
      setKeyframes: vi.fn(),
      updateTiming: vi.fn((o?: { duration?: number }) => {
        if (o && typeof o.duration === "number") duree = o.duration;
      }),
      getTiming: vi.fn(() => ({ duration: duree })),
    },
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
  };
}

let animation: ReturnType<typeof animationFactice>;
let racine: Root | null = null;
let conteneur: HTMLElement;
let ecritures: string[];
let messages: string[];
let mutationsDeClasse: number;
let observateur: MutationObserver | null = null;

beforeEach(() => {
  animation = animationFactice();
  document.documentElement.className = "";
  document.documentElement.removeAttribute("style");
  document.documentElement.animate = vi.fn(() => animation as unknown as Animation);
  window.matchMedia = vi.fn(() => ({ matches: false })) as unknown as typeof window.matchMedia;
  ecritures = [];
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((_c, v) => {
    ecritures.push(String(v));
  });
  // React ne passe PAS une divergence d'ATTRIBUT par `onRecoverableError`
  // (mesure de ce chantier) : elle n'arrive que par `console.error`, avec
  // le mot « hydrat ». On capture donc les deux canaux.
  messages = [];
  vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => {
    messages.push(a.map((x) => String(x)).join(" "));
  });
  mutationsDeClasse = 0;
  observateur = new MutationObserver(() => {
    // Vide : le comptage passe par `mutationsDeClasse()`, qui draine la
    // file avec `takeRecords()`. Un `MutationObserver` ne livre ses
    // enregistrements qu'en micro-tache ; s'en remettre au rappel ferait
    // mesurer zero a une sonde qui n'a simplement encore rien recu.
  });
  observateur.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
});

afterEach(() => {
  observateur?.disconnect();
  observateur = null;
  if (racine) {
    const r = racine;
    racine = null;
    act(() => r.unmount());
  }
  conteneur?.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/**
 * Pose le HTML du serveur dans le document, applique la classe du script en
 * ligne, puis hydrate. Renvoie les erreurs recuperables signalees par React
 * (c'est par la que passent les divergences d'hydratation).
 */
function hydrater(
  html: string,
  classeDuScript: "clair" | "sombre",
  strict = false,
): unknown[] {
  conteneur = document.createElement("div");
  conteneur.innerHTML = html;
  document.body.append(conteneur);
  // Le script en ligne a pose la classe reelle avant le premier trace.
  document.documentElement.classList.add(classeDuScript);
  // La classe du script n'est pas une mutation imputable a React.
  observateur!.takeRecords();
  mutationsDeClasse = 0;

  const erreurs: unknown[] = [];
  act(() => {
    racine = hydrateRoot(conteneur, strict ? createElement(StrictMode, null, arbre()) : arbre(), {
      onRecoverableError: (e) => {
        erreurs.push(e);
      },
    });
  });
  return erreurs;
}

const bouton = () => conteneur.querySelector('button[role="switch"]')!;

/** Nombre de reecritures de `class` sur <html>, file drainee a la main. */
function reecrituresDeClasse(): number {
  mutationsDeClasse += observateur?.takeRecords().length ?? 0;
  return mutationsDeClasse;
}

describe("le rendu serveur de l interrupteur", () => {
  it("est deterministe : en strategie auto il annonce l interrupteur eteint", () => {
    expect(rendreCommeLeServeur()).toContain('aria-checked="false"');
  });

  it("ne depend PAS de la classe posee sur <html> : meme sortie avec la classe clair", () => {
    // Le meme arbre, rendu cette fois avec un `document` en place et la
    // classe « clair » dessus : l'initialiseur d'etat ne doit pas la lire,
    // sinon le premier rendu client diverge de celui du serveur.
    document.documentElement.classList.add("clair");
    expect(renderToStaticMarkup(arbre())).toContain('aria-checked="false"');
    expect(renderToStaticMarkup(arbre())).toBe(rendreCommeLeServeur());
  });
});

describe("l hydratation de l interrupteur dans un DOM deja marque par le script", () => {
  it("ne signale aucune divergence et finit sur l etat REEL (aria-checked=true)", () => {
    const html = rendreCommeLeServeur();
    expect(html).toContain('aria-checked="false"');

    const erreurs = hydrater(html, "clair");

    expect(erreurs).toEqual([]);
    expect(messages).toEqual([]);
    // L'essentiel : l'attribut porte l'etat reel, pas celui du serveur. Un
    // `suppressHydrationWarning` viderait `erreurs` en laissant « false ».
    expect(bouton().getAttribute("aria-checked")).toBe("true");
    expect(bouton().textContent).toBe("Allumé, thème clair");
  });

  it("n hydrate sans divergence ni realignement quand le script confirme le serveur", () => {
    const erreurs = hydrater(rendreCommeLeServeur(), "sombre");

    expect(erreurs).toEqual([]);
    expect(messages).toEqual([]);
    expect(bouton().getAttribute("aria-checked")).toBe("false");
  });

  it("n introduit aucun mouvement : ni classe reecrite, ni allumage rejoue, ni choix enregistre", () => {
    hydrater(rendreCommeLeServeur(), "clair");

    // Le theme VISIBLE vient de la classe posee par le script : l'alignement
    // ne doit ni la retirer ni la reposer (aucun clignotement).
    expect(reecrituresDeClasse()).toBe(0);
    expect(document.documentElement.classList.contains("clair")).toBe(true);
    // L'incandescence ne doit pas etre rejouee : l'objet Animation est
    // positionne sur la borne « allume », sans mise en scene.
    expect(animation.play).not.toHaveBeenCalled();
    expect(animation.currentTime).toBe(DUREE_ALLUMAGE);
    // Un alignement n'est pas un choix du visiteur : rien en stockage.
    expect(ecritures).toEqual([]);
  });

  it("tient sous StrictMode, dont le double montage d effets", () => {
    // StrictMode est actif en developpement (defaut de l App Router) : il
    // monte, demonte puis remonte les effets, avec les fermetures du rendu
    // d'avant l'alignement. Rien ne doit en sortir : ni classe reecrite, ni
    // incandescence rejouee, ni choix enregistre.
    const erreurs = hydrater(rendreCommeLeServeur(), "clair", true);

    expect(erreurs).toEqual([]);
    expect(messages).toEqual([]);
    expect(bouton().getAttribute("aria-checked")).toBe("true");
    expect(reecrituresDeClasse()).toBe(0);
    expect(animation.play).not.toHaveBeenCalled();
    expect(ecritures).toEqual([]);
  });

  it("laisse la bascule du visiteur intacte apres l alignement", () => {
    hydrater(rendreCommeLeServeur(), "clair");
    expect(bouton().getAttribute("aria-checked")).toBe("true");

    act(() => {
      bouton().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(bouton().getAttribute("aria-checked")).toBe("false");
    expect(document.documentElement.classList.contains("sombre")).toBe(true);
    expect(animation.play).toHaveBeenCalledTimes(1);
    expect(ecritures).toEqual(["sombre"]);
  });
});

describe("la source de l interrupteur", () => {
  it("ne contient aucun suppressHydrationWarning : le premier rendu client egale le serveur", () => {
    // Commentaires retires (y compris les `{/* ... */}` de JSX) : le mot
    // est cite dans la note du composant, qui explique son absence.
    const src = readFileSync(SOURCE_INTERRUPTEUR, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    // Sonde : le retrait des commentaires n'a pas vide le fichier.
    expect(src).toContain("aria-checked={allumee}");
    expect(src).not.toContain("suppressHydrationWarning");
  });
});
