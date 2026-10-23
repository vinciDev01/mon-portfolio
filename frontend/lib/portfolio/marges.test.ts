import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../i18n/i18n-context";
import { SectionShell } from "@/components/portfolio/section-shell";

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;

describe("la marge de chaque section", () => {
  it("laisse de l air sous le contenu, pas seulement au-dessus", () => {
    // Sans marge basse, la fin d'une section colle au bord de l'ecran, la ou
    // le visiteur arrive en butee pour passer a la suivante.
    const html = renderToStaticMarkup(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(SectionShell, { cleTitre: "nav.projects", index: 1, children: "CONTENU" }),
      ),
    );
    const style = /<section[^>]*style="([^"]*)"/.exec(html)?.[1] ?? "";
    expect(style).toMatch(/padding-top:\s*var\(--espace-section\)/);
    expect(style).toMatch(/padding-bottom:\s*var\(--espace-5\)/);
  });
});
