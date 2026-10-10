import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { dispositionJournal, ligneDate } from "./journal";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Article } from "../../components/parcours/journal-projets";
import { I18nProvider } from "../i18n/i18n-context";
import type { ProjectDto } from "@portfolio/shared-types";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");

/** Rend les valeurs des parametres, pour que les tests portent sur les dates
 *  et non sur la phrase. */
const tFaux = (cle: string, p?: Record<string, string>) =>
  p ? Object.values(p).join(" ") : cle;

/** Corps (accolades equilibrees) de chaque bloc dont l'en-tete correspond. */
function blocs(entete: RegExp, source: string): string[] {
  const re = new RegExp(entete.source, "g");
  const trouves: string[] = [];
  for (let m = re.exec(source); m; m = re.exec(source)) {
    let profondeur = 0;
    for (let i = m.index + m[0].length - 1; i < source.length; i++) {
      if (source[i] === "{") profondeur++;
      if (source[i] === "}" && --profondeur === 0) {
        trouves.push(source.slice(m.index + m[0].length, i));
        break;
      }
    }
  }
  return trouves;
}

function projet(p: Partial<ProjectDto>): ProjectDto {
  return {
    id: p.id ?? "x", name: p.name ?? "Projet", description: null,
    photo1Path: null, photo2Path: null, demoUrl: null, targetAudience: null,
    startDate: null, endDate: null, technologies: [], collaborators: [],
    sortOrder: 0, ...p,
  } as ProjectDto;
}

describe("ligne de date du journal (spec section 6.2)", () => {
  it("prend le plus petit debut et le plus grand terme", () => {
    const l = ligneDate([
      projet({ startDate: "2024-03-01", endDate: "2024-09-01" }),
      projet({ startDate: "2025-01-01", endDate: "2026-01-01" }),
    ], "fr", tFaux);
    expect(l).toContain("2024");
    expect(l).toContain("2026");
  });

  it("est omise quand aucun projet ne porte de date", () => {
    expect(ligneDate([projet({}), projet({})], "fr", tFaux)).toBeNull();
  });

  it("ne se replie jamais sur la date du jour", () => {
    const anneeCourante = String(new Date().getFullYear());
    const l = ligneDate([projet({ startDate: "2020-01-01", endDate: "2020-06-01" })], "fr", tFaux);
    expect(l).not.toContain(anneeCourante);
  });

  // Review Focus 5 : startDate posterieur a endDate.
  it("ne s inverse pas sur une saisie incoherente", () => {
    const l = ligneDate([projet({ startDate: "2026-01-01", endDate: "2024-03-01" })], "fr", tFaux);
    // Le plus petit et le plus grand, toutes bornes confondues.
    const i2024 = l!.indexOf("2024");
    const i2026 = l!.indexOf("2026");
    expect(i2024).toBeGreaterThan(-1);
    expect(i2026).toBeGreaterThan(i2024);
  });

  it("tient avec une seule borne renseignee", () => {
    expect(ligneDate([projet({ startDate: "2024-03-01" })], "fr", tFaux)).toContain("2024");
  });
});

describe("fuseau de la ligne de date", () => {
  it("une borne au 1er du mois rend ce mois et non le precedent", () => {
    const l = ligneDate([projet({ startDate: "2024-03-01" })], "fr", tFaux);
    expect(l).toBe("mars 2024");
  });
});

describe("disposition du journal (cas de degradation)", () => {
  const p = (id: string, sortOrder: number) => projet({ id, sortOrder });

  it("ne rend rien sans projet", () => {
    expect(dispositionJournal([])).toBeNull();
  });

  it("un projet : une tete et une suite vide", () => {
    const d = dispositionJournal([p("a", 0)]);
    expect(d!.tete.id).toBe("a");
    expect(d!.suite).toEqual([]);
  });

  it("deux projets : une tete et une suite d'un", () => {
    const d = dispositionJournal([p("a", 0), p("b", 1)]);
    expect(d!.suite.map((x) => x.id)).toEqual(["b"]);
  });

  it("trois projets : une suite de deux", () => {
    const d = dispositionJournal([p("a", 0), p("b", 1), p("c", 2)]);
    expect(d!.suite.map((x) => x.id)).toEqual(["b", "c"]);
  });

  it("la tete est le plus petit sortOrder et non le premier recu", () => {
    const d = dispositionJournal([p("b", 5), p("a", 1), p("c", 9)]);
    expect(d!.tete.id).toBe("a");
    expect(d!.suite.map((x) => x.id)).toEqual(["b", "c"]);
  });

  it("ne mute pas le tableau recu", () => {
    const entree = [p("b", 5), p("a", 1)];
    dispositionJournal(entree);
    expect(entree.map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("journal des projets (spec section 6)", () => {
  const src = lire("components/parcours/journal-projets.tsx");
  const css = lire("app/globals.css");

  it("rend un bandeau ferme par un filet signifiant", () => {
    const m = /\.journal-bandeau\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .journal-bandeau introuvable").not.toBeNull();
    expect(m![1]).toContain("var(--bordure-signifiante)");
  });

  it("separe les colonnes par un filet decoratif", () => {
    const m = /\.journal-colonnes\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .journal-colonnes introuvable").not.toBeNull();
    expect(m![1]).toContain("var(--bordure)");
  });

  it("met en colonnes selon la mesure et non la largeur de fenetre", () => {
    // A 700 px de fenetre la mesure vaut 458 px : deux colonnes y donneraient
    // 213 px, soit 24 caracteres, ou l'on ne lit plus.
    const regle = blocs(/\.journal\s*\{/, css);
    expect(regle.some((b) => /container-type:\s*inline-size/.test(b))).toBe(true);
    const conteneur = blocs(/@container \(min-width:\s*520px\)\s*\{/, css);
    expect(conteneur.length, "aucun bloc @container 520 px").toBeGreaterThan(0);
    expect(conteneur.some((b) => /columns:\s*2/.test(b) && /column-rule:/.test(b))).toBe(true);
  });

  // Review Focus 4 : projet de tete sans photo1Path.
  it("ne reserve aucune place vide quand le projet de tete n a pas d image", () => {
    // `image` est nul quand la tete n'a pas de photo1Path : l'<Image> n'est
    // alors pas rendue.
    expect(src).toMatch(/\{image\s*&&\s*\(\s*<Image/);
  });

  it("ferme chaque article par la signature des technologies", () => {
    expect(src).toContain("journal-signature");
    expect(src).toContain('join(" · ")');
    expect(src).not.toMatch(/bg-(red|orange|yellow|green|blue)/);
  });

  it("ne cree aucun mouvement, ni dans le TSX ni dans les regles journal", () => {
    const sans = (t: string) =>
      t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const motif = /transition|animate-|animation|@keyframes/;
    expect(sans(src)).not.toMatch(motif);
    const regles = [...sans(css).matchAll(/\.journal[\w-]*[^{}]*\{[^{}]*\}/g)].map((m) => m[0]);
    expect(regles.length).toBeGreaterThan(0);
    for (const r of regles) expect(r).not.toMatch(motif);
  });

  it("souligne le lien de facon statique (second signal)", () => {
    const regles = blocs(/\.journal-lien\s*\{/, css);
    expect(regles.length).toBeGreaterThan(0);
    expect(regles[0]).toMatch(/text-decoration:\s*underline/);
    expect(regles[0]).toMatch(/text-underline-offset:\s*2px/);
  });

  it("n introduit ni tiret cadratin ni emoji", () => {
    for (const f of ["components/parcours/journal-projets.tsx", "lib/parcours/journal.ts"]) {
      const t = lire(f);
      expect(t, f).not.toContain("—");
      expect([...t].some((c) => c.codePointAt(0)! > 0x2500), f).toBe(false);
    }
  });
});

describe("lien de demonstration (rendu)", () => {
  const rendre = (p: Partial<ProjectDto>) =>
    renderToStaticMarkup(
      createElement(
        // `children` est requis par le type du fournisseur mais passe ici en
        // argument de createElement, comme l'exige la regle react/no-children-prop.
        I18nProvider as ComponentType<{ defaultLocale: string }>,
        { defaultLocale: "fr" },
        createElement(Article, { projet: projet(p), tete: false }),
      ),
    );

  it("ne rend aucune balise a quand demoUrl est nul", () => {
    expect(rendre({ demoUrl: null, description: "d" })).not.toMatch(/<a[\s>]/);
  });

  it("n'en rend pas non plus pour une chaine vide", () => {
    expect(rendre({ demoUrl: "", description: "d" })).not.toMatch(/<a[\s>]/);
  });

  it("porte href, target et rel sur la meme balise", () => {
    const html = rendre({ demoUrl: "https://exemple.test/demo", description: "d" });
    const balise = /<a\s[^>]*>/.exec(html)?.[0];
    expect(balise, "aucune balise a").toBeDefined();
    expect(balise).toContain('href="https://exemple.test/demo"');
    expect(balise).toContain('target="_blank"');
    expect(balise).toContain('rel="noopener noreferrer"');
    expect(balise).toContain('class="journal-lien"');
    expect(html).toContain("Voir la démo");
  });

  it("ordonne description, lien, signature des technologies", () => {
    const html = rendre({
      demoUrl: "https://exemple.test/demo",
      description: "DESCRIPTION",
      technologies: [{ id: "1", label: "React", logoPath: null, sortOrder: 0 }],
    });
    const d = html.indexOf("DESCRIPTION");
    const l = html.search(/<a[\s>]/);
    const s = html.indexOf("journal-signature");
    expect(d).toBeGreaterThan(-1);
    expect(l).toBeGreaterThan(d);
    expect(s).toBeGreaterThan(l);
  });
});
