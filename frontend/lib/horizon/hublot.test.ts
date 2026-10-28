import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Hublot } from "@/components/horizon/hublot";
import { bloc, cssNu, lire } from "../parcours/feuille-test";

/* L'horizon maritime, en bas a droite : la mer vue par un hublot de laiton,
   la lune (theme sombre) ou le soleil couchant (theme clair), et des lueurs
   qui scintillent sur l'eau. Decoratif, il ne capte rien et ne dit rien. */

const html = renderToStaticMarkup(createElement(Hublot));

describe("le hublot", () => {
  it("est un dessin decoratif : cache aux lecteurs d ecran, hors de la tabulation", () => {
    expect(html).toMatch(/^<div class="hublot" aria-hidden="true"><svg[^>]*focusable="false"/);
  });

  it("la vue est decoupee par le verre, sous un anneau de laiton a rivets", () => {
    expect(html).toMatch(/<clipPath id="hublot-verre"><circle/);
    expect(html).toContain('clip-path="url(#hublot-verre)"');
    expect(html.match(/class="hublot-rivet"/g)?.length).toBeGreaterThanOrEqual(8);
  });

  it("un chemin de lueurs sur l eau, chacune a son rythme", () => {
    const lueurs = [...html.matchAll(/class="hublot-lueur"[^>]*style="--duree:([\d.]+s);--delai:(-?[\d.]+s)"/g)];
    expect(lueurs.length).toBeGreaterThanOrEqual(7);
    // Desynchronisees : pas deux fois le meme couple duree et delai.
    expect(new Set(lueurs.map((m) => `${m[1]}/${m[2]}`)).size).toBe(lueurs.length);
  });

  it("des etoiles, qui scintillent aussi", () => {
    expect(html.match(/class="hublot-etoile"/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it("aucun degrade : des aplats seulement, comme tout le site", () => {
    expect(html).not.toMatch(/Gradient/);
  });

  it("est pose sur le portfolio, a cote de l ampoule", () => {
    const page = lire("app/page.tsx");
    expect(page).toContain("<Hublot />");
    expect(page.indexOf("<Hublot />")).toBeGreaterThan(page.indexOf("<Ampoule />"));
  });
});

describe("la feuille du hublot", () => {
  it("fixe en bas a droite, dans la bande de l ampoule, et sans capter le pointeur", () => {
    const regle = bloc(/^\s*\.hublot\s*\{/m);
    expect(regle).toMatch(/position:\s*fixed/);
    expect(regle).toMatch(/right:\s*var\(--ampoule-droite/);
    expect(regle).toMatch(/pointer-events:\s*none/);
    expect(regle).toMatch(/display:\s*none/);
  });

  it("n apparait qu a partir de 1200 px, ou la bande est libre", () => {
    expect(cssNu).toMatch(/@media \(min-width: 1200px\)\s*\{\s*\.hublot\s*\{\s*display:\s*block/);
  });

  it("le scintillement ne joue que sur l opacite : rien ne se deplace", () => {
    const images = bloc(/@keyframes hublot-scintille\s*\{/);
    expect(images).toMatch(/opacity/);
    expect(images).not.toMatch(/transform|translate|scale|rotate/);
  });

  it("fige pour qui demande moins de mouvement", () => {
    expect(cssNu).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root:not\(\[data-mouvement="force"\]\) \.hublot-lueur,\s*:root:not\(\[data-mouvement="force"\]\) \.hublot-etoile\s*\{\s*animation:\s*none/,
    );
  });
});
