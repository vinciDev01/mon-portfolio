import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";
import { bloc, tableDesContenus } from "./feuille-test";

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

describe("panneau de disponibilite", () => {
  it("est un rectangle aux bords irreguliers : aucun bord droit d un coin a l autre", () => {
    const chemin = /const CHEMIN_PANNEAU =([\s\S]*?);/.exec(src);
    expect(chemin, "CHEMIN_PANNEAU introuvable").not.toBeNull();
    const points = [...chemin![1]!.matchAll(/[ML] ([\d.]+) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    // Des points intermediaires sur chaque bord : il ondule.
    expect(points.length).toBeGreaterThanOrEqual(10);
    // Mais a peine : aucun point ne s'ecarte de plus de 3 unites de la boite 200 x 48.
    for (const [x, y] of points) {
      const ecart = Math.min(Math.abs(x!), Math.abs(200 - x!), Math.abs(y!), Math.abs(48 - y!));
      expect(ecart, `point ${x} ${y}`).toBeLessThanOrEqual(3);
    }
    expect(src).toContain('preserveAspectRatio="none"');
  });

  it("a pour fond l accent et pour texte la couleur du fond de page", () => {
    expect(bloc(/\.panneau-fond path\s*\{/)).toMatch(/fill:\s*var\(--accent\)/);
    expect(bloc(/\.panneau-texte\s*\{/)).toMatch(/color:\s*var\(--fond\)/);
  });

  it("tient 4,5:1 pour son texte dans les deux palettes", () => {
    expect(ratio(PALETTE_CLAIRE.accent, PALETTE_CLAIRE.fond)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(PALETTE_SOMBRE.accent, PALETTE_SOMBRE.fond)).toBeGreaterThanOrEqual(4.5);
  });

  it("ne porte aucune animation ni couleur d alerte", () => {
    expect(sansCommentaires).not.toMatch(/transition|animate-|animation|@keyframes/);
    const regles = css.match(/\.panneau-[a-z]+[^{]*\{[^}]*\}/g)?.join(" ") ?? "";
    expect(regles).not.toMatch(/transition|animation|gradient/);
    expect(regles).not.toMatch(/\b(red|orange|crimson|tomato)\b|destructive/i);
  });

  // Un libelle de disponibilite tres long.
  it("borne le libelle a deux lignes", () => {
    const b = bloc(/\.panneau-texte\s*\{/);
    expect(b).toMatch(/-webkit-line-clamp:\s*2/);
    expect(b).toMatch(/overflow-wrap:\s*anywhere/);
    expect(b).toMatch(/position:\s*relative/);
  });

  it("a une boite fluide : un max-width, aucune largeur fixe", () => {
    const b = bloc(/\.panneau-disponibilite\s*\{/);
    expect(b).toMatch(/max-width:\s*\d+px/);
    expect(b).not.toMatch(/(?<!max-)width:\s*\d+px/);
  });

  it("n expose le panneau replie que sous 1024 px", () => {
    expect(bloc(/\.panneau-replie\s*\{/)).toMatch(/display:\s*none/);
  });

  it("sous 1024 px se replie en carre, le texte reste lu", () => {
    const repli = blocs(/@media \(max-width: 1023px\)\s*\{/, css)
      .find((b) => b.includes(".panneau-disponibilite"));
    expect(repli, "aucun bloc 1023 px ne replie le panneau").toBeDefined();
    expect(repli!).toMatch(/\.panneau-plein\s*\{[^}]*display:\s*none/);
    expect(repli!).toMatch(/\.panneau-replie\s*\{[^}]*display:\s*block/);
    // Masque a l'oeil, pas par display: none qui l'oterait des lecteurs d'ecran.
    expect(repli!).toMatch(/\.panneau-texte\s*\{[^}]*clip-path:\s*inset\(50%\)/);
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
    expect([...src].some((c) => c.codePointAt(0)! >= 0x2500)).toBe(false);
  });
});
