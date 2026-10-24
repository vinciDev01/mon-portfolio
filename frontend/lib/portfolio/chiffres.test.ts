import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { StatsDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { StatsSection } from "@/components/portfolio/stats-section";
import { bloc, cssNu, valeur } from "../parcours/feuille-test";

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const stats: StatsDto = { technologies: 24, certifications: 5, projects: 3, experiences: 2 };
const html = renderToStaticMarkup(
  createElement(Fournisseur, { defaultLocale: "fr" }, createElement(StatsSection, { stats })),
);

describe("les chiffres comptent jusqu a leur valeur, a la premiere arrivee", () => {
  it("le nombre est un vrai texte : sans la feuille de style, il reste visible", () => {
    const dd = [...html.matchAll(/<dd[^>]*>([\s\S]*?)<\/dd>/g)].map((m) => m[1]!);
    expect(dd).toHaveLength(4);
    expect(dd[0]).toBe('<span class="repere-compte" style="--cible:24"><span class="repere-texte">24</span></span>');
    // Rien n'est cache par le balisage lui-meme : c'est la feuille qui
    // remplace le texte par le compteur, et elle seule.
    expect(html).not.toMatch(/aria-hidden|sr-only/);
  });

  it("la feuille remplace le texte par le compteur, que les lecteurs d ecran ignorent", () => {
    const compte = bloc(/^\s*\.repere-compte::after\s*\{/m, cssNu);
    // `/ ""` : texte alternatif vide, le compteur n'est pas lu en plus du nombre.
    expect(compte).toMatch(/content:\s*counter\(repere\)\s*\/\s*""/);
    const texte = bloc(/^\s*\.repere-texte\s*\{/m, cssNu);
    expect(texte).toMatch(/clip-path:\s*inset\(50%\)/);
    expect(texte).not.toMatch(/display:\s*none/);
  });

  it("le compteur est un entier anime, affiche par un compteur CSS", () => {
    const propriete = bloc(/@property --repere-n\s*\{/, cssNu);
    expect(propriete).toMatch(/syntax:\s*"<integer>"/);
    expect(propriete).toMatch(/inherits:\s*false/);
    // Sans animation, ou sans `@property`, le compteur montre la valeur finale.
    expect(valeur(bloc(/^\s*\.repere-compte\s*\{/m, cssNu), "--repere-n")).toBe("var(--cible)");
  });

  it("ne compte qu a la decouverte de la section, et pas en mouvement reduit", () => {
    expect(cssNu).toMatch(/\[data-decouverte="true"\] \.repere-compte\s*\{[^}]*animation:\s*compte-repere/);
    const reduit = [...cssNu.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n  \}/g)]
      .map((m) => m[1]!)
      .find((b) => b.includes("repere-compte"));
    expect(reduit, "aucun repli en mouvement reduit").toBeDefined();
    expect(reduit!).toMatch(/animation:\s*none/);
  });

  it("le filet de chaque repere se trace de gauche a droite, a la decouverte", () => {
    expect(cssNu).toMatch(/\[data-decouverte="true"\] \.repere-chiffre::before\s*\{[^}]*animation:\s*trace-repere/);
    const trace = bloc(/@keyframes trace-repere\s*\{/, cssNu);
    expect(trace).toMatch(/scale:\s*0 1/);
  });
});
