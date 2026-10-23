import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ExperienceDto, ProjectDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { ExperienceSection } from "@/components/portfolio/experience-section";
import { projetsParExperience } from "./experience-projets";

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
