import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Garde typographique du depot : deux caracteres sont bannis des fichiers du
 * proprietaire.
 *
 * 1. U+2014, le tiret cadratin. En francais il n'a pas de remplacant mecanique :
 *    un trait d'union se lirait comme un mot compose (« la nuit - l'inverse »).
 *    La ponctuation se choisit selon la fonction de la phrase, et c'est
 *    precisement pour cela qu'on ne veut pas le voir revenir par inadvertance.
 * 2. U+2500, le trace de boite. Il ne servait qu'a decorer des lignes de
 *    separation en commentaire, que l'ASCII rend aussi bien.
 *
 * Les cinq gardes par fichier qui existaient avant celle-ci comparaient le
 * point de code avec un superieur STRICT a 0x2500 : le trace de boite, qui EST
 * U+2500, leur passait entre les doigts. Seuil corrige, et ce balayage global
 * prend le relais pour les fichiers qu'aucune garde ne nommait.
 *
 * Un echec nomme le FICHIER et la LIGNE : un message qui dit seulement qu'un
 * caractere interdit existe coute une demi-heure de recherche.
 */

const RACINE = path.resolve(import.meta.dirname, "../../..");

/** Les racines balayees : le code des deux applications et la documentation. */
const RACINES = ["frontend", "backend", "docs", "README.md"];

/**
 * Elagues PENDANT la descente, et non filtres apres : descendre dans
 * `node_modules` pour ecarter ses fichiers ensuite rendrait le balayage trop
 * lent pour une suite qui tourne a chaque sauvegarde.
 *
 * `.claude/skills/` est exclu parce que ces competences sont installees depuis
 * l'exterieur : leur mise a jour defferait le travail. Les racines ci-dessus ne
 * l'atteignent pas aujourd'hui ; l'exclusion reste pour le jour ou on les
 * elargira.
 */
const DOSSIERS_IGNORES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".turbo",
  "uploads",
]);
const CHEMINS_IGNORES = [path.join(".claude", "skills")];

/** Seuls les fichiers texte que le proprietaire ecrit lui-meme. */
const EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs|css|json|md|prisma|example|ya?ml)$/;

function fichiersDuDepot(): string[] {
  const trouves: string[] = [];

  const descendre = (relatif: string) => {
    if (CHEMINS_IGNORES.some((p) => relatif === p || relatif.startsWith(p + path.sep))) return;

    const absolu = path.join(RACINE, relatif);
    if (!statSync(absolu).isDirectory()) {
      if (EXTENSIONS.test(relatif)) trouves.push(relatif);
      return;
    }
    for (const entree of readdirSync(absolu)) {
      if (DOSSIERS_IGNORES.has(entree)) continue;
      descendre(path.join(relatif, entree));
    }
  };

  for (const racine of RACINES) descendre(racine);
  return trouves.sort();
}

const FICHIERS = fichiersDuDepot();

/** Chaque occurrence du caractere, reperee par fichier et par ligne. */
function occurrences(caractere: string): string[] {
  const fautes: string[] = [];
  for (const fichier of FICHIERS) {
    const texte = readFileSync(path.join(RACINE, fichier), "utf8");
    if (!texte.includes(caractere)) continue;
    texte.split("\n").forEach((ligne, i) => {
      const colonne = ligne.indexOf(caractere);
      if (colonne >= 0) fautes.push(`${fichier}:${i + 1}:${colonne + 1}`);
    });
  }
  return fautes;
}

describe("garde typographique du depot", () => {
  it("balaye bien les fichiers du proprietaire", () => {
    // Sans cette assertion, une erreur de chemin rendrait les deux tests
    // suivants verts en ne lisant rien du tout.
    expect(FICHIERS.length).toBeGreaterThan(100);
    expect(FICHIERS).toContain(path.join("frontend", "lib", "ampoule", "geometrie.ts"));
    expect(FICHIERS).toContain(path.join("backend", "src", "cv-generator", "cv-generator.service.ts"));
    expect(FICHIERS).toContain("README.md");
    expect(FICHIERS.some((f) => f.startsWith("docs" + path.sep))).toBe(true);
    // Et il n'emporte ni les dependances ni les competences tierces.
    expect(FICHIERS.some((f) => f.includes("node_modules"))).toBe(false);
    expect(FICHIERS.some((f) => f.includes(path.join(".claude", "skills")))).toBe(false);
  });

  it("ne laisse passer aucun tiret cadratin (U+2014)", () => {
    const fautes = occurrences(String.fromCodePoint(0x2014));
    expect(
      fautes,
      `tiret cadratin U+2014 interdit, employer deux-points, virgule ou parentheses selon la fonction de la phrase, jamais un trait d'union :\n${fautes.join("\n")}`,
    ).toEqual([]);
  });

  it("ne laisse passer aucun trace de boite (U+2500)", () => {
    const fautes = occurrences(String.fromCodePoint(0x2500));
    expect(
      fautes,
      `trace de boite U+2500 interdit, employer une decoration ASCII ou retirer la decoration :\n${fautes.join("\n")}`,
    ).toEqual([]);
  });
});
