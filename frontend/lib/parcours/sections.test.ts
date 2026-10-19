import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import type { SiteSettingsDto } from "@portfolio/shared-types";
import { SECTIONS, PICTOS, sectionsActives } from "./sections";
import { tableDesContenus } from "./feuille-test";

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

  it("PICTOS et SECTIONS se correspondent dans les deux sens", () => {
    const ids = SECTIONS.map((s) => s.id).sort();
    expect(Object.keys(PICTOS).sort()).toEqual(ids);
  });

  it("un reglage absent de la reponse omet la section, sauf l ouverture", () => {
    expect(
      sectionsActives({} as unknown as SiteSettingsDto).map((s) => s.id),
    ).toEqual(["ouverture"]);
  });

  it("l ordre suit celui de la table des contenus de page.tsx, qui fait autorite", () => {
    // Les `id="..."` ont quitte page.tsx : le conteneur les pose. La table des
    // contenus porte les memes identifiants comme cles.
    expect(tableDesContenus().map((e) => e.id)).toEqual(SECTIONS.map((s) => s.id));
  });
});

/** Tous les .ts et .tsx sous `components/` et `lib/`, hors le module lui-meme et les tests. */
function fichiersSource(): string[] {
  return ["components", "lib"].flatMap((dossier) =>
    (readdirSync(path.join(RACINE, dossier), { recursive: true }) as string[])
      .map((f) => path.join(dossier, f))
      .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
      .filter((f) => f !== path.join("lib", "parcours", "sections.ts")),
  );
}

describe("source unique : aucune autre declaration (spec section 7.1)", () => {
  // Categorique et non orthographique : on ne liste pas les consommateurs, on
  // balaie tout le code source. Trois declarations divergentes existaient
  // avant cette tache.
  const CONSOMMATEURS = [
    "components/parcours/colonne-passage.tsx",
    "components/portfolio/section-toast-observer.tsx",
  ];

  it("chaque consommateur importe le module", () => {
    for (const f of CONSOMMATEURS) {
      expect(lire(f), f).toContain('from "@/lib/parcours/sections"');
    }
  });

  it("aucun fichier source ne nomme deux identifiants de section ou plus", () => {
    // Un fichier peut citer une section (cas particulier) ; deux ou plus
    // signifie qu'il reconstruit la liste.
    const fichiers = fichiersSource();
    expect(fichiers.length).toBeGreaterThan(10);
    for (const f of fichiers) {
      const src = lire(f);
      const cites = SECTIONS.map((s) => s.id).filter((id) =>
        new RegExp(`["'\`]${id}["'\`]`).test(src),
      );
      expect(
        cites.length,
        `${f} reconstruit la liste des sections : ${cites.join(", ")}`,
      ).toBeLessThan(2);
    }
  });

  // Les cles de titre de page.tsx divergeaient de celles de la colonne
  // (section.* contre nav.*) : c'est le defaut d'origine. Verifie par
  // identifiant, pas seulement en sequence : permuter deux titres echouerait.
  it("page.tsx passe a SectionShell les cles que SECTIONS declare", () => {
    const table = tableDesContenus();
    expect(table.length).toBe(SECTIONS.length);
    for (const s of SECTIONS) {
      const entree = table.find((e) => e.id === s.id);
      expect(entree?.cleTitre, s.id).toBe(s.cleTitre);
    }
  });

  // Les titres de section vivent sous `nav.*`. Une seconde famille `section.*`
  // est le vehicule de la divergence d'origine : le balayage ci-dessous ne
  // couvrait que les identifiants.
  it("aucune source ne reference `section.<id>` pour un identifiant de section", () => {
    for (const f of fichiersSource()) {
      const src = lire(f);
      for (const { id } of SECTIONS) {
        expect(src, `${f} reference section.${id}`).not.toMatch(
          new RegExp(`["'\`]section\\.${id}["'\`]`),
        );
      }
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

  for (const langue of ["fr", "en", "de"]) {
    it(`${langue}.json : aucune cle section.* hors section.certifications`, () => {
      const dict = JSON.parse(lire(`lib/i18n/${langue}.json`));
      const cles = Object.keys(dict).filter((k) => k.startsWith("section."));
      expect(cles).toEqual(["section.certifications"]);
    });

    it(`${langue}.json : aucun libelle de navigation ne finit par un point`, () => {
      const dict = JSON.parse(lire(`lib/i18n/${langue}.json`));
      for (const [k, v] of Object.entries(dict)) {
        if (k.startsWith("nav.")) expect(v, k).not.toMatch(/\.$/);
      }
    });
  }

  for (const langue of ["fr", "en", "de"]) {
    it(`${langue}.json : aucun libelle de section ne finit par un point`, () => {
      const dict = JSON.parse(lire(`lib/i18n/${langue}.json`));
      for (const s of SECTIONS) {
        expect(dict[s.cleTitre], s.cleTitre).not.toMatch(/\.$/);
      }
    });
  }
});
