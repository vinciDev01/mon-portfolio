import { describe, it, expect } from "vitest";
import { css as feuille, lire } from "./feuille-test";

/* Les commentaires sont retires avant toute lecture de selecteur : un mot
   cite dans un commentaire ne doit ni declencher ni masquer une regle. */
const css = feuille.replace(/\/\*[\s\S]*?\*\//g, "");

/** Corps de chaque bloc dont l'en-tete correspond. */
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

/** Chaque element d'une liste de selecteurs, separes par une virgule. */
const elements = (selecteur: string) =>
  selecteur.split(",").map((s) => s.trim()).filter(Boolean);

describe("repli sans JavaScript (spec section 6)", () => {
  it("la feuille ne tue jamais le defilement sans condition", () => {
    // Categorique : TOUTE regle visant html ou body et portant
    // overflow: hidden doit porter l'attribut SUR le meme element que html.
    // `[data-pagination="active"] html` exigerait un ancetre de la racine :
    // la regle ne s'appliquerait jamais, d'ou `html[...]` et non la simple
    // presence de la chaine.
    const regles = [...css.matchAll(/([^{}]*\b(?:html|body)\b[^{}]*)\{([^}]*)\}/g)];
    let verifiees = 0;
    for (const [, selecteur, corps] of regles) {
      if (!/overflow(-y)?:\s*hidden/.test(corps!)) continue;
      for (const el of elements(selecteur!)) {
        verifiees++;
        expect(el, `regle non conditionnee ou inapplicable : ${el}`)
          .toMatch(/^html\[data-pagination="active"\](\s+body)?$/);
      }
    }
    expect(verifiees, "aucune regle ne coupe le defilement du document")
      .toBeGreaterThan(0);
  });

  it("toute regle de pagination est sous data-pagination active", () => {
    // Categorique : chaque element de selecteur qui nomme une classe de
    // pagination porte l'attribut, y compris dans une liste a virgules.
    const CLASSES = [".section-paginee", ".parcours-pagine"];
    for (const classe of CLASSES) {
      const re = new RegExp(`([^{}]*${classe.replace(".", "\\.")}[^{}]*)\\{`, "g");
      for (const m of css.matchAll(re)) {
        for (const el of elements(m[1]!)) {
          if (!el.includes(classe)) continue;
          expect(el, `${classe} hors condition : ${el}`)
            .toMatch(/\[data-pagination="active"\]/);
        }
      }
    }
  });
});

describe("la transition (spec section 2.5)", () => {
  it("ne fait varier que l opacite, jamais une position", () => {
    const regles = blocs(/\.section-paginee[^{]*\{/, css);
    expect(regles.length, "aucune regle .section-paginee").toBeGreaterThan(0);
    for (const r of regles) {
      expect(r).not.toMatch(/transform|translate|scale\(/);
      for (const m of r.matchAll(/transition:\s*([a-z-]+)/g)) {
        expect(m[1], "la transition porte sur autre chose que l opacite")
          .toBe("opacity");
      }
    }
  });

  it("partage une seule duree entre la sortie et l entree", () => {
    expect(css).toMatch(/calc\(var\(--duree\)\s*\*\s*0?\.45\)/);
    expect(css).toMatch(/calc\(var\(--duree\)\s*\*\s*0?\.55\)/);
  });

  it("emploie la courbe du site et non une courbe propre", () => {
    const regles = blocs(/\.section-paginee[^{]*\{/, css);
    const avecTransition = regles.filter((r) => /transition:/.test(r));
    expect(avecTransition.length).toBeGreaterThan(0);
    for (const r of avecTransition) expect(r).toContain("var(--courbe)");
  });

  it("la section inactive quitte l arbre d accessibilite", () => {
    const regles = blocs(/\.section-paginee[^{]*\{/, css).join("\n");
    expect(regles).toMatch(/display:\s*none/);
  });
});

describe("mouvement reduit (spec section 2.5)", () => {
  it("les durees tombent a zero, avec l echappement du site", () => {
    const corps = blocs(/@media \(prefers-reduced-motion: reduce\)\s*\{/, css)
      .find((b) => b.includes("section-paginee"));
    expect(corps, "aucun bloc de mouvement reduit ne traite la pagination")
      .toBeDefined();
    expect(corps!).toMatch(/\[data-mouvement="force"\]/);
    expect(corps!).toMatch(/transition-duration:\s*0s/);
  });
});

describe("budget de mouvement (spec section 4)", () => {
  it("les deux toasts ne glissent plus, ils paraissent", () => {
    for (const nom of ["toast-enter", "toast-exit"]) {
      const corps = blocs(new RegExp(`@keyframes ${nom}\\s*\\{`), css);
      expect(corps.length, `${nom} a disparu`).toBe(1);
      for (const c of corps) {
        expect(c, nom).not.toMatch(/translate|scale\(|transform/);
      }
    }
  });

  it("la barre de progression garde son scaleX, seule exception nommee", () => {
    const corps = blocs(/@keyframes toast-progress\s*\{/, css);
    expect(corps.length, "toast-progress a disparu").toBe(1);
    expect(corps[0]).toMatch(/scaleX/);
  });

  it("le composant du toast configurable ne glisse plus", () => {
    const src = lire("components/portfolio/toast-notification.tsx");
    expect(src).not.toMatch(/slide-in|translate-/);
  });
});

describe("les retraits (spec section 3.1)", () => {
  it("l apparition des blocs a disparu de la feuille", () => {
    expect(css).not.toMatch(/\.reveal-visible|\.reveal\b/);
  });

  it("content-visibility ne survit pas a display none", () => {
    expect(css).not.toMatch(/content-visibility:\s*auto/);
  });
});
