import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { entreesSections } from "./entrees-sections";
import type { SiteSettingsDto } from "@portfolio/shared-types";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");

/** Reglages ou tout est actif, pour partir d'une base connue. */
function tousActifs(): SiteSettingsDto {
  return {
    showPresentations: true, showStats: true, showSkills: true,
    showExperiences: true, showProjects: true, showServices: true,
    showAbout: true, showTestimonials: true, showContact: true,
  } as unknown as SiteSettingsDto;
}

describe("entrees de la colonne", () => {
  it("rend une entree par section activee, dans l'ordre du parcours", () => {
    const e = entreesSections(tousActifs());
    expect(e.map((x) => x.ancre)).toEqual([
      "ouverture", "stats", "competences", "experience",
      "projets", "a-propos", "contact", "services", "temoignages",
    ]);
  });

  it("suit exactement l ordre de rendu de page.tsx", () => {
    // Deux listes qui decrivent le meme parcours finissent par diverger. La
    // page fait autorite : ce test lit son ordre reel plutot que de le
    // recopier, donc il echoue si l'une des deux bouge sans l'autre.
    const page = lire("app/page.tsx");
    const ordrePage = [...page.matchAll(/id="([a-z-]+)"/g)].map((m) => m[1]);
    const ordreColonne = entreesSections(tousActifs()).map((e) => e.ancre);
    expect(ordreColonne).toEqual(ordrePage);
  });

  it("omet les sections desactivees", () => {
    const r = { ...tousActifs(), showStats: false, showServices: false };
    const ancres = entreesSections(r).map((x) => x.ancre);
    expect(ancres).not.toContain("stats");
    expect(ancres).not.toContain("services");
    expect(ancres).toContain("projets");
  });

  // Review Focus 1 : toutes les sections desactivees.
  it("rend une liste vide quand tout est desactive, sans jeter", () => {
    const aucune = Object.fromEntries(
      Object.keys(tousActifs()).map((k) => [k, false]),
    ) as unknown as SiteSettingsDto;
    expect(entreesSections(aucune)).toEqual([]);
  });

  it("ne reference que des cles de traduction qui existent", () => {
    const fr = JSON.parse(lire("lib/i18n/fr.json")) as Record<string, string>;
    for (const e of entreesSections(tousActifs())) {
      expect(fr[e.cleTitre], `cle manquante : ${e.cleTitre}`).toBeTypeOf("string");
    }
  });
});

describe("colonne de passage", () => {
  const src = lire("components/parcours/colonne-passage.tsx");

  it("est un nav au nom accessible explicite", () => {
    expect(src).toContain("<nav");
    expect(src).toMatch(/aria-label=\{t\("parcours\.colonne"\)\}/);
  });

  // Review Focus 3 : un nom et un prenom longs.
  it("replie l identite sans la laisser deborder", () => {
    const css = lire("app/globals.css");
    const m = /\.identite-mat\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .identite-mat introuvable").not.toBeNull();
    expect(m![1]).toMatch(/overflow-wrap:\s*anywhere/);
    expect(m![1]).toMatch(/max-width:\s*100%/);
  });

  it("rend l identite accessible meme quand le nom n est plus affiche", () => {
    // Sous 1024 px seul le logo subsiste : le nom reste le nom du lien.
    expect(src).toMatch(/aria-label=\{nomComplet\}/);
  });

  it("ne cree aucun mouvement", () => {
    expect(src).not.toMatch(/transition|animate-|animation/);
  });

  it("l en-tete collant a bien ete depose", () => {
    const page = lire("app/page.tsx");
    expect(page).not.toContain("Header");
    expect(page).toContain("ColonnePassage");
  });

  it("n introduit ni tiret cadratin ni emoji", () => {
    for (const f of ["components/parcours/colonne-passage.tsx",
                     "lib/parcours/entrees-sections.ts"]) {
      const t = lire(f);
      expect(t, f).not.toContain("\u2014");
      expect([...t].some((c) => c.codePointAt(0)! > 0x2500), f).toBe(false);
    }
  });
});
