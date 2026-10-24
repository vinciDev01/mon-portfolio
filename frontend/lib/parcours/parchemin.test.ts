import { describe, it, expect } from "vitest";
import type { ProjectDto, ProjectCollaboratorDto } from "@portfolio/shared-types";
import { blocsPresents, credits, lienDemo, lienProjet } from "./parchemin";
import { bloc, corpsDepuis, css, px, sansCommentaires, valeur, variableA } from "./feuille-test";
import { ratioContraste, luminanceRelative } from "@/lib/color/contrast";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";

function projet(p: Partial<ProjectDto>): ProjectDto {
  return {
    id: "x", name: "Projet", description: null,
    photo1Path: null, photo2Path: null, demoUrl: null, projectUrl: null,
    targetAudience: null,
    startDate: null, endDate: null, technologies: [], collaborators: [],
    sortOrder: 0, ...p,
  } as ProjectDto;
}

function qui(p: Partial<ProjectCollaboratorDto>): ProjectCollaboratorDto {
  return {
    id: "c", firstName: "Ada", lastName: "Lovelace",
    email: null, linkedinUrl: null, sortOrder: 0, ...p,
  };
}

describe("blocsPresents (spec section 4)", () => {
  // Spec section 4 : un projet depouille ne rend aucun bloc.
  it("ne rend aucun bloc pour un projet sans rien", () => {
    expect(blocsPresents(projet({}))).toEqual([]);
  });

  it("rend les photos des qu une seule existe", () => {
    expect(blocsPresents(projet({ photo1Path: "a.webp" }))).toContain("photos");
    expect(blocsPresents(projet({ photo2Path: "b.webp" }))).toContain("photos");
  });

  it("ne rend pas les photos quand les deux sont vides ou blanches", () => {
    expect(blocsPresents(projet({ photo1Path: "", photo2Path: "" }))).not.toContain("photos");
    expect(blocsPresents(projet({ photo1Path: "  ", photo2Path: " \t" }))).not.toContain("photos");
    expect(blocsPresents(projet({ photo1Path: "  ", photo2Path: "b.webp" }))).toContain("photos");
    expect(blocsPresents(projet({ photo1Path: "a.webp", photo2Path: "  " }))).toContain("photos");
  });

  it("ne rend pas la demonstration quand demoUrl est vide ou blanche", () => {
    expect(blocsPresents(projet({ demoUrl: "" }))).not.toContain("demonstration");
    expect(blocsPresents(projet({ demoUrl: "   " }))).not.toContain("demonstration");
    expect(blocsPresents(projet({ demoUrl: "https://exemple.test" }))).toContain("demonstration");
  });

  it("ne rend pas le public cible quand il est vide ou blanc", () => {
    expect(blocsPresents(projet({ targetAudience: "" }))).not.toContain("public");
    expect(blocsPresents(projet({ targetAudience: "   " }))).not.toContain("public");
  });

  it("ne rend pas la description quand elle est vide ou blanche", () => {
    expect(blocsPresents(projet({ description: "" }))).not.toContain("description");
    expect(blocsPresents(projet({ description: "  " }))).not.toContain("description");
  });

  it("ne rend pas les technologies sur une liste vide", () => {
    expect(blocsPresents(projet({ technologies: [] }))).not.toContain("technologies");
  });

  it("ne rend pas les collaborateurs sur une liste vide", () => {
    expect(blocsPresents(projet({ collaborators: [] }))).not.toContain("collaborateurs");
  });

  it("ne rend pas les collaborateurs quand le seul est sans prenom ni nom", () => {
    const sansNom = qui({ firstName: "", lastName: "  " });
    expect(blocsPresents(projet({ collaborators: [sansNom] }))).not.toContain("collaborateurs");
  });

  it("rend les collaborateurs quand l un d eux a un nom", () => {
    const sansNom = qui({ id: "v", firstName: "", lastName: "" });
    expect(blocsPresents(projet({ collaborators: [sansNom, qui({})] }))).toContain("collaborateurs");
  });

  it("ne rend pas l adresse du projet quand projectUrl est vide ou blanche", () => {
    expect(blocsPresents(projet({ projectUrl: "" }))).not.toContain("adresseProjet");
    expect(blocsPresents(projet({ projectUrl: "   " }))).not.toContain("adresseProjet");
    expect(blocsPresents(projet({ projectUrl: "https://exemple.test" })))
      .toContain("adresseProjet");
  });

  it("les deux adresses sont INDEPENDANTES, chacune son bloc", () => {
    // Le piege serait de lire un seul champ pour les deux blocs, ou de
    // conditionner l'un a l'autre : le proprietaire peut n'avoir que l'une.
    const seulProjet = blocsPresents(projet({ projectUrl: "https://exemple.test" }));
    expect(seulProjet).toContain("adresseProjet");
    expect(seulProjet, "la demonstration parait sans demoUrl").not.toContain("demonstration");
    const seuleDemo = blocsPresents(projet({ demoUrl: "https://exemple.test/demo" }));
    expect(seuleDemo).toContain("demonstration");
    expect(seuleDemo, "l adresse du projet parait sans projectUrl")
      .not.toContain("adresseProjet");
  });

  it("garde l ordre de lecture de la spec", () => {
    const tout = projet({
      photo1Path: "a.webp", description: "d", targetAudience: "p",
      technologies: [{ id: "t", label: "Angular", logoPath: null, sortOrder: 0, showInCv: true, family: null }],
      collaborators: [qui({})],
      projectUrl: "https://exemple.test",
      demoUrl: "https://exemple.test/demo",
    });
    // Les deux adresses ferment, le projet AVANT sa demonstration : une
    // demonstration est un artefact derive de la chose qu'elle demontre, et
    // la spec garde le lien de demonstration « en cloture ».
    expect(blocsPresents(tout)).toEqual([
      "photos", "description", "public", "technologies",
      "collaborateurs", "adresseProjet", "demonstration",
    ]);
  });
});

describe("credits (spec section 4)", () => {
  // Spec section 4 : un collaborateur dont `linkedinUrl` est nul rend son
  // nom SANS lien, et non un lien mort.
  it("rend un nom sans lien quand le LinkedIn est nul", () => {
    expect(credits(projet({ collaborators: [qui({ linkedinUrl: null })] })))
      .toEqual([{ cle: "c", nom: "Ada Lovelace", lien: null }]);
  });

  it("traite une chaine vide ou blanche comme une absence de lien", () => {
    expect(credits(projet({ collaborators: [qui({ linkedinUrl: "   " })] }))[0].lien)
      .toBeNull();
  });

  it("rend le lien quand il existe", () => {
    const c = credits(projet({
      collaborators: [qui({ linkedinUrl: "https://linkedin.test/in/ada" })],
    }));
    expect(c[0].lien).toBe("https://linkedin.test/in/ada");
  });

  it("trie par sortOrder, et non par id, prenom ou ordre d arrivee", () => {
    // Ordre d'arrivee : z, m, a. Par id : a, m, z. Par prenom : Alice, Bob, Zoe.
    // Par sortOrder : m (1), a (2), z (3). Quatre ordres, un seul passe.
    const c = credits(projet({
      collaborators: [
        qui({ id: "z", firstName: "Bob", lastName: "", sortOrder: 3 }),
        qui({ id: "m", firstName: "Zoe", lastName: "", sortOrder: 1 }),
        qui({ id: "a", firstName: "Alice", lastName: "", sortOrder: 2 }),
      ],
    }));
    expect(c.map((x) => x.cle)).toEqual(["m", "a", "z"]);
  });

  it("tri stable : a egalite de sortOrder, l ordre d arrivee est conserve", () => {
    const c = credits(projet({
      collaborators: [
        qui({ id: "z", sortOrder: 1 }),
        qui({ id: "y", sortOrder: 0 }),
        qui({ id: "a", sortOrder: 1 }),
        qui({ id: "b", sortOrder: 1 }),
      ],
    }));
    expect(c.map((x) => x.cle)).toEqual(["y", "z", "a", "b"]);
  });

  it("ne laisse sortir aucun courriel, ni cle ni valeur", () => {
    const c = credits(projet({
      collaborators: [qui({ email: "ada@secret.test", linkedinUrl: "https://linkedin.test/in/ada" })],
    }));
    expect(c).toHaveLength(1);
    expect(Object.keys(c[0]).sort()).toEqual(["cle", "lien", "nom"]);
    for (const v of Object.values(c[0])) expect(String(v)).not.toContain("@");
  });

  it("rogne les blancs autour de l URL et rend la valeur exacte", () => {
    const c = credits(projet({
      collaborators: [qui({ linkedinUrl: "  https://linkedin.test/in/ada \n" })],
    }));
    expect(c[0].lien).toBe("https://linkedin.test/in/ada");
  });

  it("n accepte que https: pour le lien, le nom reste", () => {
    for (const mauvais of [
      "javascript:alert(1)", "  JavaScript:alert(1)", "http://linkedin.test/in/ada",
      "data:text/html,x", "linkedin.test/in/ada", "https:",
    ]) {
      const c = credits(projet({ collaborators: [qui({ linkedinUrl: mauvais })] }));
      expect(c, mauvais).toEqual([{ cle: "c", nom: "Ada Lovelace", lien: null }]);
    }
    expect(credits(projet({ collaborators: [qui({ linkedinUrl: "https://linkedin.test/in/ada" })] }))[0].lien)
      .toBe("https://linkedin.test/in/ada");
  });

  it("exclut un collaborateur sans prenom ni nom", () => {
    const c = credits(projet({
      collaborators: [
        qui({ id: "v", firstName: "", lastName: "  " }),
        qui({ id: "a" }),
      ],
    }));
    expect(c.map((x) => x.cle)).toEqual(["a"]);
  });

  it("ne modifie pas le tableau recu", () => {
    const liste = [
      qui({ id: "b", sortOrder: 5 }),
      qui({ id: "a", sortOrder: 0 }),
    ];
    credits(projet({ collaborators: liste }));
    expect(liste.map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("tolere un nom partiel sans laisser d espace en trop", () => {
    expect(credits(projet({ collaborators: [qui({ lastName: "" })] }))[0].nom)
      .toBe("Ada");
  });
});

describe("lienDemo (spec section 4)", () => {

  it("n accepte que https: pour le lien de demonstration non plus", () => {
    // Le MEME champ de risque que le LinkedIn : rendu comme un lien vivant sur
    // une page publique, et alimente par le backoffice.
    for (const mauvais of [
      "javascript:alert(1)", "  JavaScript:alert(1)", "http://exemple.test",
      "data:text/html,x", "exemple.test/demo", "https:", "", "   ",
    ]) {
      expect(lienDemo(projet({ demoUrl: mauvais })), mauvais).toBeNull();
    }
    expect(lienDemo(projet({ demoUrl: null }))).toBeNull();
    expect(lienDemo(projet({ demoUrl: "  https://exemple.test/demo  " })))
      .toBe("https://exemple.test/demo");
  });

  it("ecarte le bloc demonstration quand le lien n est pas exploitable", () => {
    // `blocsPresents` et `lienDemo` doivent s'accorder, comme le font deja
    // `blocsPresents` et `credits` : un titre sans lien dessous est un bloc vide.
    for (const mauvais of ["javascript:alert(1)", "http://exemple.test", "data:text/html,x"]) {
      expect(blocsPresents(projet({ demoUrl: mauvais })), mauvais)
        .not.toContain("demonstration");
    }
    expect(blocsPresents(projet({ demoUrl: "https://exemple.test" })))
      .toContain("demonstration");
  });
});

describe("lienProjet : l adresse du projet suit la MEME regle (spec section 4)", () => {
  it("n accepte que https:, comme la demonstration et les credits", () => {
    // Le MEME champ de risque : rendu comme un lien vivant sur une page
    // publique, et alimente par le backoffice.
    for (const mauvais of [
      "javascript:alert(1)", "  JavaScript:alert(1)", "http://exemple.test",
      "data:text/html,x", "exemple.test", "https:", "", "   ",
    ]) {
      expect(lienProjet(projet({ projectUrl: mauvais })), mauvais).toBeNull();
    }
    expect(lienProjet(projet({ projectUrl: null }))).toBeNull();
    expect(lienProjet(projet({ projectUrl: "  https://exemple.test  " })))
      .toBe("https://exemple.test");
  });

  it("ecarte le bloc de l adresse quand le lien n est pas exploitable", () => {
    // `blocsPresents` et `lienProjet` doivent s'accorder : un titre sans lien
    // dessous est un bloc vide, et les deux lisent la MEME fonction.
    for (const mauvais of ["javascript:alert(1)", "http://exemple.test", "data:text/html,x"]) {
      expect(blocsPresents(projet({ projectUrl: mauvais })), mauvais)
        .not.toContain("adresseProjet");
    }
    expect(blocsPresents(projet({ projectUrl: "https://exemple.test" })))
      .toContain("adresseProjet");
  });

  it("ne confond pas les deux champs : chacun lit le SIEN", () => {
    expect(lienProjet(projet({ demoUrl: "https://exemple.test/demo" })),
      "lienProjet lit demoUrl").toBeNull();
    expect(lienDemo(projet({ projectUrl: "https://exemple.test" })),
      "lienDemo lit projectUrl").toBeNull();
    const deux = projet({
      projectUrl: "https://exemple.test",
      demoUrl: "https://exemple.test/demo",
    });
    expect(lienProjet(deux)).toBe("https://exemple.test");
    expect(lienDemo(deux)).toBe("https://exemple.test/demo");
  });
});

/**
 * Les declarations `propriete: valeur` d'un corps de regle, commentaires exclus.
 *
 * Le nom de propriete accepte les MAJUSCULES et un prefixe fournisseur, parce
 * que le CSS les accepte : `Transform:` et `-webkit-transform:` sont honores par
 * les navigateurs. Il est rendu en minuscules, de sorte que les balayages
 * ci-dessous n'aient pas a se soucier de la casse.
 */
function declarations(corps: string): Array<{ prop: string; val: string }> {
  return sansCommentaires(corps)
    .split(";")
    .map((d) => /^\s*(-?[A-Za-z][A-Za-z0-9-]*)\s*:\s*([\s\S]*?)\s*$/.exec(d))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ prop: m[1]!.toLowerCase(), val: m[2]! }));
}

/** Les prefixes fournisseur, optionnels devant chaque nom de propriete. */
const PREFIXE = "(?:-(?:webkit|moz|ms|o)-)?";

/**
 * Les declarations de mouvement d'un corps. On ancre sur le NOM ENTIER de la
 * propriete, prefixe fournisseur optionnel compris et sans distinction de
 * casse : `text-transform` est legitime, `transform`, `-webkit-transform` et
 * `Transform` ne le sont pas. Les deux dernieres orthographes contournaient le
 * balayage, mesure, et ce sont du CSS que les navigateurs honorent.
 */
const PROPRIETES_MOUVEMENT = new RegExp(
  `^${PREFIXE}(?:transition|animation|transform|translate|rotate|scale|skew|scroll-behavior|offset|zoom)(?:-[a-z-]+)?$`,
);
const WILL_CHANGE = new RegExp(`^${PREFIXE}will-change$`);
function mouvements(corps: string): string[] {
  return declarations(corps)
    .filter(
      ({ prop, val }) =>
        PROPRIETES_MOUVEMENT.test(prop) ||
        (WILL_CHANGE.test(prop) && /transform|translate|rotate|scale|offset/i.test(val)),
    )
    .map(({ prop, val }) => `${prop}: ${val}`);
}

/** Les declarations d'image de fond ou de degrade d'un corps. */
const PROPRIETES_IMAGE = /^(?:background-image|border-image(?:-source)?|mask-image|list-style-image)$/;
function degrades(corps: string): string[] {
  return declarations(corps)
    .filter(
      ({ prop, val }) =>
        PROPRIETES_IMAGE.test(prop) || /gradient|var\(--degrade/.test(val),
    )
    .map(({ prop, val }) => `${prop}: ${val}`);
}

/** Corps de chaque bloc dont l'en-tete correspond. */
function blocs(entete: RegExp, source: string): string[] {
  const re = new RegExp(entete.source, "g");
  const trouves: string[] = [];
  for (let m = re.exec(source); m; m = re.exec(source)) {
    trouves.push(corpsDepuis(source, m.index + m[0].length - 1));
  }
  return trouves;
}

/** La feuille privee de ses blocs `forced-colors` : les regles de BASE seules. */
function sansCouleursForcees(source: string): string {
  const re = /@media \(forced-colors: active\)\s*\{/;
  let out = source;
  for (let m = re.exec(out); m; m = re.exec(out)) {
    const depart = m.index + m[0].length - 1;
    const corps = corpsDepuis(out, depart);
    out = out.slice(0, m.index) + out.slice(depart + corps.length + 2);
  }
  return out;
}

const FORCEES = blocs(/@media \(forced-colors: active\)\s*\{/, css).join("\n");
const BASE = sansCouleursForcees(css);
const regles = (source: string) =>
  [...source.matchAll(/([^{}]*\.parchemin[a-z-]*[^{}]*)\{([^}]*)\}/g)];

/* `ch` est une metrique de police, absente de la feuille : meme valeur de
   travail que `degagement.test.ts`, 8,73 px par caractere, soit 576 px pour
   66 ch (spec 4.3). Elle sert a comparer une mesure en `ch` a un padding en
   `px`, les deux unites que la feuille melange ici. */
const CH = 576 / 66;

describe("le balayage de mouvement ancre sur des noms de propriete entiers", () => {
  it("laisse passer text-transform, qui n'est pas un mouvement", () => {
    expect(mouvements("text-transform: uppercase; letter-spacing: 0.1em")).toEqual([]);
  });

  // Les deux orthographes qui contournaient le balayage : du CSS valide, que
  // les navigateurs honorent, et que le site interdit tout autant.
  it("attrape un prefixe fournisseur", () => {
    expect(mouvements("-webkit-transform: rotate(3deg)")).toHaveLength(1);
    expect(mouvements("-moz-transition: fill 1s")).toHaveLength(1);
    expect(mouvements("-ms-animation: deroule 1s")).toHaveLength(1);
    expect(mouvements("-o-transform: scale(1.1)")).toHaveLength(1);
    expect(mouvements("-webkit-will-change: transform")).toHaveLength(1);
  });

  it("attrape une majuscule", () => {
    expect(mouvements("Transform: rotate(3deg)")).toHaveLength(1);
    expect(mouvements("TRANSITION: fill 1s")).toHaveLength(1);
    expect(mouvements("-WebKit-Transform: rotate(3deg)")).toHaveLength(1);
    expect(mouvements("will-change: Transform")).toHaveLength(1);
  });

  // Aucune propriete legitime ne doit tomber dans le filet, prefixee ou non :
  // c'est le faux positif qu'un passage precedent avait du corriger.
  it("ne rejette aucune propriete legitime", () => {
    for (const bonne of [
      "text-transform: uppercase",
      "Text-Transform: uppercase",
      "-webkit-text-size-adjust: 100%",
      "-webkit-font-smoothing: antialiased",
      "overflow-y: auto",
      "-webkit-overflow-scrolling: touch",
      "overscroll-behavior: contain",
      "background: var(--surface)",
      "letter-spacing: 0.1em",
      "will-change: auto",
      "-webkit-will-change: auto",
    ]) {
      expect(mouvements(bonne), bonne).toEqual([]);
    }
  });

  it("ignore les commentaires du corps", () => {
    expect(mouvements("/* transition: all 1s; animation: x */ color: red")).toEqual([]);
  });

  for (const interdit of [
    "animation: deroule 1s",
    "animation-name: deroule",
    "transition: fill 1s",
    "transition-duration: 1s",
    "transform: rotate(3deg)",
    "transform-origin: top",
    "scale: 1.1",
    "rotate: 3deg",
    "translate: 0 4px",
    "skew: 2deg",
    "scroll-behavior: smooth",
    "offset-path: circle(10px)",
    "zoom: 1.2",
    "will-change: transform",
  ]) {
    it(`attrape ${interdit}`, () => {
      expect(mouvements(interdit)).toHaveLength(1);
    });
  }

  it("laisse passer will-change sur une valeur sans mouvement", () => {
    expect(mouvements("will-change: auto")).toEqual([]);
  });
});

describe("la forme du parchemin (spec section 2)", () => {
  it("declare la feuille et les bandes dans les regles de BASE", () => {
    const noms = regles(BASE).map((m) => m[1]).join(" ");
    expect(noms).toContain(".parchemin-feuille");
    expect(noms).toContain(".parchemin-bande");
  });

  // Categorique : AUCUNE regle du parchemin ne bouge, quelle qu'elle soit.
  it("aucune regle du parchemin ne porte de mouvement", () => {
    const r = regles(css);
    expect(r.length, "aucune regle .parchemin").toBeGreaterThan(0);
    for (const [, sel, corps] of r) {
      expect(mouvements(corps!), sel!.trim()).toEqual([]);
    }
  });

  it("aucun @keyframes ne sert le parchemin", () => {
    expect(css).not.toMatch(/@keyframes\s+[a-z-]*parchemin/);
  });

  it("aucune regle du parchemin ne porte de degrade ni d'image de fond", () => {
    for (const [, sel, corps] of regles(css)) {
      expect(degrades(corps!), sel!.trim()).toEqual([]);
    }
  });

  it("le detecteur de degrade attrape les images et les variables de degrade", () => {
    expect(degrades("background-image: var(--degrade)")).toHaveLength(1);
    expect(degrades("background: linear-gradient(red, blue)")).toHaveLength(1);
    expect(degrades("background: radial-gradient(red, blue)")).toHaveLength(1);
    expect(degrades("background: var(--surface)")).toEqual([]);
  });

  describe("la boite", () => {
    const boite = bloc(/(?:^|[\s}])\.parchemin\s*\{/, BASE);

    it("a l'encre de la page et non celle du navigateur", () => {
      expect(valeur(boite, "color")).toBe("var(--texte)");
    });

    it("tient dans la zone VISIBLE : 100dvh, jamais 100vh", () => {
      const h = valeur(boite, "max-height");
      expect(h).toMatch(/^calc\(100dvh - /);
      expect(h).not.toMatch(/\dvh\b/);
    });

    it("reste transparente, la feuille porte la surface", () => {
      expect(valeur(boite, "background")).toBe("transparent");
    });
  });

  describe("la feuille", () => {
    const f = bloc(/\.parchemin-feuille\s*\{/, BASE);

    it("est en surface", () => {
      expect(valeur(f, "background")).toBe("var(--surface)");
    });

    it("est bordee de la bordure signifiante", () => {
      expect(valeur(f, "border-inline")).toBe("1px solid var(--bordure-signifiante)");
    });

    it("est une grille bande, corps qui prend le reste, bande", () => {
      expect(valeur(f, "display")).toBe("grid");
      expect(valeur(f, "grid-template-rows")).toBe("auto 1fr auto");
    });

    it("herite de la hauteur maximale du dialog, ce qui borne le 1fr", () => {
      expect(valeur(f, "max-height")).toBe("inherit");
    });
  });

  describe("le corps", () => {
    it("defile seul, les bandes restent en place", () => {
      expect(valeur(bloc(/\.parchemin-corps\s*\{/, BASE), "overflow-y")).toBe("auto");
    });
  });

  describe("la largeur de la feuille (revision 1 ter)", () => {
    const boite = bloc(/(?:^|[\s}])\.parchemin\s*\{/, BASE);
    const maxWidth = valeur(boite, "max-width");

    it("plafonne a 110ch : un panneau de deux photos n'est pas une colonne de texte", () => {
      const m = /^min\(\s*([\d.]+)ch\s*,/.exec(maxWidth);
      expect(m, `max-width illisible : ${maxWidth}`).not.toBeNull();
      expect(Number(m![1]), `plafond de ${m![1]}ch`).toBe(110);
    });

    it("garde le calc(100vw - ...) qui protege les petits ecrans", () => {
      expect(maxWidth).toMatch(
        /^min\(\s*[\d.]+ch\s*,\s*calc\(100vw - 2 \* var\(--espace-3\)\)\s*\)$/,
      );
    });
  });

  describe("les blocs du corps (revision 1 ter)", () => {
    // Le selecteur est lu tel quel : `> *` et non un conteneur intermediaire.
    const enfants = bloc(/\.parchemin-corps\s*>\s*\*\s*\{/, BASE);

    it("gardent le texte aligne au debut", () => {
      expect(valeur(enfants, "text-align")).toBe("start");
    });

    it("n'ont AUCUNE mesure ni centrage : ils prennent toute la largeur du corps", () => {
      // Toutes les regles dont le selecteur vise les enfants du corps, et non
      // la premiere : une seconde regle reintroduirait la mesure ailleurs.
      const regles_ = regles(BASE).filter(([, sel]) =>
        /\.parchemin-corps\s*>\s*\*/.test(sel!),
      );
      expect(regles_.length, "aucune regle `.parchemin-corps > *`").toBeGreaterThan(0);
      const MESURES =
        /^(?:max-|min-)?(?:inline-size|width)$|^margin-inline(?:-start|-end)?$|^margin$|^padding-inline(?:-start|-end)?$/;
      for (const [, sel, corps] of regles_) {
        const posees = declarations(corps!)
          .filter(({ prop }) => MESURES.test(prop))
          .map(({ prop, val }) => `${prop}: ${val}`);
        expect(posees, `${sel!.trim()} reintroduit une mesure`).toEqual([]);
      }
    });
  });

  describe("la mesure de prose (revision 1 ter)", () => {
    const prose = bloc(/\.parchemin-prose\s*\{/, BASE);
    const BOITE_CH = Number.parseFloat(
      /^(?:min\(\s*)?([\d.]+)ch/.exec(
        valeur(bloc(/(?:^|[\s}])\.parchemin\s*\{/, BASE), "max-width"),
      )![1]!,
    );
    const PADDING = (() => {
      const decl = valeur(bloc(/\.parchemin-corps\s*\{/, BASE), "padding");
      const v = /^var\((--[\w-]+)\)$/.exec(decl);
      return v ? variableA(v[1]!, 1440) : px(decl);
    })();
    const UTILE = BOITE_CH * CH - 2 * PADDING;
    const MESURE_CH = Number.parseFloat(valeur(prose, "max-inline-size"));

    it("les longueurs du calcul se lisent bien dans la feuille", () => {
      // Sans cela, un `NaN` rendrait les comparaisons suivantes muettes.
      expect(BOITE_CH, "plafond de la boite illisible").toBeGreaterThan(0);
      expect(PADDING, "padding du corps illisible").toBeGreaterThan(0);
      expect(MESURE_CH, "mesure de prose illisible").toBeGreaterThan(0);
    });

    it("vaut environ 70ch, en ch : au-dela de 75 l'oeil perd la ligne suivante", () => {
      expect(valeur(prose, "max-inline-size")).toMatch(/^[\d.]+ch$/);
      expect(MESURE_CH).toBeGreaterThanOrEqual(65);
      expect(MESURE_CH).toBeLessThanOrEqual(75);
    });

    it("tient dans la place utile de la feuille, padding du corps deduit", () => {
      // Marge large : `ch` est ici la metrique du depot, pas l'avance de la
      // police, donc aucune comparaison a quelques pixels pres.
      const mesure = MESURE_CH * CH;
      expect(
        mesure,
        `mesure ${mesure.toFixed(0)}px pour ${UTILE.toFixed(0)}px utiles`,
      ).toBeLessThan(UTILE);
    });

    it("est centree par margin-inline: auto", () => {
      expect(valeur(prose, "margin-inline")).toBe("auto");
    });
  });

  describe("la croix de fermeture (revision 2)", () => {
    const x = bloc(/\.parchemin-fermer\s*\{/, BASE);

    it("offre une cible d'au moins 24 px, par la feuille", () => {
      expect(px(valeur(x, "min-inline-size"))).toBeGreaterThanOrEqual(24);
      expect(px(valeur(x, "min-block-size"))).toBeGreaterThanOrEqual(24);
    });

    it("garde la bordure signifiante", () => {
      expect(valeur(x, "border")).toBe("1px solid var(--bordure-signifiante)");
    });
  });

  describe("le logo LinkedIn des credits", () => {
    const lien = bloc(/\.parchemin-credit-lien\s*\{/, BASE);
    const ligne = bloc(/\.parchemin-credit\s*\{/, BASE);

    it("offre une cible d'au moins 24 px, par la feuille", () => {
      expect(px(valeur(lien, "min-inline-size"))).toBeGreaterThanOrEqual(24);
      expect(px(valeur(lien, "min-block-size"))).toBeGreaterThanOrEqual(24);
    });

    it("pose le nom et le logo sur une meme ligne", () => {
      expect(valeur(ligne, "display")).toBe("flex");
    });

    it("ne bouge pas et ne coupe pas l'ajustement des couleurs", () => {
      for (const corps of [lien, ligne]) {
        expect(mouvements(corps)).toEqual([]);
        expect(corps).not.toMatch(/forced-color-adjust|gradient/);
      }
    });
  });

  describe("les bandes d enroulement", () => {
    const b = bloc(/\.parchemin-bande\s*\{/, BASE);

    it("sont remplies a plat en fond, et tracees de la bordure signifiante", () => {
      expect(valeur(b, "fill")).toBe("var(--fond)");
      expect(valeur(b, "stroke")).toBe("var(--bordure-signifiante)");
    });

    it("sont en bloc, sans interstice de ligne de base", () => {
      expect(valeur(b, "display")).toBe("block");
      expect(valeur(b, "height")).toBe("24px");
    });
  });

  describe("en couleurs forcees", () => {
    const b = bloc(/\.parchemin-bande\s*\{/, FORCEES);
    const f = bloc(/\.parchemin-feuille\s*\{/, FORCEES);

    it("les bandes prennent une paire systeme, exacte", () => {
      expect(valeur(b, "fill")).toBe("Canvas");
      expect(valeur(b, "stroke")).toBe("CanvasText");
    });

    it("la bordure de la feuille prend CanvasText", () => {
      expect(valeur(f, "border-inline")).toBe("1px solid CanvasText");
    });

    it("ne coupe jamais l'ajustement des couleurs", () => {
      for (const corps of [b, f]) expect(corps).not.toMatch(/forced-color-adjust/);
    });
  });
});

describe("les contrastes du parchemin, calcules et non epingles", () => {
  for (const [nom, p] of [["clair", PALETTE_CLAIRE], ["sombre", PALETTE_SOMBRE]] as const) {
    it(`${nom} : bordure sur la feuille atteint 3:1`, () => {
      expect(ratioContraste(p.bordureSignifiante, p.surface)).toBeGreaterThanOrEqual(3);
    });
    it(`${nom} : texte secondaire sur la feuille atteint 4,5:1`, () => {
      expect(ratioContraste(p.texteSecondaire, p.surface)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${nom} : accent sur la feuille atteint 4,5:1`, () => {
      expect(ratioContraste(p.accent, p.surface)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("le fond reste plus sombre que la surface, sinon la bande ne lit plus", () => {
    // C'est ce qui fait qu'une bande en `--fond` se lit comme un dessous
    // ombre dans les DEUX palettes, sans degrade.
    expect(luminanceRelative(PALETTE_CLAIRE.fond)).toBeLessThan(luminanceRelative(PALETTE_CLAIRE.surface));
    expect(luminanceRelative(PALETTE_SOMBRE.fond)).toBeLessThan(luminanceRelative(PALETTE_SOMBRE.surface));
  });
});

describe("le parchemin est centre dans la fenetre", () => {
  it("rend au dialog le margin: auto que le preflight de Tailwind lui retire", () => {
    // Le preflight pose `margin: 0` sur tout element, ce qui ecrase le
    // `margin: auto` par lequel le navigateur centre un dialog modal : la
    // feuille se collait en haut a gauche.
    expect(valeur(bloc(/^\s*\.parchemin\s*\{/m), "margin")).toBe("auto");
  });
});

describe("les photos du parchemin laissent voir le reste de la feuille", () => {
  it("plafonnent leur hauteur et gardent leurs proportions", () => {
    const img = bloc(/\.parchemin-photos img\s*\{/);
    expect(valeur(img, "max-height")).toMatch(/dvh|px/);
    expect(valeur(img, "object-fit")).toBe("contain");
    expect(valeur(img, "width")).toBe("auto");
  });

  it("se placent cote a cote quand la largeur le permet", () => {
    expect(valeur(bloc(/\.parchemin-photos\s*\{/), "grid-template-columns")).toMatch(/auto-fit/);
  });
});
