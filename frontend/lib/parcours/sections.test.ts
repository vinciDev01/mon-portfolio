import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import type { SiteSettingsDto } from "@portfolio/shared-types";
import { SECTIONS, PICTOS, sectionsActives } from "./sections";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");

function reglages(actifs: string[]): SiteSettingsDto {
  const base: Record<string, unknown> = {};
  for (const s of SECTIONS) base[s.reglage] = actifs.includes(s.id);
  return base as unknown as SiteSettingsDto;
}

describe("la liste des sections (spec section 2.2)", () => {
  it("porte les neuf sections dans l ordre du parcours", () => {
    expect(SECTIONS.map((s) => s.id)).toEqual([
      "ouverture", "stats", "competences", "experience", "projets",
      "a-propos", "contact", "services", "temoignages",
    ]);
  });

  it("ne garde que les sections dont le reglage est vrai", () => {
    expect(sectionsActives(reglages(["projets", "contact"])).map((s) => s.id))
      .toEqual(["ouverture", "projets", "contact"]);
  });

  it("ne garde que l ouverture quand tout est eteint", () => {
    // L'ouverture est la section d'identite : inconditionnelle.
    expect(sectionsActives(reglages([])).map((s) => s.id)).toEqual(["ouverture"]);
  });

  it("garde l ouverture meme quand showPresentations est faux", () => {
    const r = { ...reglages(["projets"]), showPresentations: false };
    expect(sectionsActives(r).map((s) => s.id)).toContain("ouverture");
  });

  it("preserve l ordre quel que soit l ordre des reglages", () => {
    expect(sectionsActives(reglages(["contact", "projets"])).map((s) => s.id))
      .toEqual(["ouverture", "projets", "contact"]);
  });

  it("donne a chaque section une cle de titre et un pictogramme", () => {
    for (const s of SECTIONS) {
      expect(s.cleTitre, s.id).toMatch(/^nav\./);
      expect(PICTOS[s.id], s.id).toContain("<path");
    }
  });

  it("l ordre suit celui de page.tsx, qui fait autorite", () => {
    const page = lire("app/page.tsx");
    const rendus = [...page.matchAll(/id="([a-z-]+)"/g)].map((m) => m[1]);
    expect(rendus).toEqual(SECTIONS.map((s) => s.id));
  });
});

describe("source unique : aucune autre declaration (spec section 7.1)", () => {
  // Categorique et non orthographique : on n'interdit pas une ecriture, on
  // exige que tout consommateur PASSE par le module. Trois declarations
  // divergentes existaient avant cette tache.
  const CONSOMMATEURS = [
    "components/parcours/colonne-passage.tsx",
    "components/portfolio/section-toast-observer.tsx",
  ];

  it("chaque consommateur importe le module", () => {
    for (const f of CONSOMMATEURS) {
      expect(lire(f), f).toContain('from "@/lib/parcours/sections"');
    }
  });

  it("aucun consommateur ne nomme d identifiant de section", () => {
    // Un consommateur qui en nomme un seul reconstruit deja une partie de la liste.
    for (const f of CONSOMMATEURS) {
      const src = lire(f);
      const cites = SECTIONS.map((s) => s.id).filter((id) =>
        new RegExp(`["'\`]${id}["'\`]`).test(src),
      );
      expect(cites, `${f} reconstruit la liste : ${cites.join(", ")}`)
        .toHaveLength(0);
    }
  });

  it("l ancien module est bien supprime", () => {
    expect(() => lire("lib/parcours/entrees-sections.ts")).toThrow();
  });

  it("plus rien n importe l ancien module", () => {
    for (const f of [...CONSOMMATEURS, "app/page.tsx"]) {
      expect(lire(f), f).not.toContain("entrees-sections");
    }
  });
});

describe("les cles de titre existent dans les trois langues", () => {
  for (const langue of ["fr", "en", "de"]) {
    it(`${langue}.json porte les neuf cles`, () => {
      const dict = JSON.parse(lire(`lib/i18n/${langue}.json`));
      for (const s of SECTIONS) expect(dict[s.cleTitre], s.cleTitre).toBeTruthy();
    });
  }

  it("aucun libelle de navigation ne finit par un point", () => {
    const dict = JSON.parse(lire("lib/i18n/fr.json"));
    for (const s of SECTIONS) {
      expect(dict[s.cleTitre], s.cleTitre).not.toMatch(/\.$/);
    }
  });
});
