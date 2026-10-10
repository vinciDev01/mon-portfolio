import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { entreesSections } from "./entrees-sections";
import type { SiteSettingsDto } from "@portfolio/shared-types";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");

/** Reglages ou tout est actif, pour partir d'une base connue. */
function tousActifs(): SiteSettingsDto {
  return {
    showPresentations: true, showStats: true, showSkills: true,
    showExperiences: true, showProjects: true, showServices: true,
    showAbout: true, showTestimonials: true, showContact: true,
  } as unknown as SiteSettingsDto;
}

describe("entrees de la colonne", () => {
  it("rend une entree par section activee, dans l'ordre du parcours", () => {
    const e = entreesSections(tousActifs());
    expect(e.map((x) => x.ancre)).toEqual([
      "ouverture", "stats", "competences", "experience",
      "projets", "a-propos", "contact", "services", "temoignages",
    ]);
  });

  it("suit exactement l ordre de rendu de page.tsx", () => {
    // Deux listes qui decrivent le meme parcours finissent par diverger. La
    // page fait autorite : ce test lit son ordre reel plutot que de le
    // recopier, donc il echoue si l'une des deux bouge sans l'autre.
    const page = lire("app/page.tsx");
    const ordrePage = [...page.matchAll(/id="([a-z-]+)"/g)].map((m) => m[1]);
    const ordreColonne = entreesSections(tousActifs()).map((e) => e.ancre);
    expect(ordreColonne).toEqual(ordrePage);
  });

  it("omet les sections desactivees", () => {
    const r = { ...tousActifs(), showStats: false, showServices: false };
    const ancres = entreesSections(r).map((x) => x.ancre);
    expect(ancres).not.toContain("stats");
    expect(ancres).not.toContain("services");
    expect(ancres).toContain("projets");
  });

  // Review Focus 1 : toutes les sections desactivees.
  it("rend une liste vide quand tout est desactive, sans jeter", () => {
    const aucune = Object.fromEntries(
      Object.keys(tousActifs()).map((k) => [k, false]),
    ) as unknown as SiteSettingsDto;
    expect(entreesSections(aucune)).toEqual([]);
  });

  it("ne reference que des cles de traduction qui existent", () => {
    const fr = JSON.parse(lire("lib/i18n/fr.json")) as Record<string, string>;
    for (const e of entreesSections(tousActifs())) {
      expect(fr[e.cleTitre], `cle manquante : ${e.cleTitre}`).toBeTypeOf("string");
    }
  });
});

describe("colonne de passage", () => {
  const src = lire("components/parcours/colonne-passage.tsx");

  it("est un nav au nom accessible explicite", () => {
    expect(src).toContain("<nav");
    expect(src).toMatch(/aria-label=\{t\("parcours\.colonne"\)\}/);
  });

  // Review Focus 3 : un nom et un prenom longs.
  it("replie l identite sans la laisser deborder", () => {
    const css = lire("app/globals.css");
    const m = /\.identite-mat\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .identite-mat introuvable").not.toBeNull();
    expect(m![1]).toMatch(/overflow-wrap:\s*anywhere/);
    expect(m![1]).toMatch(/max-width:\s*100%/);
  });

  it("rend l identite accessible meme quand le nom n est plus affiche", () => {
    // Sous 1024 px seul le logo subsiste : le nom reste le nom du lien.
    expect(src).toMatch(/aria-label=\{nomComplet\}/);
  });

  it("distingue les commandes du pied des entrees de section", () => {
    // Un repere signale une section du parcours. Le CV et le blog n'en sont
    // pas : leur donner le meme point les confondrait avec les sections, et le
    // suivi de position rendrait la confusion visible.
    const pied = src.slice(src.indexOf("pied-colonne"));
    expect(pied).not.toContain("entree-repere");
    expect(pied).toContain("PICTO_CV");
    expect(pied).toContain("PICTO_BLOG");
  });

  it("declare la boite de ses pictogrammes", () => {
    const m = /\.picto-commande\s*\{([^}]*)\}/.exec(lire("app/globals.css"));
    expect(m, "regle .picto-commande introuvable").not.toBeNull();
    expect(m![1]).toMatch(/width:\s*16px/);
    expect(m![1]).toMatch(/height:\s*16px/);
    expect(m![1]).toMatch(/overflow:\s*visible/);
  });

  it("le selecteur de langue tient dans la colonne etroite", () => {
    const sel = lire("components/portfolio/language-switcher.tsx");
    // Le declencheur suit la forme des autres commandes du pied : un signe,
    // puis un nom masque sous 1024 px.
    expect(sel).toContain("entree-parcours");
    expect(sel).toContain("entree-nom");
    expect(sel).toContain("PICTO_LANGUE");
    // Le placement du panneau lui-meme est verifie par la ronde de correction
    // ci-dessous : `left-0` corrigeait le sens, pas le rognage.
  });

  it("ne cree aucun mouvement", () => {
    expect(src).not.toMatch(/transition|animate-|animation/);
  });

  it("l en-tete collant a bien ete depose", () => {
    const page = lire("app/page.tsx");
    expect(page).not.toContain("Header");
    expect(page).toContain("ColonnePassage");
  });

  it("n introduit ni tiret cadratin ni emoji", () => {
    for (const f of ["components/parcours/colonne-passage.tsx",
                     "lib/parcours/entrees-sections.ts"]) {
      const t = lire(f);
      expect(t, f).not.toContain("\u2014");
      expect([...t].some((c) => c.codePointAt(0)! > 0x2500), f).toBe(false);
    }
  });
});

/* -------------------------------------------------------------------------
   Ronde de correction 2 : la geometrie du palier le plus etroit.

   Les quatre defauts releves par la revue. Les largeurs sont calculees a
   partir de ce que la feuille declare, et non epinglees : si un palier bouge,
   le calcul bouge avec lui.
   ------------------------------------------------------------------------- */

const css = lire("app/globals.css");

/** Corps a accolades equilibrees ouvert a l'indice de l'accolade `depart`. */
function corpsDepuis(source: string, depart: number): string {
  let profondeur = 0;
  for (let i = depart; i < source.length; i++) {
    if (source[i] === "{") profondeur++;
    if (source[i] === "}" && --profondeur === 0) return source.slice(depart + 1, i);
  }
  throw new Error("bloc non ferme a l'indice " + depart);
}

/** Corps du premier bloc dont l'en-tete correspond. */
function bloc(entete: RegExp, source = css): string {
  const m = entete.exec(source);
  expect(m, `bloc ${entete} introuvable`).not.toBeNull();
  return corpsDepuis(source, m!.index + m![0].length - 1);
}

/** Derniere valeur declaree pour `prop` dans un corps de regle. */
function valeur(corps: string, prop: string): string {
  const tous = [...corps.matchAll(new RegExp(`(?:^|[;{\\n])\\s*${prop}:\\s*([^;}]+)`, "g"))];
  expect(tous.length, `declaration ${prop} introuvable`).toBeGreaterThan(0);
  return tous[tous.length - 1]![1]!.trim();
}

/** Pixels d'une valeur litterale. `var(...)` n'en est pas une, et donne NaN. */
function px(v: string): number {
  const m = /^(-?[\d.]+)px$/.exec(v.trim());
  return m ? Number(m[1]) : Number.NaN;
}

/** Le `:root` qui pose le palier par defaut de la colonne. */
const racine = (() => {
  for (const m of css.matchAll(/:root\s*\{/g)) {
    const corps = corpsDepuis(css, m.index + m[0].length - 1);
    if (/--colonne:/.test(corps) && /--panneau-langue:/.test(corps)) return corps;
  }
  throw new Error(":root de la colonne introuvable");
})();

/** Les paliers de colonne, lus dans la feuille et non recopies. */
const PALIERS: Array<{ min: number; colonne: number }> = (() => {
  const out = [{ min: 0, colonne: px(valeur(racine, "--colonne")) }];
  for (const m of css.matchAll(/@media \(min-width:\s*(\d+)px\)\s*\{/g)) {
    const corps = corpsDepuis(css, m.index + m[0].length - 1);
    const v = /--colonne:\s*([\d.]+px)/.exec(corps);
    if (v) out.push({ min: Number(m[1]), colonne: px(v[1]!) });
  }
  return out.sort((a, b) => a.min - b.min);
})();

/** Seuil de la regle WCAG 2.5.8, et non un choix de cette implementation. */
const CIBLE = 24;
/** Boite du pictogramme des commandes du pied, declaree par la feuille. */
const PICTO = px(valeur(bloc(/\.picto-commande\s*\{/), "width"));
/** Plus petite fenetre visee par le projet. */
const FENETRE_MIN = 320;

const regleColonne = bloc(/\.colonne-passage\s*\{/);
const blocEtroit = bloc(/@media \(max-width:\s*599px\)\s*\{/);
const bloc1023 = bloc(/@media \(max-width:\s*1023px\)\s*\{/);

describe("defaut 1 : la largeur utile du palier de 40 px", () => {
  const colonneEtroite = PALIERS[0]!.colonne;
  const bordure = px(/border-inline-end:\s*([\d.]+px)/.exec(regleColonne)![1]!);
  const paddingLarge = px(valeur(racine.includes("--espace-2") ? racine : css, "--espace-2"));

  /** Largeur utile : la colonne, moins les deux paddings, moins la bordure.
   *  `box-sizing: border-box` vient du preflight de Tailwind, donc padding et
   *  bordure se prennent sur les 40 px et non en plus. */
  const utile = (padding: number) => colonneEtroite - 2 * padding - bordure;

  it("montre pourquoi le padding large ne tient pas", () => {
    // 40 - 2 * 16 - 1 = 7 px : ni le logo, ni les initiales, ni un
    // pictogramme de 16 px n'y tiennent.
    expect(utile(paddingLarge)).toBeLessThan(PICTO);
    expect(utile(paddingLarge)).toBeLessThan(CIBLE);
  });

  it("ramene le padding a ce que la colonne peut porter", () => {
    const padding = px(valeur(bloc(/\.colonne-passage\s*\{/, blocEtroit), "padding-inline"));
    // 40 - 2 * 4 - 1 = 31 px utiles.
    expect(utile(padding)).toBeGreaterThanOrEqual(CIBLE);
    expect(utile(padding)).toBeGreaterThanOrEqual(PICTO);
  });

  it("ramene l identite a ce que la colonne peut porter", () => {
    const padding = px(valeur(bloc(/\.colonne-passage\s*\{/, blocEtroit), "padding-inline"));
    const identite = bloc(/\.identite-logo,\s*\.identite-initiales\s*\{/, blocEtroit);
    const cote = px(valeur(identite, "width"));
    expect(cote).toBe(px(valeur(identite, "height")));
    expect(cote).toBeLessThanOrEqual(utile(padding));
    // Le cadre de 36 px du palier large ne tiendrait pas dans 31 px.
    expect(px(valeur(bloc(/\.identite-initiales\s*\{/), "width"))).toBeGreaterThan(
      utile(padding),
    );
  });

  it("ne rogne ni ne fait defiler la colonne lateralement", () => {
    // `overflow-y: auto` force `overflow-x` a `auto` : sans declaration
    // explicite, un depassement ferait apparaitre une barre horizontale.
    expect(regleColonne).toMatch(/overflow-x:\s*hidden/);
  });

  it("centre les contenus au palier etroit", () => {
    expect(bloc(/\.colonne-passage\s*\{/, blocEtroit)).toMatch(/align-items:\s*center/);
    expect(blocEtroit).toMatch(
      /\.identite-mat,\s*\.entrees-parcours,\s*\.pied-colonne\s*\{[^}]*align-items:\s*center/,
    );
  });
});

describe("defaut 2 : le panneau de langue echappe au rognage", () => {
  const sel = lire("components/portfolio/language-switcher.tsx");
  const panneau = bloc(/\.panneau-langue\s*\{/);

  it("n est plus positionne par un utilitaire absolu dans le nav", () => {
    // Le nav porte `overflow-y: auto`, donc rogne aussi l'horizontale : un
    // panneau absolu y etait coupe a trois paliers sur quatre.
    expect(sel).toContain("panneau-langue");
    expect(sel).not.toMatch(/className="[^"]*\babsolute\b/);
    expect(sel).not.toContain("top-full");
  });

  it("est fixe, ancre apres la colonne, et ouvert vers le haut", () => {
    expect(panneau).toMatch(/position:\s*fixed/);
    expect(panneau).toMatch(/inset-inline-start:\s*var\(--colonne\)/);
    // Le selecteur vit au pied : `top-full` ouvrait hors du cadre.
    expect(panneau).toMatch(/inset-block-end:/);
    expect(panneau).not.toMatch(/inset-block-start:/);
  });

  it("n a aucun ancetre qui lui servirait de bloc conteneur", () => {
    // Un element fixe echappe au rognage d'un ancetre a defilement, sauf si
    // cet ancetre lui sert de bloc conteneur. Les ancetres sont `html`,
    // `body` et la colonne elle-meme.
    const suspects = [
      "transform",
      "filter",
      "perspective",
      "backdrop-filter",
      "will-change",
      "contain",
    ];
    // Toutes les regles qui visent `html` ou `body` seuls, pseudo-elements
    // exclus : eux ne sont pas des ancetres.
    const ancetres: Array<readonly [string, string]> = [["colonne", regleColonne]];
    for (const m of css.matchAll(/(?:^|[\n}])\s*(html|body)\s*\{/g)) {
      ancetres.push([m[1]!, corpsDepuis(css, m.index + m[0].length - 1)]);
    }
    expect(ancetres.length).toBeGreaterThan(2);
    for (const [nom, corps] of ancetres) {
      for (const prop of suspects) {
        expect(
          new RegExp(`(?:^|[;{\\n])\\s*${prop}:`).test(corps),
          `${nom} porte ${prop}`,
        ).toBe(false);
      }
    }
    // Et rien d'equivalent par utilitaire sur le conteneur du selecteur.
    expect(sel).not.toMatch(/className="[^"]*\b(transform|blur-|backdrop-|will-change)/);
  });

  it("tient dans la fenetre la plus etroite de chaque palier", () => {
    // Ancre a `--colonne`, le panneau s'etend vers l'interieur : sa largeur
    // s'ajoute a celle de la colonne.
    const largeur = px(valeur(racine, "--panneau-langue"));
    expect(Number.isNaN(largeur)).toBe(false);
    expect(PALIERS.length).toBeGreaterThan(1);
    for (const p of PALIERS) {
      const fenetre = Math.max(p.min, FENETRE_MIN);
      expect(p.colonne + largeur, `palier ${p.min} px`).toBeLessThanOrEqual(fenetre);
    }
  });
});

describe("defaut 3 : la taille des cibles de la colonne", () => {
  it("donne au moins 24 x 24 px a chaque entree", () => {
    const regle = bloc(/\.entree-parcours\s*\{/);
    expect(px(valeur(regle, "min-width"))).toBeGreaterThanOrEqual(CIBLE);
    expect(px(valeur(regle, "min-height"))).toBeGreaterThanOrEqual(CIBLE);
  });

  it("montre que le repere seul ne suffirait pas", () => {
    // Sous 1024 px le nom est masque : sans minimum, l'entree se reduit a son
    // repere, bordure comprise.
    const repere = bloc(/\.entree-repere\s*\{/);
    const cote =
      px(valeur(repere, "width")) + 2 * px(/border:\s*([\d.]+px)/.exec(repere)![1]!);
    expect(cote).toBeLessThan(CIBLE);
  });

  it("centre le repere dans la cible quand le nom est masque", () => {
    expect(bloc1023).toMatch(/\.entree-nom/);
    expect(bloc(/\.entree-parcours\s*\{/, bloc1023)).toMatch(/justify-content:\s*center/);
  });

  it("n oublie aucune entree interactive de la colonne", () => {
    const col = lire("components/parcours/colonne-passage.tsx");
    const balises = [...col.matchAll(/<(?:a|button|Link)\s[^>]*>/g)].map((m) => m[0]);
    expect(balises.length).toBeGreaterThan(1);
    for (const b of balises) {
      expect(
        /className="[^"]*(?:entree-parcours|identite-mat)/.test(b),
        `cible sans classe de cible : ${b.replace(/\s+/g, " ").slice(0, 70)}`,
      ).toBe(true);
    }
  });
});

describe("defaut 4 : le nom accessible du selecteur de langue", () => {
  const sel = lire("components/portfolio/language-switcher.tsx");
  const ligne = sel.split("\n").find((l) => l.includes("aria-label=")) ?? "";

  it("passe par le dictionnaire et non par une chaine en dur", () => {
    expect(ligne, "aria-label introuvable").not.toBe("");
    expect(ligne).toMatch(/t\("parcours\.[a-z]+"\)/);
    expect(sel).not.toContain("Language :");
  });

  it("contient le texte visible, comme WCAG 2.5.3 l exige", () => {
    // Le texte visible du declencheur est le code court.
    expect(sel).toMatch(/className="entree-nom">\{current!\.short\}</);
    expect(ligne).toContain("short");
  });

  it("declare sa cle dans les trois dictionnaires, qui restent plats", () => {
    const cle = /t\("(parcours\.[a-z]+)"\)/.exec(ligne)![1]!;
    for (const d of ["fr", "en", "de"]) {
      const dict = JSON.parse(lire(`lib/i18n/${d}.json`)) as Record<string, unknown>;
      expect(dict[cle], `${d} : cle ${cle} manquante`).toBeTypeOf("string");
      expect(
        Object.values(dict).every((v) => typeof v === "string"),
        `${d} : dictionnaire non plat`,
      ).toBe(true);
    }
  });
});

describe("ronde de correction 2 : les contraintes globales", () => {
  it("n ajoute aucun mouvement a la feuille", () => {
    for (const [nom, corps] of [
      ["panneau-langue", bloc(/\.panneau-langue\s*\{/)],
      ["palier etroit", blocEtroit],
      ["entree-parcours", bloc(/\.entree-parcours\s*\{/)],
    ] as const) {
      expect(corps, nom).not.toMatch(/transition|animation/);
    }
  });

  it("n introduit ni degrade, ni tiret cadratin, ni emoji", () => {
    for (const f of [
      "components/portfolio/language-switcher.tsx",
      "lib/i18n/fr.json",
      "lib/i18n/en.json",
      "lib/i18n/de.json",
    ]) {
      const t = lire(f);
      expect(t, f).not.toContain("\u2014");
      expect([...t].some((c) => c.codePointAt(0)! > 0x2500), f).toBe(false);
    }
    for (const [nom, corps] of [
      ["panneau-langue", bloc(/\.panneau-langue\s*\{/)],
      ["palier etroit", blocEtroit],
    ] as const) {
      expect(corps, nom).not.toMatch(/gradient/);
    }
  });
});
