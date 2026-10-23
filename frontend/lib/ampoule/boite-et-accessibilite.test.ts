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
  /** Corps de la derniere regle de `corps` dont le selecteur contient `sel`,
   *  quel que soit le groupement ou l'ordre des selecteurs voisins. */
  const regleAvec = (sel: string) => {
    const re = /([^{}]+)\{([^{}]*)\}/g;
    const sansCommentaires = corps.replace(/\/\*[\s\S]*?\*\//g, "");
    const trouvees = [...sansCommentaires.matchAll(re)].filter((m) =>
      m[1]!.split(",").some((x) => x.trim() === sel),
    );
    expect(trouvees.length, `aucune regle pour ${sel}`).toBeGreaterThan(0);
    return trouvees.map((m) => m[2]!).join("\n");
  };
  it("force la propriete non forcee du drapeau : fill Highlight, texte HighlightText", () => {
    // `color` est force, le `fill` SVG ne l'est pas. La paire Highlight /
    // HighlightText est celle que le mode garantit lisible.
    for (const sel of [".drapeau-toile path", ".drapeau-guidon path"]) {
      expect(regleAvec(sel), sel).toMatch(/fill:\s*Highlight\s*;/);
    }
    expect(regleAvec(".drapeau-texte")).toMatch(/color:\s*HighlightText\s*;/);
  });
  it("ne sort pas le drapeau du mode force : l'accent de l'auteur n'y revient pas", () => {
    for (const sel of [".drapeau-toile path", ".drapeau-guidon path", ".drapeau-texte"]) {
      expect(regleAvec(sel), sel).not.toMatch(/forced-color-adjust/);
    }
  });
  it("garde un indicateur de position : seule l entree courante est encadree", () => {
    // Le mode force rendrait CanvasText les cadres transparents eux-memes :
    // toutes les entrees seraient encadrees, la position ne se lirait plus.
    expect(regleAvec(".entree-parcours")).toMatch(/border-color:\s*Canvas\s*;/);
    expect(regleAvec('.entree-parcours[aria-current="true"]')).toMatch(
      /border-color:\s*CanvasText\s*;/,
    );
  });
  it("ne depend d'aucune classe de theme", () => expect(corps).not.toMatch(/\.clair|\.sombre/));
});

describe("mitigations de performance (annexe §8.1)", () => {
  it("flou du faisceau : 26 px, ramene a 14 px sous 600 px, par variable CSS", () => {
    expect(css).toMatch(/\.faisceau-forme\s*\{\s*filter:\s*blur\(var\(--faisceau-flou,\s*26px\)\);/);
    // Le `:root` est nomme dans l'en-tete : la colonne de passage pose elle
    // aussi un palier a 599 px, et viser le premier `@media` seul tombait sur
    // le sien.
    const palier = bloc(/@media \(max-width: 599px\)\s*\{\s*:root\s*\{/);
    expect(palier).toMatch(/--faisceau-flou:\s*14px;/);
    expect(lire("components/ampoule/couches-lumiere.tsx")).not.toContain("stdDeviation={26}");
  });
  it("le flou porte sur le <path> masque lui-meme, et non sur un groupe englobant", () => {
    // L'ordre de rendu SVG est : filtre, PUIS masque. Tant que `.faisceau-forme`
    // est sur le <path> qui porte `mask=`, le flou de forme s'applique avant la
    // penombre laterale de 18 px, comme a l'origine ou le filtre etait un
    // attribut SVG. Deplacer la classe sur un <g> ou sur le <svg> inverserait
    // l'ordre : la penombre serait refloutee, et l'effet se perdrait sans
    // qu'aucun autre test ne bronche.
    const src = lire("components/ampoule/couches-lumiere.tsx");
    const i = src.indexOf('className="faisceau-forme"');
    expect(i, "classe faisceau-forme introuvable").toBeGreaterThan(-1);
    const ouverture = src.lastIndexOf("<", i);
    const element = src.slice(ouverture, src.indexOf("/>", i) + 2);
    expect(element.startsWith("<path"), `porte par ${element.slice(0, 24)}…`).toBe(true);
    expect(element).toMatch(/mask=\{/);
  });

  it("content-visibility a ete retire : visibility le supplante (transition.test.ts le garde)", () => {
    expect(css).not.toMatch(/content-visibility:\s*auto/);
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
  it("annonce l'etat par un span aria-live=polite, sans masquer l'hydratation", () => {
    // `suppressHydrationWarning` a ete retire : le premier rendu client
    // rend desormais le meme etat que le serveur (etat initial deterministe
    // du fournisseur de theme, voir lib/theme/hydratation.test.ts), donc il
    // n'y a plus de divergence a declarer legitime. En masquer une
    // laisserait le libelle du serveur en place, donc faux.
    expect(src).toMatch(/<span className="sr-only" aria-live="polite">/);
    expect(src).toContain("Allumé, thème clair");
    expect(src).toContain("Éteint, thème sombre");
  });
  it("porte un anneau de focus double", () => {
    const f = bloc(/\.ampoule-interrupteur:focus-visible\s*\{/);
    expect(f).toMatch(/outline:\s*2px solid var\(--accent\);/);
    expect(f).toMatch(/outline-offset:\s*3px;/);
    expect(f).toMatch(/border-radius:\s*6px;/);
    expect(f).toMatch(/box-shadow:\s*0 0 0 5px var\(--fond\);/);
  });
});
