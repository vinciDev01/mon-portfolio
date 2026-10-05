import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Garde-fous statiques, faute de navigateur : la boite du SVG (annexe §0),
 * les deux media queries d'accessibilite (§8.3, §8.4), les mitigations de
 * performance (§8.1) et l'interrupteur (§8.5).
 */
const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (relatif: string) => readFileSync(path.join(RACINE, relatif), "utf8");
const css = lire("app/globals.css");

/** Corps (accolades equilibrees) du premier bloc dont l'en-tete correspond. */
function bloc(entete: RegExp, source = css): string {
  const m = entete.exec(source);
  expect(m, `bloc ${entete} introuvable`).not.toBeNull();
  let profondeur = 0;
  for (let i = m!.index + m![0].length - 1; i < source.length; i++) {
    if (source[i] === "{") profondeur++;
    if (source[i] === "}" && --profondeur === 0) return source.slice(m!.index + m![0].length, i);
  }
  throw new Error(`bloc ${entete} non ferme`);
}

describe("boite du SVG (annexe §0)", () => {
  const regle = bloc(/\n  \.ampoule\s*\{/);
  it("`.ampoule` fixe width: 176px", () => expect(regle).toMatch(/(^|[;\s])width:\s*176px;/));
  it("`.ampoule` fixe height: 560px", () => expect(regle).toMatch(/(^|[;\s])height:\s*560px;/));
  it("`.ampoule` fixe overflow: visible", () => expect(regle).toMatch(/overflow:\s*visible;/));
});

describe("prefers-contrast: more (annexe §8.3)", () => {
  const corps = bloc(/@media \(prefers-contrast: more\)\s*\{/);
  it("redefinit le texte secondaire clair, le brin eteint et les bordures signifiantes", () => {
    expect(corps).toMatch(/--texte-secondaire-clair:\s*#4a4338;/i);
    expect(corps).toMatch(/--brin-eteint:\s*#8c8172;/i);
    expect(corps).toMatch(/--bordure-sombre:\s*var\(--bordure-signifiante-sombre\);/);
    expect(corps).toMatch(/--bordure-clair:\s*var\(--bordure-signifiante-clair\);/);
  });
  it("met a 0 l'opacite de la nappe (body::before) et de la moucheture", () => {
    expect(corps).toMatch(/body::before,\s*\.couche-moucheture\s*\{\s*opacity:\s*0;/);
  });
  it("ne depend d'aucune classe de theme", () => expect(corps).not.toMatch(/\.clair|\.sombre/));
  it("le brin eteint est consomme par la maille", () => {
    expect(lire("components/ampoule/maille.tsx")).toContain("var(--brin-eteint,");
  });
});

describe("forced-colors: active (annexe §8.4)", () => {
  const corps = bloc(/@media \(forced-colors: active\)\s*\{/);
  it("masque les couches L1 a L6", () => {
    for (const c of [".couche-lueur", ".couche-filament", ".couche-faisceau", ".couche-moucheture", "body::before"]) {
      expect(corps).toContain(c);
    }
    expect(corps).toMatch(/forced-color-adjust:\s*none;\s*opacity:\s*0;/);
  });
  it("rend le bouton en ButtonFace / ButtonText avec un contour de 2 px", () => {
    const b = bloc(/\.ampoule-interrupteur\s*\{/, corps);
    expect(b).toMatch(/background-color:\s*ButtonFace;/);
    expect(b).toMatch(/color:\s*ButtonText;/);
    expect(b).toMatch(/border:\s*2px solid ButtonText;/);
  });
  it("reduit la maille a son contour de dome, en CanvasText", () => {
    expect(bloc(/\.maille-rendue\s*\{/, corps)).toMatch(/display:\s*none;/);
    expect(bloc(/\.contour-dome-pictogramme\s*\{/, corps)).toMatch(/stroke:\s*CanvasText;/);
    expect(lire("components/ampoule/ampoule.tsx")).toContain('className="contour-dome-pictogramme"');
    expect(lire("components/ampoule/maille.tsx")).toContain('className="maille-rendue"');
  });
  it("ne depend d'aucune classe de theme", () => expect(corps).not.toMatch(/\.clair|\.sombre/));
});

describe("mitigations de performance (annexe §8.1)", () => {
  it("flou du faisceau : 26 px, ramene a 14 px sous 600 px, par variable CSS", () => {
    expect(css).toMatch(/\.faisceau-forme\s*\{\s*filter:\s*blur\(var\(--faisceau-flou,\s*26px\)\);/);
    const palier = bloc(/@media \(max-width: 599px\)\s*\{/);
    expect(palier).toMatch(/--faisceau-flou:\s*14px;/);
    expect(lire("components/ampoule/couches-lumiere.tsx")).not.toContain("stdDeviation={26}");
  });
  it("content-visibility: auto sur les sections 4 a 6", () => {
    const m = css.match(/(section\[data-rang="4"\],\s*section\[data-rang="5"\],\s*section\[data-rang="6"\])\s*\{([^}]*)\}/);
    expect(m).not.toBeNull();
    expect(m![2]).toMatch(/content-visibility:\s*auto;/);
    expect(lire("components/portfolio/section-shell.tsx")).toContain("data-rang={index}");
  });
});

describe("typographie : graisse du corps (annexe typographique §5)", () => {
  it("derivee de --t-page : 380 (sombre) a 400 (clair), jamais par classe", () => {
    expect(css).toMatch(/font-weight:\s*calc\(380 \+ 20 \* var\(--t-page, 0\)\);/);
    expect(css).not.toMatch(/\.(sombre|clair)[^{]*\{[^}]*font-weight/);
  });
});

describe("interrupteur (annexe §8.5)", () => {
  const src = lire("components/ampoule/interrupteur.tsx");
  it("est un switch au nom accessible fixe, etat par aria-checked", () => {
    expect(src).toContain('role="switch"');
    expect(src).toContain("aria-checked={allumee}");
    expect(src).toContain('aria-label="Éclairage de la page"');
    expect(src).not.toContain("aria-pressed");
  });
  it("annonce l'etat par un span aria-live=polite, hors hydratation", () => {
    expect(src).toMatch(/<span className="sr-only" aria-live="polite" suppressHydrationWarning>/);
    expect(src).toContain("Allumé — thème clair");
    expect(src).toContain("Éteint — thème sombre");
  });
  it("porte un anneau de focus double", () => {
    const f = bloc(/\.ampoule-interrupteur:focus-visible\s*\{/);
    expect(f).toMatch(/outline:\s*2px solid var\(--accent\);/);
    expect(f).toMatch(/outline-offset:\s*3px;/);
    expect(f).toMatch(/border-radius:\s*6px;/);
    expect(f).toMatch(/box-shadow:\s*0 0 0 5px var\(--fond\);/);
  });
});
