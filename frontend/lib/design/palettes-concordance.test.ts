import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";

/**
 * Concordance des deux exemplaires des palettes : `lib/design/tokens.ts`
 * (teste par les tests de contraste) et `app/globals.css` (servi). Sans ce
 * test, la garantie des tests de contraste repose sur une synchronisation
 * manuelle.
 */
const RACINE = path.resolve(import.meta.dirname, "../..");
const css = readFileSync(path.join(RACINE, "app/globals.css"), "utf8");

const PAIRES: Array<[string, keyof typeof PALETTE_CLAIRE]> = [
  ["fond", "fond"],
  ["surface", "surface"],
  ["bordure", "bordure"],
  ["bordure-signifiante", "bordureSignifiante"],
  ["texte-secondaire", "texteSecondaire"],
  ["texte", "textePrincipal"],
  ["accent", "accent"],
];

describe("palettes : tokens.ts et globals.css concordent", () => {
  // Premiere declaration seulement : les surcharges de `prefers-contrast`
  // (annexe §8.3) viennent plus loin et sont volontairement differentes.
  const valeurCss = (jeton: string) =>
    css.match(new RegExp(`--${jeton}:\\s*(#[0-9a-fA-F]{6});`))?.[1].toLowerCase();

  it.each(PAIRES)("--%s-clair et --%s-sombre", (jeton, cle) => {
    expect(valeurCss(`${jeton}-clair`)).toBe(PALETTE_CLAIRE[cle].toLowerCase());
    expect(valeurCss(`${jeton}-sombre`)).toBe(PALETTE_SOMBRE[cle].toLowerCase());
  });
});
