import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { IMAGES_ALLUMAGE, IMAGES_EXTINCTION } from "@/lib/ampoule/animation";

/**
 * Palier de `--t-page`, derivation de la palette et ombres (tache 12,
 * addendum du controleur).
 *
 * Le test du palier est le plus important : une rampe de `--t-page` ferait
 * passer texte et fond par le gris (creux a 1,10:1), defaut invisible au
 * typecheck et visible seulement pendant une demi-seconde a l'ecran.
 */

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (relatif: string) => readFileSync(path.join(RACINE, relatif), "utf8");

const JEUX: Array<[string, Keyframe[], number]> = [
  ["allumage", IMAGES_ALLUMAGE, 0.2444],
  ["extinction", IMAGES_EXTINCTION, 0.4182],
];

describe("--t-page : un palier, pas une rampe", () => {
  it.each(JEUX)("%s : ne prend que les valeurs 0 et 1", (_nom, jeu) => {
    const valeurs = jeu.filter((k) => "--t-page" in k).map((k) => Number(k["--t-page"]));
    expect(valeurs.length).toBeGreaterThan(0);
    for (const v of valeurs) expect([0, 1]).toContain(v);
  });

  it.each(JEUX)("%s : le segment qui precede le saut porte steps(1, end)", (_nom, jeu) => {
    const pages = jeu.filter((k) => "--t-page" in k);
    for (let i = 0; i < pages.length - 1; i++) {
      if (pages[i]["--t-page"] !== pages[i + 1]["--t-page"]) {
        expect(pages[i].easing).toBe("steps(1, end)");
      }
    }
    // Aucune autre courbe sur une entree --t-page : jamais de rampe.
    for (const k of pages) {
      if (k.easing !== undefined) expect(k.easing).toBe("steps(1, end)");
    }
  });

  it.each(JEUX)("%s : le saut a lieu au bon offset", (_nom, jeu, offsetSaut) => {
    const pages = jeu.filter((k) => "--t-page" in k);
    const saut = pages.find((k, i) => i > 0 && k["--t-page"] !== pages[i - 1]["--t-page"]);
    expect(saut).toBeDefined();
    expect(Number(saut?.offset)).toBe(offsetSaut);
  });
});

describe("jetons de palette derives de --t-page", () => {
  const css = lire("app/globals.css");
  const JETONS = [
    "fond",
    "surface",
    "bordure",
    "bordure-signifiante",
    "texte-secondaire",
    "texte",
    "accent",
    "ombre-teinte",
  ];

  /** Corps des blocs dont le selecteur est exactement `.clair` ou `.sombre`
   *  (seuls, ou groupes avec :root). */
  function blocsDeClasse(): string[] {
    const blocs: string[] = [];
    for (const m of css.matchAll(/(?:^|\}|\*\/)\s*((?::root|\.clair|\.sombre)(?:\s*,\s*(?::root|\.clair|\.sombre))*)\s*\{([^}]*)\}/g)) {
      if (/\.clair|\.sombre/.test(m[1])) blocs.push(m[2]);
    }
    return blocs;
  }

  it("aucun jeton n'est defini sous .clair ni .sombre", () => {
    const blocs = blocsDeClasse();
    expect(blocs.length).toBeGreaterThan(0);
    for (const corps of blocs) {
      for (const j of JETONS) {
        expect(corps, `--${j} defini sous une classe de theme`).not.toMatch(
          new RegExp(`--${j}\\s*:`),
        );
      }
    }
  });

  it("chaque jeton est une paire -sombre/-clair sur :root, melangee selon --t-page", () => {
    for (const j of JETONS) {
      expect(css).toMatch(new RegExp(`--${j}-sombre\\s*:`));
      expect(css).toMatch(new RegExp(`--${j}-clair\\s*:`));
      expect(css).toMatch(
        new RegExp(`--${j}:\\s*color-mix\\(\\s*in oklch,\\s*var\\(--${j}-sombre\\),\\s*var\\(--${j}-clair\\) calc\\(var\\(--t-page\\) \\* 100%\\)`),
      );
    }
  });

  it("--t-page garde son repli : 0 sur :root, 1 sous .clair", () => {
    expect(css).toMatch(/:root,\s*\.sombre\s*\{[^}]*--t-page:\s*0;/);
    expect(css).toMatch(/\.clair\s*\{[^}]*--t-page:\s*1;/);
  });

  it("les trois ombres calculent leurs decalages sur --t-page", () => {
    for (const nom of ["proche", "moyenne", "lointaine"]) {
      const m = css.match(new RegExp(`--ombre-${nom}:([^;]*);`));
      expect(m, `--ombre-${nom} introuvable`).not.toBeNull();
      expect(m?.[1]).toContain("var(--t-page)");
      expect(m?.[1]).toContain("var(--ombre-teinte)");
    }
  });
});

describe("recensement des ombres", () => {
  function fichiers(dossier: string): string[] {
    const sortie: string[] = [];
    for (const nom of readdirSync(path.join(RACINE, dossier))) {
      if (nom === "node_modules") continue;
      const relatif = path.join(dossier, nom);
      if (statSync(path.join(RACINE, relatif)).isDirectory()) sortie.push(...fichiers(relatif));
      else if (/\.(tsx|css)$/.test(nom)) sortie.push(relatif);
    }
    return sortie;
  }
  const sources = [...fichiers("app"), ...fichiers("components")];

  it("aucune ombre ne porte de couleur litterale", () => {
    const fautes: string[] = [];
    for (const f of sources) {
      lire(f)
        .split("\n")
        .forEach((ligne, i) => {
          if (/shadow-\[/.test(ligne)) fautes.push(`${f}:${i + 1} ombre arbitraire`);
          if (/drop-shadow/.test(ligne)) fautes.push(`${f}:${i + 1} drop-shadow`);
        });
      if (f.endsWith(".css")) {
        // Toute declaration box-shadow (multi-lignes) : seuls les jetons
        // d'ombre et un liseré `inset` sont admis, jamais de couleur.
        for (const m of lire(f).matchAll(/box-shadow:([^;]*);/g)) {
          const termes = m[1].split(/,(?![^(]*\))/).map((t) => t.trim());
          for (const t of termes) {
            if (t === "none" || /^var\(--ombre-(proche|moyenne|lointaine)\)$/.test(t)) continue;
            if (/^inset\b/.test(t)) continue;
            // Halo de separation de l'anneau de focus (annexe lumiere §8.5) :
            // un anneau plein, sans flou, de la couleur du fond — pas une ombre.
            if (/^0 0 0 \d+px var\(--fond\)$/.test(t)) continue;
            fautes.push(`${f} box-shadow: ${t}`);
          }
        }
      }
    }
    expect(fautes).toEqual([]);
  });

  it("les utilitaires shadow-* de Tailwind pointent sur les jetons d'ombre", () => {
    const css = lire("app/globals.css");
    for (const [u, j] of [
      ["sm", "proche"],
      ["md", "moyenne"],
      ["lg", "lointaine"],
      ["xl", "lointaine"],
      ["2xl", "lointaine"],
    ]) {
      expect(css).toMatch(new RegExp(`--shadow-${u}:\\s*var\\(--ombre-${j}\\);`));
    }
  });
});
