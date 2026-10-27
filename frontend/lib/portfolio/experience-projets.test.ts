import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ExperienceDto, ProjectDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { ExperienceSection } from "@/components/portfolio/experience-section";
import { projetsParExperience } from "./experience-projets";
import { bloc, valeur } from "../parcours/feuille-test";

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;

const projet = (id: string, experienceId: string | null, sortOrder = 0) =>
  ({ id, name: `Projet ${id}`, experienceId, sortOrder }) as ProjectDto;

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

describe("les projets regroupes par experience", () => {
  it("range chaque projet sous son experience, dans l ordre recu", () => {
    const g = projetsParExperience([projet("a", "x"), projet("b", "y"), projet("c", "x")]);
    expect(g.get("x")?.map((p) => p.id)).toEqual(["a", "c"]);
    expect(g.get("y")?.map((p) => p.id)).toEqual(["b"]);
  });

  it("ecarte les projets personnels, sans experience", () => {
    const g = projetsParExperience([projet("a", null)]);
    expect(g.size).toBe(0);
  });
});

describe("la section des experiences liste les projets de chacune", () => {
  function rendre(projets: ProjectDto[]) {
    return renderToStaticMarkup(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(ExperienceSection, {
          experiences: [experience("x"), experience("y")],
          projets,
        }),
      ),
    );
  }

  it("rend les projets sous l experience a laquelle ils sont rattaches", () => {
    const html = rendre([projet("a", "y"), projet("b", "x")]);
    const posteX = html.indexOf("Poste x");
    const posteY = html.indexOf("Poste y");
    expect(posteX).toBeGreaterThan(-1);
    expect(posteY).toBeGreaterThan(posteX);
    // Le projet de x entre les deux cartes, celui de y apres la seconde.
    expect(html.indexOf("Projet b")).toBeGreaterThan(posteX);
    expect(html.indexOf("Projet b")).toBeLessThan(posteY);
    expect(html.indexOf("Projet a")).toBeGreaterThan(posteY);
  });

  it("nomme la liste par un titre traduit", () => {
    expect(rendre([projet("a", "x")])).toContain("Projets réalisés");
  });

  it("ne rend ni liste ni titre pour une experience sans projet", () => {
    const html = rendre([projet("a", null)]);
    expect(html).not.toContain("Projet a");
    expect(html).not.toContain("Projets réalisés");
  });
});

describe("la date d une experience, a gauche de son cadre", () => {
  const rendreUne = (e: Partial<ExperienceDto>) =>
    renderToStaticMarkup(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(ExperienceSection, { experiences: [{ ...experience("x"), ...e }], projets: [] }),
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
          projets: [],
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
