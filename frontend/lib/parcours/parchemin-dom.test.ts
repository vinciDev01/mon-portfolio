// @vitest-environment jsdom
import { afterEach, describe, it, expect, beforeEach } from "vitest";
import { createElement, useEffect, type ComponentType } from "react";
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
