import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ExperienceDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { ExperienceSection } from "@/components/portfolio/experience-section";
import { bloc, valeur } from "../parcours/feuille-test";

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;

const experience = (id: string) =>
  ({
    id,
    company: `Societe ${id}`,
    role: `Poste ${id}`,
    description: null,
    startDate: "2023-01-01T00:00:00.000Z",
    endDate: null,
    isCurrent: true,
    sortOrder: 0,
  }) as ExperienceDto;

describe("la section des experiences n affiche pas les projets", () => {
  it("ne rend ni les projets rattaches ni leur titre", () => {
    const html = renderToStaticMarkup(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(ExperienceSection, { experiences: [experience("x")] }),
      ),
    );
    expect(html).toContain("Poste x");
    expect(html).not.toContain("Projets réalisés");
  });
});

describe("la date d une experience, a gauche de son cadre", () => {
  const rendreUne = (e: Partial<ExperienceDto>) =>
    renderToStaticMarkup(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(ExperienceSection, { experiences: [{ ...experience("x"), ...e }]}),
      ),
    );

  it("sort la date du cadre et la place avant lui", () => {
    const html = rendreUne({ startDate: "2025-07-01T00:00:00.000Z", endDate: "2026-02-01T00:00:00.000Z", isCurrent: false });
    const dates = html.indexOf('class="experience-dates"');
    const cadre = html.indexOf("experience-carte");
    expect(dates, "colonne des dates introuvable").toBeGreaterThan(-1);
    expect(dates).toBeLessThan(cadre);
    // Aucune date dans le cadre lui-meme.
    const dansLeCadre = html.slice(cadre);
    expect(dansLeCadre).not.toMatch(/<time/);
  });

  it("donne debut et fin en dates lisibles par les machines", () => {
    const html = rendreUne({ startDate: "2025-07-01T00:00:00.000Z", endDate: "2026-02-01T00:00:00.000Z", isCurrent: false });
    expect(html).toMatch(/<time[^>]*dateTime="2025-07"/);
    expect(html).toMatch(/<time[^>]*dateTime="2026-02"/);
  });

  it("en cours : la fin dit aujourd hui, et le badge suit la date", () => {
    const html = rendreUne({ startDate: "2026-03-01T00:00:00.000Z", endDate: null, isCurrent: true });
    const dates = html.slice(html.indexOf('class="experience-dates"'), html.indexOf("experience-carte"));
    expect(dates).toContain("aujourd");
    expect(dates).toContain("En cours");
  });

  it("seule l experience en cours porte la lueur qui fait le tour du bord", () => {
    expect(rendreUne({ startDate: "2026-03-01T00:00:00.000Z", endDate: null, isCurrent: true })).toContain("bord-trace");
    expect(
      rendreUne({ startDate: "2025-07-01T00:00:00.000Z", endDate: "2026-02-01T00:00:00.000Z", isCurrent: false }),
    ).not.toContain("bord-trace");
  });

  it("n imprime aucun tiret cadratin", () => {
    const html = rendreUne({ startDate: "2025-07-01T00:00:00.000Z", endDate: "2026-02-01T00:00:00.000Z" });
    expect(html).not.toContain("\u2014");
    expect(html).not.toContain("&mdash;");
  });
});

describe("la periode tient sur une ligne", () => {
  it("debut, « a » et fin forment une seule periode, insecable et lue d un trait", () => {
    const html = renderToStaticMarkup(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(ExperienceSection, {
          experiences: [{ ...experience("x"), startDate: "2025-07-01T00:00:00.000Z", endDate: "2026-02-01T00:00:00.000Z", isCurrent: false }],
        }),
      ),
    );
    expect(html).toMatch(/<span class="experience-periode"><time[^>]*>juillet 2025<\/time> à <time[^>]*>février 2026<\/time><\/span>/);
    expect(valeur(bloc(/\.experience-periode\s*\{/), "white-space")).toBe("nowrap");
  });

  it("la colonne des dates a la place de la plus longue periode", () => {
    const largeur = /grid-template-columns:\s*([\d.]+)rem/.exec(bloc(/^\s*\.experience-ligne\s*\{/m))?.[1];
    expect(Number(largeur)).toBeGreaterThanOrEqual(13);
  });
});
