import { describe, it, expect, vi } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "../theme/theme-context";
import BlogLayout from "@/app/blog/layout";
import { lire } from "../parcours/feuille-test";

const Theme = ThemeProvider as ComponentType<Record<string, unknown>>;

describe("les pages du blog", () => {
  it("portent l ampoule, liste et articles compris", async () => {
    // Le gabarit enveloppe la liste ET chaque article : l'y poser suffit. Il
    // est asynchrone (il lit les donnees de la colonne) : sans reseau, il se
    // rend sans la colonne, ce que ce test exerce.
    vi.stubGlobal("fetch", () => Promise.reject(new Error("hors ligne")));
    const gabarit = await BlogLayout({ children: "CONTENU" });
    vi.unstubAllGlobals();
    const html = renderToStaticMarkup(createElement(Theme, {}, gabarit));
    expect(html).toMatch(/class="ampoule[ "]/);
    expect(html).toContain("CONTENU");
  });

  it("la liste ramene au portfolio, chaque article ramene a la liste", () => {
    expect(lire("app/blog/page.tsx")).toMatch(/<Link\s+href="\/"[\s\S]*?Retour au portfolio/);
    expect(lire("app/blog/[slug]/page.tsx")).toMatch(/<Link\s+href="\/blog"[\s\S]*?Retour au blog/);
  });
});
