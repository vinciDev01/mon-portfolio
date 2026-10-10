import { readFileSync } from "node:fs";
import path from "node:path";
import { expect } from "vitest";

/* Aides communes aux tests qui lisent la feuille de style. Les valeurs se
   lisent dans `globals.css` et ne se recopient pas : si un palier bouge, le
   calcul bouge avec lui. */

export const RACINE = path.resolve(import.meta.dirname, "../..");
export const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");
export const css = lire("app/globals.css");

/** Corps a accolades equilibrees ouvert a l'indice de l'accolade `depart`. */
export function corpsDepuis(source: string, depart: number): string {
  let profondeur = 0;
  for (let i = depart; i < source.length; i++) {
    if (source[i] === "{") profondeur++;
    if (source[i] === "}" && --profondeur === 0) return source.slice(depart + 1, i);
  }
  throw new Error("bloc non ferme a l'indice " + depart);
}

/** Corps du premier bloc dont l'en-tete correspond. */
export function bloc(entete: RegExp, source = css): string {
  const m = entete.exec(source);
  expect(m, `bloc ${entete} introuvable`).not.toBeNull();
  return corpsDepuis(source, m!.index + m![0].length - 1);
}

/** Derniere valeur declaree pour `prop` dans un corps de regle. */
export function valeur(corps: string, prop: string): string {
  const tous = [...corps.matchAll(new RegExp(`(?:^|[;{\\n])\\s*${prop}:\\s*([^;}]+)`, "g"))];
  expect(tous.length, `declaration ${prop} introuvable`).toBeGreaterThan(0);
  return tous[tous.length - 1]![1]!.trim();
}

/** Pixels d'une valeur litterale. `var(...)` n'en est pas une, et donne NaN. */
export function px(v: string): number {
  const m = /^(-?[\d.]+)px$/.exec(v.trim());
  return m ? Number(m[1]) : Number.NaN;
}

/** Le `:root` qui pose le palier par defaut de la colonne. */
export const racine = (() => {
  for (const m of css.matchAll(/:root\s*\{/g)) {
    const corps = corpsDepuis(css, m.index + m[0].length - 1);
    if (/--colonne:/.test(corps) && /--panneau-langue:/.test(corps)) return corps;
  }
  throw new Error(":root de la colonne introuvable");
})();

/** Les paliers de colonne (`min-width`), lus dans la feuille. */
export const PALIERS: Array<{ min: number; colonne: number }> = (() => {
  const out = [{ min: 0, colonne: px(valeur(racine, "--colonne")) }];
  for (const m of css.matchAll(/@media \(min-width:\s*(\d+)px\)\s*\{/g)) {
    const corps = corpsDepuis(css, m.index + m[0].length - 1);
    const v = /--colonne:\s*([\d.]+px)/.exec(corps);
    if (v) out.push({ min: Number(m[1]), colonne: px(v[1]!) });
  }
  return out.sort((a, b) => a.min - b.min);
})();

/**
 * Valeur litterale d'une variable de `:root` a une largeur donnee : la
 * declaration de base, puis chaque `@media (min-width)` applicable par seuil
 * croissant, puis chaque `@media (max-width)` applicable du plus large au plus
 * etroit (cascade d'une feuille ecrite en `max-width`). `undefined` si la
 * variable n'est declaree a aucun palier applicable.
 */
export function declareeA(nom: string, largeur: number): string | undefined {
  const regles: Array<{ ordre: number; corps: string }> = [];
  for (const m of css.matchAll(/:root\s*\{/g)) {
    const corps = corpsDepuis(css, m.index + m[0].length - 1);
    if (!new RegExp(`${nom}:`).test(corps)) continue;
    const med = /@media \((min|max)-width:\s*(\d+)px\)\s*\{\s*$/.exec(css.slice(0, m.index));
    if (!med) regles.push({ ordre: -1, corps });
    else if (med[1] === "min" && largeur >= Number(med[2])) {
      regles.push({ ordre: Number(med[2]), corps });
    } else if (med[1] === "max" && largeur <= Number(med[2])) {
      regles.push({ ordre: 100000 - Number(med[2]), corps });
    }
  }
  regles.sort((a, b) => a.ordre - b.ordre);
  let courant: string | undefined;
  for (const r of regles) {
    const m = new RegExp(`${nom}:\\s*([^;]+);`).exec(r.corps);
    if (m) courant = m[1]!.trim();
  }
  return courant;
}

/** Valeur numerique d'une variable en pixels ou sans unite (`repli` si absente). */
export function variableA(nom: string, largeur: number, repli = Number.NaN): number {
  const v = declareeA(nom, largeur);
  return v === undefined ? repli : Number(v.replace("px", ""));
}

/**
 * Gouttiere gauche du contenu (`--contenu-gauche`) : evalue la somme que la
 * feuille declare, en remplacant les variables par leur valeur au palier.
 */
export function contenuGaucheA(largeur: number): number {
  const decl = declareeA("--contenu-gauche", largeur)!;
  const somme = /^calc\((.*)\)$/.exec(decl)![1]!;
  return somme.split("+").reduce((t, terme) => {
    const v = /var\((--[a-z-]+)\)/.exec(terme);
    return t + (v ? variableA(v[1]!, largeur) : px(terme.trim()));
  }, 0);
}
