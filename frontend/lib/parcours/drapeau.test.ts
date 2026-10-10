import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";
import { tableDesContenus } from "./feuille-test";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");
const src = lire("components/parcours/drapeau-disponibilite.tsx");
const css = lire("app/globals.css");

function lum(hex: string): number {
  const n = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)];
  const [h, l] = x > y ? [x, y] : [y, x];
  return (h + 0.05) / (l + 0.05);
}

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

const sansCommentaires = src
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

describe("drapeau au mat (spec section 7)", () => {
  it("declare sa boite, width height et overflow", () => {
    const m = /\.drapeau-disponibilite\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .drapeau-disponibilite introuvable").not.toBeNull();
    expect(m![1]).toMatch(/width:/);
    expect(m![1]).toMatch(/height:/);
    expect(m![1]).toMatch(/overflow:\s*visible/);
  });

  it("porte une queue d aronde et un galbe, pas un rectangle", () => {
    // Deux pointes au bord libre, et des courbes sur les bords haut et bas.
    expect(src).toContain("CHEMIN_DRAPEAU");
    const chemin = /const CHEMIN_DRAPEAU =([\s\S]*?);/.exec(src);
    expect(chemin, "CHEMIN_DRAPEAU introuvable").not.toBeNull();
    expect(chemin![1]).toMatch(/\bC\s/); // galbe des bords haut et bas
    expect(chemin![1]).toContain("L 200 14"); // premiere pointe
    expect(chemin![1]).toContain("L 200 42"); // seconde pointe
    expect(chemin![1]).toContain("L 176 28"); // encoche entre les pointes
  });

  it("ne porte aucune animation : le vent est dans le trace", () => {
    expect(sansCommentaires).not.toMatch(/transition|animate-|animation|@keyframes/);
  });

  it("tient 4,5:1 pour son texte dans les deux palettes", () => {
    expect(ratio(PALETTE_CLAIRE.accent, PALETTE_CLAIRE.fond)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(PALETTE_SOMBRE.accent, PALETTE_SOMBRE.fond)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(PALETTE_CLAIRE.texteSecondaire, PALETTE_CLAIRE.fond)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(PALETTE_SOMBRE.texteSecondaire, PALETTE_SOMBRE.fond)).toBeGreaterThanOrEqual(4.5);
  });

  it("n emploie aucune couleur d alerte", () => {
    // Contextes de couleur uniquement : « centered » ou « colored » ne comptent pas.
    const couleurs = [
      ...sansCommentaires.matchAll(/(?:fill|stroke|color|background)[=:]\s*[{"']*([^;}\n]*)/gi),
    ].map((m) => m[1]).join(" ");
    expect(couleurs).not.toMatch(/\b(red|orange|crimson|tomato)\b|#f0|#e4001|destructive/i);
    expect(css.match(/\.drapeau-[a-z]+\s*\{[^}]*\}/g)?.join(" ") ?? "")
      .not.toMatch(/\b(red|orange|crimson|tomato)\b|destructive/i);
  });

  // Review Focus 2 : un libelle de disponibilite tres long.
  it("borne le texte a deux lignes et garde le libelle complet accessible", () => {
    const m = /\.drapeau-texte\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .drapeau-texte introuvable").not.toBeNull();
    expect(m![1]).toMatch(/-webkit-line-clamp:\s*2/);
    expect(src).toMatch(/aria-label=\{libelleComplet\}/);
  });

  it("n expose qu un seul nom accessible : le guidon est masque de base", () => {
    const m = /\.drapeau-guidon\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle de base .drapeau-guidon introuvable").not.toBeNull();
    expect(m![1]).toMatch(/display:\s*none/);
  });

  it("a une boite fluide : aucune largeur fixe en pixels, un max-width", () => {
    const toile = /\.drapeau-disponibilite\s*\{([^}]*)\}/.exec(css)![1];
    expect(toile).not.toMatch(/width:\s*\d+px/);
    const mat = /\.mat-disponibilite\s*\{([^}]*)\}/.exec(css)![1];
    const max = /max-width:\s*(\d+)px/.exec(mat);
    expect(max, "max-width absent de .mat-disponibilite").not.toBeNull();
    // Largeur utile au premier palier ou le drapeau s'affiche (1024 px) :
    // colonne lue dans la feuille, moins 2 x 16 de padding et 1 de bordure.
    // Si elle est inferieure a la boite, la largeur ne peut pas etre fixe.
    const palier = blocs(/@media \(min-width: 1024px\)\s*\{/, css)
      .map((b) => /--colonne:\s*(\d+)px/.exec(b)).find(Boolean);
    expect(palier, "palier de 1024 px introuvable").toBeTruthy();
    const utile = Number(palier![1]) - 2 * 16 - 1;
    if (utile < Number(max![1])) {
      expect(toile).not.toMatch(/(?<!max-)width:\s*\d+px/);
    }
    expect(src).toContain('preserveAspectRatio="none"');
    const texte = /\.drapeau-texte\s*\{([^}]*)\}/.exec(css)![1];
    expect(texte).toMatch(/position:\s*relative/);
    expect(texte).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it("se replie en guidon sans texte sous 1024 px", () => {
    expect(src).toContain("guidon");
    const repli = blocs(/@media \(max-width: 1023px\)\s*\{/, css)
      .find((b) => b.includes(".drapeau-toile"));
    expect(repli, "aucun bloc 1023 px ne replie le drapeau").toBeDefined();
    expect(repli!).toMatch(/\.drapeau-toile\s*\{[^}]*display:\s*none/);
    expect(repli!).toMatch(/\.drapeau-guidon\s*\{[^}]*display:\s*block/);
    expect(repli!).toMatch(/\.drapeau-texte\s*\{[^}]*display:\s*none/);
  });

  it("reporte le message dans le contenu de l ouverture, qui est inconditionnelle", () => {
    const page = lire("app/page.tsx");
    const ouverture = tableDesContenus().find((e) => e.id === "ouverture")!;
    const i = ouverture.texte.indexOf("<LigneDisponibilite");
    expect(i, "la ligne n'est pas dans l'entree ouverture").toBeGreaterThan(-1);
    // Aucune condition d'affichage ne l'enveloppe : elle survit aux reglages.
    expect(ouverture.texte.slice(0, i)).not.toMatch(/show[A-Z]\w+\s*&&/);
    // Et elle n'est plus un enfant de <main> place au-dessus des sections, qui
    // prendrait de la hauteur a des sections calibrees sur celle de la fenetre.
    const horsTable = page.slice(0, page.indexOf("const enfants")) + page.slice(page.indexOf("return (", page.indexOf("const enfants")));
    expect(horsTable).not.toContain("<LigneDisponibilite");
    expect(lire("components/portfolio/presentation-section.tsx"))
      .not.toContain("LigneDisponibilite");
  });

  it("l ancien badge a bien ete depose", () => {
    expect(() => lire("components/portfolio/availability-badge.tsx")).toThrow();
  });

  it("n introduit ni tiret cadratin ni emoji", () => {
    expect(src).not.toContain("\u2014");
    expect([...src].some((c) => c.codePointAt(0)! > 0x2500)).toBe(false);
  });
});
