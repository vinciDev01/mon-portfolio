import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../i18n/i18n-context";
import { SectionShell } from "@/components/portfolio/section-shell";

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
/** `children` passe en troisieme argument, comme l'exige `react/no-children-prop` :
 *  les surcharges de TypeScript ne le comptent pas, le cast ne masque rien. */
const Coquille = SectionShell as ComponentType<{ cleTitre: string; index: number }>;

describe("la marge de chaque section", () => {
  it("laisse de l air sous le contenu, pas seulement au-dessus", () => {
    // Sans marge basse, la fin d'une section colle au bord de l'ecran, la ou
    // le visiteur arrive en butee pour passer a la suivante.
    const html = renderToStaticMarkup(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(Coquille, { cleTitre: "nav.projects", index: 1 }, "CONTENU"),
      ),
    );
    const style = /<section[^>]*style="([^"]*)"/.exec(html)?.[1] ?? "";
    expect(style).toMatch(/padding-top:\s*var\(--espace-section\)/);
    // 64 px par defaut ; un ecran bas la reduit par `--section-bas`.
    expect(style).toMatch(/padding-bottom:\s*var\(--section-bas,\s*var\(--espace-5\)\)/);
  });
});
