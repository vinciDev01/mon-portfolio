import { describe, it, expect } from "vitest";
import { css as feuille, lire } from "./feuille-test";

/* Les commentaires sont retires avant toute lecture de selecteur : un mot
   cite dans un commentaire ne doit ni declencher ni masquer une regle. */
const sansCommentaires = feuille.replace(/\/\*[\s\S]*?\*\//g, "");

/** Le bloc `@media print`, traite a part : il neutralise la pagination. */
const [BLOC_IMPRESSION = ""] = blocs(/@media print\s*\{/, sansCommentaires);
/** La source COMPLETE : les interdictions categoriques la lisent entiere, un
 *  mouvement ou un `display: none` cache sous `@media print` doit etre vu. */
const css = sansCommentaires;
/** Sans le bloc d'impression : pour les assertions qui decrivent la forme
 *  exacte de la transition a l'ecran. */
const cssEcran = sansCommentaires.replace(`@media print {${BLOC_IMPRESSION}}`, "");

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

/** Decoupe une liste a la virgule, hors parentheses. */
function membres(valeur: string): string[] {
  const out: string[] = [];
  let profondeur = 0;
  let courant = "";
  for (const c of valeur) {
    if (c === "(") profondeur++;
    if (c === ")") profondeur--;
    if (c === "," && profondeur === 0) {
      out.push(courant.trim());
      courant = "";
    } else courant += c;
  }
  if (courant.trim()) out.push(courant.trim());
  return out;
}

const norm = (v: string) => v.replace(/\s+/g, " ").trim();

/** Les corps des regles dont le selecteur nomme `.section-paginee`. */
const reglesDe = (source: string) =>
  [...source.matchAll(/([^{}]*\.section-paginee[^{}]*)\{([^}]*)\}/g)].map((m) => ({
    selecteur: norm(m[1]!),
    corps: m[2]!,
  }));

const reglesSections = () => reglesDe(cssEcran);
const reglesToutes = () => reglesDe(css);

/** La regle de base : sous l'attribut de pagination, sans `data-active`. */
const base = () =>
  reglesSections().find(
    (r) => /\[data-pagination="active"\]/.test(r.selecteur) && !/data-active/.test(r.selecteur) && !r.selecteur.includes(":root"),
  );
const active = () =>
  reglesSections().find((r) => /\[data-active="true"\]/.test(r.selecteur));

describe("repli sans JavaScript (spec section 6)", () => {
  it("la feuille ne tue jamais le defilement sans condition", () => {
    // Categorique : TOUTE regle visant html ou body et portant
    // overflow: hidden doit porter l'attribut SUR le meme element que html.
    // `[data-pagination="active"] html` exigerait un ancetre de la racine :
    // la regle ne s'appliquerait jamais, d'ou `html[...]` et non la simple
    // presence de la chaine.
    const regles = [
      ...css.matchAll(/([^{}]*(?:\bhtml\b|\bbody\b|:root)[^{}]*)\{([^}]*)\}/g),
    ];
    let verifiees = 0;
    for (const [, selecteur, corps] of regles) {
      // Tout ce qui peut figer le document : l'une des trois proprietes de
      // debordement, qu'elle vale hidden, clip, auto ou scroll, ou une hauteur.
      const fige = /(?:^|[;\s])(?:overflow(?:-x|-y)?:\s*(?:hidden|clip|auto|scroll)|height:)/.test(corps!);
      if (!fige) continue;
      for (const el of elements(selecteur!)) {
        // Un `body::before` ou un `:root` pose des variables, pas une hauteur
        // de document : seuls les elements racine ou corps eux-memes comptent.
        if (!/^(?:html|body|:root)(?:\[[^\]]*\]|:not\([^)]*\))*$|^(?:html|:root)\S*\s+body$/.test(el)) continue;
        verifiees++;
        expect(el, `regle non conditionnee ou inapplicable : ${el}`)
          .toMatch(/^(?:html|:root)\[data-pagination="active"\](\s+body)?$/);
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

describe("l'impression (spec section 6, cinquieme cout accepte)", () => {
  it("neutralise la pagination comme le repli sans JavaScript", () => {
    expect(BLOC_IMPRESSION, "bloc @media print introuvable").not.toBe("");
    const b = norm(BLOC_IMPRESSION);
    expect(b).toMatch(/html\[data-pagination="active"\],\s*html\[data-pagination="active"\] body\s*\{\s*overflow:\s*auto/);
    const sections = /\.section-paginee\s*\{([^}]*)\}/.exec(BLOC_IMPRESSION)![1]!;
    expect(sections).toMatch(/position:\s*static/);
    expect(sections).toMatch(/visibility:\s*visible/);
    expect(sections).toMatch(/opacity:\s*1\b/);
    expect(sections).toMatch(/overflow:\s*visible/);
  });
});

describe("la transition (spec section 2.5)", () => {
  it("ne fait varier que l opacite et la visibilite, jamais une position", () => {
    // Interdiction categorique : source complete, impression comprise.
    for (const { selecteur, corps } of reglesToutes()) {
      expect(corps, selecteur).not.toMatch(/transform|translate|scale/);
    }
    const regles = reglesSections();
    expect(regles.length, "aucune regle .section-paginee").toBeGreaterThan(0);
    for (const { selecteur, corps } of regles) {
      // Raccourci : chaque membre de la liste, pas seulement le premier.
      for (const m of corps.matchAll(/(?:^|[;\s])transition:\s*([^;]+);/g)) {
        for (const membre of membres(m[1]!)) {
          const prop = membre.split(/\s+/)[0]!;
          expect(["opacity", "visibility"], `${selecteur} : ${membre}`).toContain(prop);
          // La visibilite n'est pas un mouvement : elle ne dure jamais.
          if (prop === "visibility") expect(membre).toMatch(/^visibility\s+0s\b/);
        }
      }
      // Forme longue.
      for (const m of corps.matchAll(/transition-property:\s*([^;]+);/g)) {
        for (const prop of membres(m[1]!)) {
          expect(["opacity", "visibility"], `${selecteur} : transition-property ${prop}`).toContain(prop);
        }
      }
    }
  });

  it("partage une seule duree entre la sortie et l entree", () => {
    expect(css).toMatch(/calc\(var\(--duree\)\s*\*\s*0?\.45\)/);
    expect(css).toMatch(/calc\(var\(--duree\)\s*\*\s*0?\.55\)/);
  });

  it("emploie la courbe du site et non une courbe propre", () => {
    const avecTransition = reglesSections().filter((r) => /transition:/.test(r.corps));
    expect(avecTransition.length).toBeGreaterThan(0);
    for (const r of avecTransition) {
      const opacite = membres(/transition:\s*([^;]+);/.exec(r.corps)![1]!).find((m) => m.startsWith("opacity"))!;
      expect(opacite, r.selecteur).toContain("var(--courbe)");
      expect(r.corps).not.toMatch(/cubic-bezier|ease(?:-in|-out)?\b/);
    }
  });

  it("la section inactive quitte l arbre d accessibilite sans display none", () => {
    const b = base();
    expect(b, "regle de base introuvable").toBeDefined();
    expect(b!.corps).toMatch(/visibility:\s*hidden/);
    // display: none couperait le fondu sortant : aucune regle ne l'emploie.
    for (const r of reglesToutes()) expect(r.corps, r.selecteur).not.toMatch(/display:\s*none/);
  });

  it("le retard de visibilite egale la duree de sortie, sinon la section est retiree avant son fondu", () => {
    const b = base()!;
    const liste = membres(/transition:\s*([^;]+);/.exec(b.corps)![1]!);
    const opacite = liste.find((m) => m.startsWith("opacity"))!;
    const visibilite = liste.find((m) => m.startsWith("visibility"));
    expect(visibilite, "la visibilite doit etre transitionnee").toBeDefined();
    const duree = /(calc\(var\(--duree\)\s*\*\s*[\d.]+\))/.exec(opacite)![1]!;
    expect(norm(visibilite!), "retard different de la duree de sortie").toContain(norm(duree));
    // Et a l'entree, aucun retard.
    const entree = membres(/transition:\s*([^;]+);/.exec(active()!.corps)![1]!)
      .find((m) => m.startsWith("visibility"))!;
    expect(norm(entree)).toBe("visibility 0s");
  });
});

describe("le contrat avec le composant (sequencement)", () => {
  it("la feuille definit un etat ou aucune section n est active, et il est masque", () => {
    const b = base();
    expect(b, "la regle de base doit etre atteignable sans data-active").toBeDefined();
    expect(b!.selecteur).not.toMatch(/data-active/);
    expect(b!.corps).toMatch(/opacity:\s*0\b/);
    expect(b!.corps).toMatch(/visibility:\s*hidden/);
  });

  it("aucune regle ne suppose qu une section est toujours active", () => {
    for (const r of reglesSections()) {
      const rend = /opacity:\s*1\b|visibility:\s*visible/.test(r.corps);
      if (rend) {
        expect(r.selecteur, `rend visible sans data-active : ${r.selecteur}`)
          .toMatch(/\[data-active="true"\]/);
      }
      // Pas de :not(...) qui fasse de l'etat actif la regle et de l'inactif l'exception.
      expect(r.selecteur, r.selecteur).not.toMatch(/:not\(\[data-active/);
    }
  });

  it("le conteneur est le repere des sections superposees", () => {
    const conteneur = [...css.matchAll(/([^{}]*\.parcours-pagine[^{}]*)\{([^}]*)\}/g)];
    expect(conteneur.length).toBeGreaterThan(0);
    expect(conteneur.map((m) => m[2]).join("\n")).toMatch(/position:\s*relative/);
    expect(base()!.corps).toMatch(/position:\s*absolute/);
    expect(base()!.corps).toMatch(/inset:\s*0/);
  });

  it("la hauteur suit la fenetre dynamique, pas 100vh", () => {
    expect(css).not.toMatch(/\.(?:parcours-pagine|section-paginee)[^{]*\{[^}]*\b100vh\b/);
    const conteneur = css.match(/\.parcours-pagine[^{]*\{([^}]*)\}/)![1]!;
    expect(conteneur).toMatch(/height:\s*100dvh/);
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
    // Sans cela le retard de visibilite survivrait et la section resterait
    // visible pendant la duree de sortie d'un echange cense etre instantane.
    expect(corps!).toMatch(/transition-delay:\s*0s/);
  });
});

describe("budget de mouvement (spec section 4)", () => {
  it("le toast de section est retire, avec ses trois jeux d images-cles", () => {
    expect(() => lire("components/portfolio/section-toast-observer.tsx")).toThrow();
    expect(lire("app/page.tsx")).not.toContain("SectionToastObserver");
    for (const nom of ["toast-enter", "toast-exit", "toast-progress"]) {
      expect(blocs(new RegExp(`@keyframes ${nom}\\s*\\{`), css), nom).toHaveLength(0);
    }
    expect(css).not.toMatch(/\.section-toast/);
  });

  it("le signal de la colonne ne bat que par l opacite", () => {
    const corps = blocs(/@keyframes signal-entree\s*\{/, css);
    expect(corps).toHaveLength(1);
    expect(corps[0]).toMatch(/opacity/);
    expect(corps[0]).not.toMatch(/translate|scale|transform/);
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
