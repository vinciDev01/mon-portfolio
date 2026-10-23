import { describe, it, expect } from "vitest";
import { sectionsActives } from "./sections";
import type { SiteSettingsDto } from "@portfolio/shared-types";
import { DUREE_SIGNAL_MS } from "@/components/parcours/parcours-pagine";
import { bloc, corpsDepuis, css, cssNu, lire, PALIERS, px, racine, tableDesContenus, valeur } from "./feuille-test";

/** Reglages ou tout est actif, pour partir d'une base connue. */
function tousActifs(): SiteSettingsDto {
  return {
    showPresentations: true, showStats: true, showSkills: true,
    showExperiences: true, showCertifications: true, showProjects: true, showServices: true,
    showAbout: true, showTestimonials: true, showContact: true,
  } as unknown as SiteSettingsDto;
}

describe("entrees de la colonne", () => {
  it("rend une entree par section activee, dans l'ordre du parcours", () => {
    const e = sectionsActives(tousActifs());
    expect(e.map((x) => x.id)).toEqual([
      "ouverture", "stats", "competences", "experience", "certifications",
      "projets", "a-propos", "contact", "services", "temoignages",
    ]);
  });

  it("suit exactement l ordre de la table des contenus de page.tsx", () => {
    // Deux listes qui decrivent le meme parcours finissent par diverger. La
    // page fait autorite : ce test lit l'ordre reel de sa table des contenus
    // (les `id=` sont desormais poses par le conteneur) plutot que de le
    // recopier, donc il echoue si l'une des deux bouge sans l'autre.
    const ordrePage = tableDesContenus().map((e) => e.id);
    const ordreColonne = sectionsActives(tousActifs()).map((e) => e.id);
    expect(ordreColonne).toEqual(ordrePage);
  });

  it("omet les sections desactivees", () => {
    const r = { ...tousActifs(), showStats: false, showServices: false };
    const ancres = sectionsActives(r).map((x) => x.id);
    expect(ancres).not.toContain("stats");
    expect(ancres).not.toContain("services");
    expect(ancres).toContain("projets");
  });

  // Review Focus 1 : toutes les sections desactivees.
  it("ne garde que l ouverture quand tout est desactive, sans jeter", () => {
    const aucune = Object.fromEntries(
      Object.keys(tousActifs()).map((k) => [k, false]),
    ) as unknown as SiteSettingsDto;
    expect(sectionsActives(aucune).map((x) => x.id)).toEqual(["ouverture"]);
  });

  it("ne reference que des cles de traduction qui existent", () => {
    const fr = JSON.parse(lire("lib/i18n/fr.json")) as Record<string, string>;
    for (const e of sectionsActives(tousActifs())) {
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
    // Le selecteur de langue : son panneau s'ouvre vers le haut, une entree par
    // le haut le contredirait. Le site garde ses deux mouvements.
    expect(lire("components/portfolio/language-switcher.tsx")).not.toMatch(
      /transition|animate-in|slide-in|fade-in|duration-/,
    );
  });

  it("l en-tete collant a bien ete depose", () => {
    const page = lire("app/page.tsx");
    expect(page).not.toContain("Header");
    expect(page).toContain("ColonnePassage");
  });

  it("n introduit ni tiret cadratin ni emoji", () => {
    for (const f of ["components/parcours/colonne-passage.tsx",
                     "lib/parcours/sections.ts"]) {
      const t = lire(f);
      expect(t, f).not.toContain("\u2014");
      expect([...t].some((c) => c.codePointAt(0)! >= 0x2500), f).toBe(false);
    }
  });
});

/* -------------------------------------------------------------------------
   Ronde de correction 2 : la geometrie du palier le plus etroit.

   Les quatre defauts releves par la revue. Les largeurs sont calculees a
   partir de ce que la feuille declare, et non epinglees : si un palier bouge,
   le calcul bouge avec lui.
   ------------------------------------------------------------------------- */

/** Seuil de la regle WCAG 2.5.8, et non un choix de cette implementation. */
const CIBLE = 24;
/** Boite du pictogramme des commandes du pied, declaree par la feuille. */
const PICTO = px(valeur(bloc(/\.picto-commande\s*\{/), "width"));
/** Plus petite fenetre visee par le projet. */
const FENETRE_MIN = 320;

const regleColonne = bloc(/\.colonne-passage\s*\{/);
// Qualifies par leur premiere regle : la feuille compte d'autres `@media` aux
// memes bornes (l'ampoule pose le sien a 599 px, sur `:root`), et prendre le
// premier venu tombait sur lui.
const blocEtroit = bloc(/@media \(max-width:\s*599px\)\s*\{(?=\s*\.colonne-passage)/);
const bloc1023 = bloc(/@media \(max-width:\s*1023px\)\s*\{(?=\s*\.identite-nom)/);

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

  it("montre que le pictogramme du pied seul ne suffirait pas", () => {
    // Le nom est masque a tous les paliers : sans minimum, une commande du
    // pied se reduirait a son pictogramme de 16 px.
    expect(PICTO).toBeLessThan(CIBLE);
  });

  it("centre le pictogramme dans la cible au palier reduit", () => {
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

/* -------------------------------------------------------------------------
   Le menu en pictogrammes, et le signal de la section voisine.
   ------------------------------------------------------------------------- */

/** Vrai si `debut` tombe a l'interieur d'une `@media` encore ouverte : son
 *  accolade ne s'est pas refermee avant `debut`. Un `@layer` ouvert plus loin
 *  ne compte pas. */
function dansUneMedia(source: string, debut: number): boolean {
  return [...source.slice(0, debut).matchAll(/@media[^{]*\{/g)].some((m) => {
    let profondeur = 0;
    for (const c of source.slice(m.index!, debut)) {
      if (c === "{") profondeur++;
      else if (c === "}" && --profondeur === 0) return false;
    }
    return true;
  });
}

describe("le menu porte pictogramme et libelle", () => {
  it("ne masque les libelles et le nom qu au palier reduit, sans les retirer", () => {
    // Un masquage hors de toute `@media` cacherait les libelles a tous les
    // paliers, ce que le proprietaire a refuse.
    // Toute regle qui masque (`clip-path`) un nom doit vivre dans une @media.
    const masquages = [...cssNu.matchAll(/([^{}]*)\{([^{}]*)\}/g)].filter(
      (m) => /\.(?:entree|identite)-nom\b/.test(m[1]!) && /clip-path/.test(m[2]!),
    );
    expect(masquages.length, "aucun masquage de nom trouve").toBeGreaterThan(0);
    for (const m of masquages) {
      expect(dansUneMedia(cssNu, m.index!), `${m[1]!.trim()} hors du palier reduit`).toBe(true);
    }
    expect(bloc1023).toMatch(/\.identite-nom,\s*\.entree-nom\s*\{/);
    expect(bloc1023).toMatch(/clip-path:\s*inset\(50%\)/);
    // `display: none` retirerait aussi le nom accessible.
    expect(bloc1023).not.toMatch(/display:\s*none/);
  });

  it("donne au pictogramme de section une boite qui tient dans la cible", () => {
    const r = bloc(/\.picto-section\s*\{/);
    expect(px(valeur(r, "width"))).toBeLessThanOrEqual(CIBLE);
    expect(px(valeur(r, "height"))).toBeLessThanOrEqual(CIBLE);
  });

  it("souligne le libelle de la section courante d un trait fin, sans cadre", () => {
    const courante = bloc(/\.entree-parcours\[aria-current="true"\]\s*\{/);
    expect(courante).not.toMatch(/border|background|outline/);
    expect(courante).toMatch(/color:\s*var\(--texte\)/);
    const libelle = bloc(/\.entree-parcours\[aria-current="true"\] \.entree-nom\s*\{/);
    expect(libelle).toMatch(/text-decoration:\s*underline/);
    expect(valeur(libelle, "text-decoration-thickness")).toBe("1px");
  });

  it("ne souligne pas l icone", () => {
    // Le soulignement est pose sur le libelle seul : aucune regle de la
    // section courante ne le pose sur l'entree entiere ni sur le pictogramme.
    expect(cssNu).not.toMatch(/aria-current="true"\][^{]*\{[^}]*border-block-end/);
    expect(
      bloc(/\.entree-parcours\[aria-current="true"\] \.picto-section > \*\s*\{/),
    ).not.toMatch(/text-decoration/);
  });

  it("la dit par l epaisseur du trait, pas par la seule couleur (WCAG 1.4.1)", () => {
    // Ancre en debut de ligne : sans quoi la regle de la section courante,
    // qui se termine par le meme selecteur, serait prise pour celle du repos.
    const repos = px(valeur(bloc(/^\s*\.picto-section > \*\s*\{/m), "stroke-width") + "px");
    const courant = px(
      valeur(bloc(/\.entree-parcours\[aria-current="true"\] \.picto-section > \*\s*\{/), "stroke-width") + "px",
    );
    expect(courant).toBeGreaterThan(repos);
    expect(bloc(/\.entree-parcours\[aria-current="true"\] \.entree-nom\s*\{/)).toMatch(
      /font-weight:\s*600/,
    );
  });
});

describe("le signal de la section voisine", () => {
  const regle = bloc(/\.entree-parcours\[data-signal="true"\]\s*\{/);
  const animation = valeur(regle, "animation");

  it("bat aussi longtemps que le composant tient le signal", () => {
    const m = /signal-entree\s+(\d+)ms\s+[\w-]+\s+(\d+)/.exec(animation);
    expect(m, `animation illisible : ${animation}`).not.toBeNull();
    expect(Number(m![1]) * Number(m![2])).toBe(DUREE_SIGNAL_MS);
  });

  it("reste sous trois eclairs par seconde (WCAG 2.3.1)", () => {
    const m = /signal-entree\s+(\d+)ms/.exec(animation)!;
    expect(1000 / Number(m[1])).toBeLessThan(3);
  });

  it("ne bat plus en mouvement reduit, mais designe encore l entree", () => {
    const reduit = bloc(
      /@media \(prefers-reduced-motion: reduce\)\s*\{(?=\s*:root:not\(\[data-mouvement="force"\]\) \.entree-parcours)/,
    );
    const r = bloc(/\.entree-parcours\[data-signal="true"\]\s*\{/, reduit);
    expect(r).toMatch(/animation:\s*none/);
    expect(r).toMatch(/border-color:\s*var\(--accent\)/);
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
      expect([...t].some((c) => c.codePointAt(0)! >= 0x2500), f).toBe(false);
    }
    for (const [nom, corps] of [
      ["panneau-langue", bloc(/\.panneau-langue\s*\{/)],
      ["palier etroit", blocEtroit],
    ] as const) {
      expect(corps, nom).not.toMatch(/gradient/);
    }
  });
});
