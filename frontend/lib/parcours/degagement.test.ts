import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const RACINE = path.resolve(import.meta.dirname, "../..");
const css = readFileSync(path.join(RACINE, "app/globals.css"), "utf8");

/** Corps a accolades equilibrees du premier bloc dont l'en-tete correspond. */
function bloc(entete: RegExp, source = css): string {
  const m = entete.exec(source);
  expect(m, `bloc ${entete} introuvable`).not.toBeNull();
  let profondeur = 0;
  for (let i = m!.index + m![0].length - 1; i < source.length; i++) {
    if (source[i] === "{") profondeur++;
    if (source[i] === "}" && --profondeur === 0) {
      return source.slice(m!.index + m![0].length, i);
    }
  }
  throw new Error(`bloc ${entete} non ferme`);
}

const CH = 8.73;
const OBJET = 172;
const GARDE = 16;
const PLEINE = 576;
const PLANCHER = 358;

/** Reproduit la formule de la spec, section 4.2. */
function geometrie(largeur: number) {
  const colonne = largeur >= 1200 ? 240 : largeur >= 1024 ? 160 : largeur >= 600 ? 72 : 40;
  const gouttiere = largeur >= 1024 ? 64 : 32;
  const x0 = colonne > 72 ? colonne + gouttiere : colonne + GARDE;
  const [droite, echelle] =
    largeur >= 1440 ? [48, 1.0]
    : largeur >= 1200 ? [40, 1.0]
    : largeur >= 900 ? [32, 0.82]
    : largeur >= 600 ? [24, 0.66]
    : largeur >= 360 ? [16, 0.5]
    : [12, 0.44];
  const C = largeur - x0 - gouttiere;
  const A = C + gouttiere - droite - OBJET * echelle - GARDE;
  const mesure = Math.min(C, Math.max(PLANCHER, Math.min(PLEINE, A)));
  const ampouleGauche = largeur - droite - OBJET * echelle;
  return { colonne, gouttiere, x0, C, A, mesure, ampouleGauche };
}

describe("regle de degagement (spec section 4.2)", () => {
  it("reproduit la table de la spec, section 4.3", () => {
    const attendu: Array<[number, number, number]> = [
      // largeur, mesure en px, garde en px
      [1440, 576, 340],
      [1200, 576, 108],
      [1024, 576, 51],
      [900, 576, 63],
      [700, 458, 16],
      [600, 358, 16],
      [599, 425, 16],
      [360, 272, -70],
    ];
    for (const [largeur, mesure, garde] of attendu) {
      const g = geometrie(largeur);
      expect(Math.round(g.mesure), `mesure a ${largeur}`).toBe(mesure);
      expect(Math.round(g.ampouleGauche - (g.x0 + g.mesure)), `garde a ${largeur}`).toBe(garde);
    }
  });

  it("corrige le defaut existant des 11 px au palier 900", () => {
    // Avant cette spec : bloc de rang pair 162 a 738, ampoule a partir de 727.
    const g = geometrie(900);
    expect(g.ampouleGauche - (g.x0 + g.mesure)).toBeGreaterThanOrEqual(GARDE);
  });

  it("ne descend jamais sous 31 caracteres, meme a 320 px", () => {
    for (const largeur of [320, 360, 420, 480, 540]) {
      expect(geometrie(largeur).mesure / CH).toBeGreaterThanOrEqual(31);
    }
  });

  it("la feuille exprime le degagement sans 100vw", () => {
    // `100vw` inclut la barre de defilement la ou l'ampoule, element fixe, est
    // ancree sans elle : la formule doit partir du bord droit du conteneur.
    const corps = bloc(/\.bloc-parcours\s*\{/);
    expect(corps).toContain("--degagement");
    expect(corps).not.toContain("100vw");
  });

  it("la feuille borne la mesure par le plancher et la pleine mesure", () => {
    const corps = bloc(/\.bloc-parcours\s*\{/);
    expect(corps).toMatch(/--mesure-courante:\s*min\(\s*100%/);
    expect(corps).toContain("41ch");
    expect(corps).toContain("66ch");
  });

  it("le decalage du zigzag est plafonne et reste pilote par le reglage", () => {
    const corps = bloc(/\.bloc-parcours\[data-cote="droite"\]\s*\{/);
    expect(corps).toContain("--portfolio-zigzag");
    expect(corps).toMatch(/margin-inline-start:\s*max\(\s*0px/);
    expect(corps).toContain("var(--degagement)");
  });

  it("le defilement souple repasse en auto sous mouvement reduit", () => {
    // Manquement preexistant : `scroll-behavior: smooth` etait pose sur `html`
    // sans aucun garde-fou. La spec, section 5.3, l'exige.
    const m = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g;
    const blocs = [...css.matchAll(m)].map((x) => x[1]);
    expect(
      blocs.some((b) => /scroll-behavior:\s*auto/.test(b)),
      "aucun bloc de mouvement reduit ne repasse scroll-behavior en auto",
    ).toBe(true);
  });

  it("honore la derogation du backoffice au mouvement reduit", () => {
    // `data-mouvement="force"` permet au proprietaire de passer outre la
    // preference systeme, et la feuille l'honore deja ailleurs.
    const m = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g;
    const blocs = [...css.matchAll(m)].map((x) => x[1]);
    const celui = blocs.find((b) => /scroll-behavior:\s*auto/.test(b));
    expect(celui).toContain('[data-mouvement="force"]');
  });
});
