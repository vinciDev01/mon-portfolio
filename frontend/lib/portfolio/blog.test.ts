import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "../theme/theme-context";
import BlogLayout from "@/app/blog/layout";
import { lire } from "../parcours/feuille-test";

const Theme = ThemeProvider as ComponentType<Record<string, unknown>>;

describe("les pages du blog", () => {
  it("portent l ampoule, liste et articles compris", () => {
    // Le gabarit enveloppe la liste ET chaque article : l'y poser suffit.
    const html = renderToStaticMarkup(
      createElement(Theme, {}, createElement(BlogLayout, null, "CONTENU")),
    );
    expect(html).toMatch(/class="ampoule[ "]/);
    expect(html).toContain("CONTENU");
  });

  it("la liste ramene au portfolio, chaque article ramene a la liste", () => {
    expect(lire("app/blog/page.tsx")).toMatch(/<Link\s+href="\/"[\s\S]*?Retour au portfolio/);
    expect(lire("app/blog/[slug]/page.tsx")).toMatch(/<Link\s+href="\/blog"[\s\S]*?Retour au blog/);
  });
});
