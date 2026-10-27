import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { dispositionJournal, ligneDate } from "./journal";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Article } from "../../components/parcours/journal-projets";
import { I18nProvider } from "../i18n/i18n-context";
import { bloc, evaluer, proprietes, valeur, px } from "./feuille-test";
import type { ProjectDto } from "@portfolio/shared-types";

/** `children` est requis par le type du fournisseur mais passe ici en troisieme
 *  argument de `createElement`, comme l'exige la regle `react/no-children-prop` :
 *  les surcharges de TypeScript ne le comptent pas, et le cast ne masque rien.
 *  Declare UNE fois, au lieu des cinq repetitions en deux styles d'avant. */
const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");

/** Rend les valeurs des parametres, pour que les tests portent sur les dates
 *  et non sur la phrase. */
const tFaux = (cle: string, p?: Record<string, string>) =>
  p ? Object.values(p).join(" ") : cle;

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

function projet(p: Partial<ProjectDto>): ProjectDto {
  return {
    id: p.id ?? "x", name: p.name ?? "Projet", description: null,
    photo1Path: null, photo2Path: null, demoUrl: null, projectUrl: null,
    targetAudience: null,
    startDate: null, endDate: null, technologies: [], collaborators: [],
    sortOrder: 0, ...p,
  } as ProjectDto;
}

describe("ligne de date du journal (spec section 6.2)", () => {
  it("prend le plus petit debut et le plus grand terme", () => {
    const l = ligneDate([
      projet({ startDate: "2024-03-01", endDate: "2024-09-01" }),
      projet({ startDate: "2025-01-01", endDate: "2026-01-01" }),
    ], "fr", tFaux);
    expect(l).toContain("2024");
    expect(l).toContain("2026");
  });

  it("est omise quand aucun projet ne porte de date", () => {
    expect(ligneDate([projet({}), projet({})], "fr", tFaux)).toBeNull();
  });

  it("ne se replie jamais sur la date du jour", () => {
    const anneeCourante = String(new Date().getFullYear());
    const l = ligneDate([projet({ startDate: "2020-01-01", endDate: "2020-06-01" })], "fr", tFaux);
    expect(l).not.toContain(anneeCourante);
  });

  // Review Focus 5 : startDate posterieur a endDate.
  it("ne s inverse pas sur une saisie incoherente", () => {
    const l = ligneDate([projet({ startDate: "2026-01-01", endDate: "2024-03-01" })], "fr", tFaux);
    // Le plus petit et le plus grand, toutes bornes confondues.
    const i2024 = l!.indexOf("2024");
    const i2026 = l!.indexOf("2026");
    expect(i2024).toBeGreaterThan(-1);
    expect(i2026).toBeGreaterThan(i2024);
  });

  it("tient avec une seule borne renseignee", () => {
    expect(ligneDate([projet({ startDate: "2024-03-01" })], "fr", tFaux)).toContain("2024");
  });
});

describe("fuseau de la ligne de date", () => {
  it("une borne au 1er du mois rend ce mois et non le precedent", () => {
    const l = ligneDate([projet({ startDate: "2024-03-01" })], "fr", tFaux);
    expect(l).toBe("mars 2024");
  });
});

describe("disposition du journal (cas de degradation)", () => {
  const p = (id: string, sortOrder: number) => projet({ id, sortOrder });

  it("ne rend rien sans projet", () => {
    expect(dispositionJournal([])).toBeNull();
  });

  it("un projet : une tete et une suite vide", () => {
    const d = dispositionJournal([p("a", 0)]);
    expect(d!.tete.id).toBe("a");
    expect(d!.suite).toEqual([]);
  });

  it("deux projets : une tete et une suite d'un", () => {
    const d = dispositionJournal([p("a", 0), p("b", 1)]);
    expect(d!.suite.map((x) => x.id)).toEqual(["b"]);
  });

  it("trois projets : une suite de deux", () => {
    const d = dispositionJournal([p("a", 0), p("b", 1), p("c", 2)]);
    expect(d!.suite.map((x) => x.id)).toEqual(["b", "c"]);
  });

  it("la tete est le plus petit sortOrder et non le premier recu", () => {
    const d = dispositionJournal([p("b", 5), p("a", 1), p("c", 9)]);
    expect(d!.tete.id).toBe("a");
    expect(d!.suite.map((x) => x.id)).toEqual(["b", "c"]);
  });

  it("ne mute pas le tableau recu", () => {
    const entree = [p("b", 5), p("a", 1)];
    dispositionJournal(entree);
    expect(entree.map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("journal des projets (spec section 6)", () => {
  const src = lire("components/parcours/journal-projets.tsx");
  const css = lire("app/globals.css");

  it("rend un bandeau ferme par un filet signifiant", () => {
    const m = /\.journal-bandeau\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .journal-bandeau introuvable").not.toBeNull();
    expect(m![1]).toContain("var(--bordure-signifiante)");
  });

  it("separe les colonnes par un filet decoratif", () => {
    const m = /\.journal-colonnes\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .journal-colonnes introuvable").not.toBeNull();
    expect(m![1]).toContain("var(--bordure)");
  });

  it("met en colonnes selon la mesure et non la largeur de fenetre", () => {
    // A 700 px de fenetre la mesure vaut 458 px : deux colonnes y donneraient
    // 213 px, soit 24 caracteres, ou l'on ne lit plus.
    const regle = blocs(/\.journal\s*\{/, css);
    expect(regle.some((b) => /container-type:\s*inline-size/.test(b))).toBe(true);
    const conteneur = blocs(/@container \(min-width:\s*520px\)\s*\{/, css);
    expect(conteneur.length, "aucun bloc @container 520 px").toBeGreaterThan(0);
    expect(conteneur.some((b) => /columns:\s*2/.test(b) && /column-rule:/.test(b))).toBe(true);
  });

  // Review Focus 4 : projet de tete sans photo1Path.
  it("ne reserve aucune place vide quand le projet de tete n a pas d image", () => {
    // `image` est nul quand la tete n'a pas de photo1Path : l'<Image> n'est
    // alors pas rendue.
    const html = renderToStaticMarkup(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(Article, { projet: projet({}), tete: true, surOuverture: () => {} }),
      ),
    );
    expect(html).not.toContain("<img");
    expect(html, "un bouton de photo sans photo").not.toContain("journal-declencheur-image");
  });

  it("ferme chaque article par la signature des technologies", () => {
    expect(src).toContain("journal-signature");
    expect(src).toContain('join(" · ")');
    expect(src).not.toMatch(/bg-(red|orange|yellow|green|blue)/);
  });

  it("ne cree aucun mouvement, ni dans le TSX ni dans les regles journal", () => {
    const sans = (t: string) =>
      t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const motif = /transition|animate-|animation|@keyframes/;
    expect(sans(src)).not.toMatch(motif);
    const regles = [...sans(css).matchAll(/\.journal[\w-]*[^{}]*\{[^{}]*\}/g)].map((m) => m[0]);
    expect(regles.length).toBeGreaterThan(0);
    for (const r of regles) expect(r).not.toMatch(motif);
  });

  it("souligne le lien de facon statique (second signal)", () => {
    const regles = blocs(/\.journal-lien\s*\{/, css);
    expect(regles.length).toBeGreaterThan(0);
    expect(regles[0]).toMatch(/text-decoration:\s*underline/);
    expect(regles[0]).toMatch(/text-underline-offset:\s*2px/);
  });

  it("n introduit ni tiret cadratin ni emoji", () => {
    for (const f of ["components/parcours/journal-projets.tsx", "lib/parcours/journal.ts"]) {
      const t = lire(f);
      expect(t, f).not.toContain("\u2014");
      expect([...t].some((c) => c.codePointAt(0)! >= 0x2500), f).toBe(false);
    }
  });
});

describe("lien de demonstration (rendu)", () => {
  const rendre = (p: Partial<ProjectDto>) =>
    renderToStaticMarkup(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(Article, { projet: projet(p), tete: false, surOuverture: () => {} }),
      ),
    );

  it("ne rend aucune balise a quand demoUrl est nul", () => {
    expect(rendre({ demoUrl: null, description: "d" })).not.toMatch(/<a[\s>]/);
  });

  it("n'en rend pas non plus pour une chaine vide", () => {
    expect(rendre({ demoUrl: "", description: "d" })).not.toMatch(/<a[\s>]/);
  });

  it("porte href, target et rel sur la meme balise", () => {
    const html = rendre({ demoUrl: "https://exemple.test/demo", description: "d" });
    const balise = /<a\s[^>]*>/.exec(html)?.[0];
    expect(balise, "aucune balise a").toBeDefined();
    expect(balise).toContain('href="https://exemple.test/demo"');
    expect(balise).toContain('target="_blank"');
    expect(balise).toContain('rel="noopener noreferrer"');
    expect(balise).toContain('class="journal-lien"');
    expect(html).toContain("Voir la démo");
  });

  it("ordonne titre, date, byline, corps, lien, technologies", () => {
    const html = rendre({
      name: "TITRE",
      startDate: "2024-03-01",
      collaborators: [
        { id: "a", firstName: "Ada", lastName: "Lovelace", email: null, linkedinUrl: null, sortOrder: 0 },
      ],
      demoUrl: "https://exemple.test/demo",
      description: "DESCRIPTION",
      technologies: [{ id: "1", label: "React", logoPath: null, sortOrder: 0, showInCv: true, familyId: null, family: null }],
    });
    const sequence = [
      html.indexOf("TITRE"),
      html.indexOf("journal-date"),
      html.indexOf("journal-collaborateurs"),
      html.indexOf("DESCRIPTION"),
      html.search(/<a[\s>]/),
      html.indexOf('<p class="journal-signature">React'),
    ];
    for (const i of sequence) expect(i).toBeGreaterThan(-1);
    expect(sequence).toEqual([...sequence].sort((x, y) => x - y));
    // Deux registres distincts : la pile technique ferme l'article, le byline
    // porte des personnes. Jamais la meme classe.
    expect(html.match(/journal-signature/g)).toHaveLength(1);
  });
});

describe("hierarchie typographique du journal (spec section 6.1)", () => {
  const css = lire("app/globals.css");
  const src = lire("components/parcours/journal-projets.tsx");

  it("chaque classe posee par le balisage existe dans la feuille", () => {
    // Une classe morte dans le balisage fait croire a une mise en forme qui
    // n'existe pas : c'est ce qui avait laisse la tete sans distinction.
    for (const c of ["journal-tete", "journal-titre", "journal-corps", "journal-date", "journal-collaborateurs", "journal-declencheur", "journal-declencheur-image"]) {
      expect(src, c).toContain(c);
    }
    expect(css, "journal-declencheur-image").toMatch(/\.journal-declencheur-image\s*\{/);
    expect(css).toMatch(/\.journal-titre\s*\{/);
    expect(css).toMatch(/\.journal-tete \.journal-titre\s*\{/);
    expect(css).toMatch(/\.journal-corps\s*\{/);
    expect(css).toMatch(/\.journal-date\s*\{/);
    expect(css).toMatch(/\.journal-collaborateurs\s*\{/);
  });

  it("le titre du projet de tete est plus GRAND que celui des articles, et reste sous le titre de section", () => {
    const racine = proprietes(
      bloc(/:root\s*\{(?=[^}]*--ratio:)/, css),
    );
    const ctx = { largeurPct: 0, ch: 0, vars: racine as Record<string, string | number> };
    const taille = (b: string) => {
      const m = /font-size:\s*([^;]+);/.exec(b);
      expect(m, "font-size absente").not.toBeNull();
      return evaluer(m![1]!, ctx);
    };
    const tete = taille(blocs(/\.journal-tete \.journal-titre\s*\{/, css)[0]!);
    const suite = taille(blocs(/\.journal-titre\s*\{/, css)[0]!);
    const sectionH2 = evaluer("var(--h2)", ctx);
    expect(tete).toBeGreaterThan(suite);
    expect(tete).toBeLessThanOrEqual(sectionH2);
  });
});

describe("date et signature de chaque article (spec section 6)", () => {
  const rendre = (p: Partial<ProjectDto>, tete = false) =>
    renderToStaticMarkup(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(Article, { projet: projet(p), tete, surOuverture: () => {} }),
      ),
    );
  const collab = (id: string, firstName: string, lastName: string, sortOrder: number) => ({
    id, firstName, lastName, sortOrder,
    email: `${firstName.toLowerCase()}@exemple.test`,
    linkedinUrl: `https://linkedin.test/${id}`,
  });

  it("chaque article porte sa propre date, en UTC et dans la langue courante", () => {
    const html = rendre({ startDate: "2024-03-01", endDate: "2024-03-20" });
    expect(html).toContain("en mars 2024");
    expect(rendre({ startDate: "2020-01-01" })).toContain("janvier 2020");
  });

  it("omet la date quand le projet n'en a pas, et ne lit pas l'horloge", () => {
    const html = rendre({});
    expect(html).not.toContain("meta journal-date");
    expect(html).not.toContain(String(new Date().getFullYear()));
  });

  it("les collaborateurs deviennent une signature : avec X et Y", () => {
    const html = rendre({
      collaborators: [collab("b", "Alan", "Turing", 1), collab("a", "Ada", "Lovelace", 0)],
    });
    expect(html).toContain("avec Ada Lovelace et Alan Turing");
    expect(html).toMatch(/<p class="journal-collaborateurs">avec /);
  });

  it("ne remet ni courriel ni lien LinkedIn des collaborateurs", () => {
    const html = rendre({ collaborators: [collab("a", "Ada", "Lovelace", 0)] });
    expect(html).not.toContain("@exemple.test");
    expect(html).not.toContain("linkedin");
    expect(html).not.toMatch(/<a[\s>]/);
  });

  it("sans collaborateur, aucune signature de byline", () => {
    expect(rendre({})).not.toContain("avec ");
  });

  it("la cle du byline existe, a plat, dans les trois dictionnaires", () => {
    for (const d of ["fr", "en", "de"]) {
      const dict = JSON.parse(lire(`lib/i18n/${d}.json`)) as Record<string, unknown>;
      expect(dict["journal.collaborateurs"], d).toMatch(/\{noms\}/);
    }
  });
});

describe("le declencheur du parchemin (spec section 3)", () => {
  function rendreArticle(p: Partial<ProjectDto>, tete = false): string {
    return renderToStaticMarkup(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(Article, { projet: projet(p), tete, surOuverture: () => {} }),
      ),
    );
  }

  it("le titre porte un bouton, et reste un titre", () => {
    const html = rendreArticle({ name: "Mon projet" });
    const h = /<h3[^>]*>([\s\S]*?)<\/h3>/.exec(html);
    expect(h, "le titre n est plus un h3").not.toBeNull();
    expect(h![1]).toMatch(/<button[\s>]/);
    expect(h![1]).toContain("Mon projet");
  });

  // Categorique : c'est l'invariant d'accessibilite, pas une orthographe.
  it("le bouton du titre ne contient AUCUN element interactif", () => {
    const html = rendreArticle({ name: "Mon projet", demoUrl: "https://exemple.test" });
    const b = /<button[^>]*>([\s\S]*?)<\/button>/.exec(html);
    expect(b).not.toBeNull();
    expect(b![1], "un element interactif est dans le bouton").not.toMatch(
      /<a[\s>]|<button[\s>]|<input[\s>]|<select[\s>]/,
    );
  });

  it("le lien de demonstration reste frere du bouton, pas son enfant", () => {
    const html = rendreArticle({ demoUrl: "https://exemple.test" });
    const finBouton = html.indexOf("</button>");
    expect(finBouton).toBeGreaterThan(-1);
    expect(html.indexOf('href="https://exemple.test"')).toBeGreaterThan(finBouton);
  });

  it("la photo de tete est aussi un declencheur, avec un nom accessible", () => {
    const html = rendreArticle({ name: "Mon projet", photo1Path: "a.webp" }, true);
    const avant = html.slice(0, html.indexOf("<img"));
    expect(avant).toMatch(/<button[^>]*>$/);
    const balise = /<button[^>]*>$/.exec(avant)![0];
    expect(balise).toContain('aria-label="Photo de Mon projet"');
    expect(balise, "meme nom que le titre").not.toContain('aria-label="Mon projet"');
    expect(balise).not.toContain("aria-hidden");
    expect(balise).toContain('type="button"');
  });

  it("un nom blanc ne laisse aucun bouton anonyme", () => {
    const html = rendreArticle({ name: "   ", photo1Path: "a.webp" }, true);
    const fr = JSON.parse(lire("lib/i18n/fr.json")) as Record<string, string>;
    const repli = fr["projects.sansTitre"]!;
    expect(/<h3[^>]*>\s*<button[^>]*>([\s\S]*?)<\/button>/.exec(html)![1]!.trim()).toBe(repli);
    expect(html).toContain(`aria-label="${fr["projects.photoDe"]!.replace("{nom}", repli)}"`);
  });

  it("les deux cles neuves existent a plat dans les trois langues", () => {
    for (const d of ["fr", "en", "de"]) {
      const dict = JSON.parse(lire(`lib/i18n/${d}.json`)) as Record<string, string>;
      expect(dict["projects.photoDe"], d).toMatch(/\{nom\}/);
      expect(dict["projects.sansTitre"], d).toBeTruthy();
    }
  });

  it("l article lui-meme n est pas cliquable", () => {
    const html = rendreArticle({ name: "Mon projet" });
    const art = /<article[^>]*>/.exec(html)![0];
    expect(art).not.toMatch(/role="button"|tabindex/i);
  });

  it("chaque declencheur dit que cela s ouvre, hors couleur", () => {
    const html = rendreArticle({ name: "Mon projet", photo1Path: "a.webp" }, true);
    const balises = html.match(/<button[^>]*>/g) ?? [];
    /** Les classes d'une balise, en JETONS et non en sous-chaine de l'attribut.
     *  Le filtre precedent exemptait toute balise dont le texte CONTENAIT
     *  `journal-details` : une classe voisine comme `journal-details-bis`
     *  echappait donc a l'obligation d'infobulle. */
    const classes = (b: string) =>
      (/\sclass="([^"]*)"/.exec(b)?.[1] ?? "").trim().split(/\s+/).filter(Boolean);
    const porteLaClasse = (b: string) => classes(b).includes("journal-details");
    // Le bouton « Details » porte un mot visible : il n'a pas besoin
    // d'infobulle, et il est le SEUL a porter cette classe. Un bouton du titre
    // ou de la photo qui la recevrait par erreur ferait tomber cette ligne, au
    // lieu de s'exempter en silence.
    expect(
      balises.filter(porteLaClasse),
      "la classe journal-details ne doit nommer qu un bouton, celui du mot visible",
    ).toHaveLength(1);
    // Le titre et la photo, eux, n'ont que leur curseur et leur infobulle.
    const boutons = balises.filter((b) => !porteLaClasse(b));
    expect(boutons, "un declencheur manque, ou un bouton de plus s est glisse").toHaveLength(2);
    const attendu = JSON.parse(lire("lib/i18n/fr.json"))["projects.clickForDetails"] as string;
    for (const b of boutons) expect(b).toContain(`title="${attendu}"`);
  });

  it("un troisieme bouton, au mot visible, ouvre aussi le parchemin", () => {
    const html = rendreArticle({ name: "Mon projet", photo1Path: "a.webp" }, true);
    const m = /<button[^>]*class="journal-details"[^>]*>([\s\S]*?)<\/button>/.exec(html);
    expect(m, "aucun bouton Details dans l'article").not.toBeNull();
    const fr = JSON.parse(lire("lib/i18n/fr.json")) as Record<string, string>;
    expect(m![1]!.trim()).toBe(fr["projects.details"]);
    expect(html.match(/<button/g)).toHaveLength(3);
  });

  it("le journal ne montre PAS l adresse du projet : il reste une une de presse", () => {
    // DECISION de la passe, et non un oubli : la une porte deja un titre
    // cliquable, une ligne de date, les collaborateurs, un chapo, le bouton
    // « Details », le lien de demonstration et la signature des technologies.
    // Une seconde adresse y ajouterait une action de plus par article, en
    // concurrence du bouton « Details » qui est l'action PRINCIPALE du
    // journal. L'adresse du projet vit dans le parchemin, qui est le dossier.
    // Si cette ligne tombe un jour, c'est la decision qu'il faut rouvrir.
    const html = rendreArticle({
      name: "Mon projet",
      projectUrl: "https://exemple.test/vitrine",
      demoUrl: "https://exemple.test/demo",
    });
    const fr = JSON.parse(lire("lib/i18n/fr.json")) as Record<string, string>;
    expect(html, "l adresse du projet a fuite dans la une").not.toContain(
      "https://exemple.test/vitrine",
    );
    expect(html, "le libelle de l adresse du projet parait dans la une").not.toContain(
      fr["projects.viewProject"]!,
    );
    // La demonstration, elle, parait toujours : sans cette moitie, les deux
    // lignes ci-dessus passeraient aussi pour un article sans aucun lien.
    expect(html, "le lien de demonstration a disparu : l assertion serait vide").toContain(
      "https://exemple.test/demo",
    );
  });

  it("les cles neuves existent, non vides, en parite exacte dans les trois langues", () => {
    const dicts = ["fr", "en", "de"].map(
      (d) => JSON.parse(lire(`lib/i18n/${d}.json`)) as Record<string, string>,
    );
    for (const dict of dicts) {
      expect(dict["projects.details"]).toBeTruthy();
      // L'adresse du projet en ligne, distincte de la demonstration : les deux
      // libelles doivent DIFFERER, sinon le visiteur ne sait pas lequel mene ou.
      expect(dict["projects.viewProject"]).toBeTruthy();
      expect(dict["projects.viewProject"]).not.toBe(dict["projects.viewDemo"]);
    }
    const cles = dicts.map((x) => Object.keys(x).sort());
    expect(cles[1]).toEqual(cles[0]);
    expect(cles[2]).toEqual(cles[0]);
    expect(cles[0]).toHaveLength(96);
  });
});

describe("le lien de demonstration du journal suit la regle du parchemin (https seul)", () => {
  const rendre = (demoUrl: string) =>
    renderToStaticMarkup(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(Article, {
          projet: projet({ demoUrl }), tete: false, surOuverture: () => {},
        }),
      ),
    );

  it.each([
    ["http:", "http://exemple.test"],
    ["sans schema", "exemple.test"],
    ["javascript:", "javascript:alert(1)"],
    ["espaces seuls", "   "],
  ])(
    "%s ne produit aucun lien",
    (_etiquette, v) => {
      expect(rendre(v)).not.toMatch(/<a[\s>]/);
    },
  );

  it("un https valide produit un lien", () => {
    const html = rendre("https://exemple.test/demo");
    expect(html).toMatch(/<a\s[^>]*href="https:\/\/exemple.test\/demo"/);
  });
});

describe("la feuille du declencheur", () => {
  const css = lire("app/globals.css");
  const corps = bloc(/\.journal-declencheur\s*\{/, css);

  it("reprend le style du titre, sans mouvement", () => {
    expect(valeur(corps, "background")).toBe("none");
    expect(valeur(corps, "border")).toBe("0");
    expect(valeur(corps, "font")).toBe("inherit");
    expect(valeur(corps, "color")).toBe("inherit");
    expect(corps, "un mouvement sur le declencheur").not.toMatch(/transition|animation|transform/);
  });

  it("garde ce qui le fait ressembler au titre et non a un bouton", () => {
    expect(valeur(corps, "padding")).toBe("0");
    // Un bouton centre son texte par defaut : sans cela le titre se centrerait.
    expect(valeur(corps, "text-align")).toBe("start");
    expect(valeur(corps, "cursor")).toBe("pointer");
  });

  it("offre une cible d'au moins 24 px", () => {
    expect(px(valeur(corps, "min-block-size"))).toBeGreaterThanOrEqual(24);
    expect(px(valeur(corps, "min-inline-size"))).toBeGreaterThanOrEqual(24);
  });

  it("le bouton Details a une bordure signifiante et une cible d'au moins 24 px", () => {
    const d = bloc(/\.journal-details\s*\{/, css);
    expect(valeur(d, "border")).toBe("1px solid var(--bordure-signifiante)");
    expect(px(valeur(d, "min-block-size"))).toBeGreaterThanOrEqual(24);
    expect(px(valeur(d, "min-inline-size"))).toBeGreaterThanOrEqual(24);
    expect(d, "un mouvement sur le bouton Details").not.toMatch(/transition|animation|transform/);
    const f = bloc(/\.journal-details:focus-visible\s*\{/, css);
    expect(valeur(f, "outline")).toBe("2px solid var(--accent)");
  });

  it("montre le focus au clavier", () => {
    const f = bloc(/\.journal-declencheur:focus-visible\s*\{/, css);
    expect(valeur(f, "outline")).toBe("2px solid var(--accent)");
    expect(valeur(f, "outline-offset")).toBe("3px");
  });
});
