// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import type { PersonalInfoDto } from "@portfolio/shared-types";
import { Coordonnees } from "@/components/portfolio/coordonnees";
import { I18nProvider } from "../i18n/i18n-context";
import { corpsDepuis, cssNu, lire, px, valeur } from "./feuille-test";
import { ratioContraste } from "@/lib/color/contrast";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;

// Les libelles attendus se LISENT dans le dictionnaire, accents compris.
const fr = JSON.parse(lire("lib/i18n/fr.json")) as Record<string, string>;
const en = JSON.parse(lire("lib/i18n/en.json")) as Record<string, string>;
const de = JSON.parse(lire("lib/i18n/de.json")) as Record<string, string>;

function fiche(partiel: Partial<PersonalInfoDto> = {}): PersonalInfoDto {
  return {
    id: "id-1",
    name: "Ada",
    surname: "Lovelace",
    email: partiel.email ?? "",
    phone: partiel.phone === undefined ? null : partiel.phone,
    githubUrl: partiel.githubUrl === undefined ? null : partiel.githubUrl,
    linkedinUrl: partiel.linkedinUrl === undefined ? null : partiel.linkedinUrl,
    avatarPath: null,
    bio: null,
  };
}

/** Deux canaux presents (courriel, GitHub), deux absents (telephone blanc, LinkedIn http). */
const mixte = fiche({
  email: "ada@exemple.test",
  phone: "   ",
  linkedinUrl: "http://linkedin.test/in/ada",
  githubUrl: "https://github.test/ada",
});

let racine: ReturnType<typeof createRoot> | null = null;
let hote: HTMLDivElement;

beforeEach(() => {
  document.body.innerHTML = "";
  hote = document.createElement("div");
  document.body.append(hote);
});

afterEach(() => {
  if (racine) act(() => racine!.unmount());
  racine = null;
  hote.remove();
  document.body.innerHTML = "";
});

function monter(element: ReturnType<typeof createElement>, langue = "fr") {
  racine = createRoot(hote);
  act(() => {
    racine!.render(createElement(Fournisseur, { defaultLocale: langue }, element));
  });
}

const liens = () => [...document.querySelectorAll("a")];

describe("le volet des coordonnees (spec section 3.1)", () => {
  it("rend un lien par canal present, dans l ordre, et aucun pour un canal absent", () => {
    monter(createElement(Coordonnees, { infos: mixte }));
    expect(liens().map((a) => a.textContent)).toEqual([
      fr["contact.email"] + " ada@exemple.test",
      "GitHub",
    ]);
    expect(document.querySelectorAll("li")).toHaveLength(2);
  });

  it("rend les quatre canaux dans l ordre de lecture quand tous sont presents", () => {
    monter(createElement(Coordonnees, {
      infos: fiche({
        email: "a@exemple.test",
        phone: "+33 6 12",
        linkedinUrl: "https://linkedin.test/in/a",
        githubUrl: "https://github.test/a",
      }),
    }));
    expect(liens().map((a) => a.textContent)).toEqual([
      `${fr["contact.email"]} a@exemple.test`,
      `${fr["contact.phone"]} +33 6 12`,
      fr["contact.linkedin"],
      fr["contact.github"],
    ]);
  });

  it("compose mailto: et tel: sur les bons liens, et l adresse du profil sur les autres", () => {
    monter(createElement(Coordonnees, {
      infos: fiche({
        email: "a@exemple.test",
        phone: "+33 6 12 34",
        linkedinUrl: "https://linkedin.test/in/a",
        githubUrl: "https://github.test/a",
      }),
    }));
    expect(liens().map((a) => a.getAttribute("href"))).toEqual([
      "mailto:a@exemple.test",
      "tel:+33612" + "34",
      "https://linkedin.test/in/a",
      "https://github.test/a",
    ]);
  });

  // Point de vigilance 1 : aucun titre orphelin.
  it("ne rend NI titre NI liste quand aucun canal n est exploitable", () => {
    monter(createElement(Coordonnees, {
      infos: fiche({ email: "", phone: "   ", linkedinUrl: null, githubUrl: "" }),
    }));
    expect(document.querySelectorAll("a")).toHaveLength(0);
    expect(document.querySelectorAll("h3, ul")).toHaveLength(0);
    expect(document.body.textContent).not.toContain(fr["contact.email"]);
    expect(document.body.textContent).not.toContain(fr["contact.headline"]);
  });

  it("rend le titre et la liste quand au moins un canal est exploitable", () => {
    monter(createElement(Coordonnees, { infos: mixte }));
    expect(document.querySelector("h3")!.textContent).toBe(fr["contact.headline"]);
    expect(document.querySelectorAll("ul")).toHaveLength(1);
  });

  it("le nom accessible contient le libelle ET la valeur quand ils different", () => {
    monter(createElement(Coordonnees, { infos: mixte }));
    const courriel = liens()[0]!;
    expect(fr["contact.email"]).not.toBe("ada@exemple.test");
    expect(courriel.textContent).toBe(`${fr["contact.email"]} ada@exemple.test`);
    expect(courriel.hasAttribute("aria-label")).toBe(false);
  });

  it("le nom accessible dit le canal une seule fois quand libelle et valeur sont identiques", () => {
    monter(createElement(Coordonnees, { infos: mixte }));
    const github = liens()[1]!;
    expect(github.textContent).toBe(fr["contact.github"]);
    expect(github.textContent).toBe("GitHub");
    expect(github.hasAttribute("aria-label")).toBe(false);
    // Jamais deux liens de meme nom (2.4.4).
    expect(new Set(liens().map((a) => a.textContent)).size).toBe(liens().length);
  });

  it("resout les libelles dans la langue active", () => {
    monter(createElement(Coordonnees, { infos: mixte }), "de");
    expect(liens()[0]!.textContent).toContain(de["contact.email"]);
    expect(liens()[0]!.textContent).not.toContain(fr["contact.email"]);
  });

  it("les trois cles neuves existent, non vides, dans les trois dictionnaires", () => {
    for (const d of [fr, en, de]) {
      for (const k of ["contact.phone", "contact.linkedin", "contact.github"]) {
        expect(d[k], k).toBeTruthy();
      }
    }
  });
});

/** Chaque regle de la feuille dont un selecteur nomme une classe du volet. */
function reglesDuVolet(): Array<{ entete: string; corps: string }> {
  const regles: Array<{ entete: string; corps: string }> = [];
  for (const m of cssNu.matchAll(/([^{}]*\.coordonnee[^{}]*)\{/g)) {
    regles.push({
      entete: m[1]!.trim(),
      corps: corpsDepuis(cssNu, m.index! + m[0].length - 1),
    });
  }
  return regles;
}

/** Les declarations d'un corps : nom ENTIER en minuscules, valeur rognee. */
function declarations(corps: string): Array<{ prop: string; val: string }> {
  return corps
    .split(";")
    .map((d) => /^\s*(-?[A-Za-z][A-Za-z0-9-]*)\s*:\s*([\s\S]*?)\s*$/.exec(d))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ prop: m[1]!.toLowerCase(), val: m[2]! }));
}

/** Le corps de la regle dont l'en-tete est EXACTEMENT ce selecteur. */
function regle(entete: string): string {
  const trouvees = reglesDuVolet().filter((r) => r.entete === entete);
  expect(trouvees, `regle ${entete}`).toHaveLength(1);
  return trouvees[0]!.corps;
}

const MOUVEMENT =
  /^(?:-(?:webkit|moz|ms|o)-)?(?:transition|animation|transform|translate|rotate|scale|skew|scroll-behavior|offset|zoom)(?:-[a-z-]+)?$/;
const IMAGE = /^(?:background-image|border-image(?:-source)?|mask-image|list-style-image)$/;

/** Le jeton de palette qu'une variable CSS designe, lu dans les palettes. */
const JETON: Record<string, "texteSecondaire" | "textePrincipal" | "accent"> = {
  "var(--texte-secondaire)": "texteSecondaire",
  "var(--texte)": "textePrincipal",
  "var(--accent)": "accent",
};

describe("la feuille du volet des coordonnees", () => {
  it("chaque classe du DOM rendu a sa regle de base, et aucune regle du volet ne vise une classe non rendue", () => {
    const toutes = fiche({
      email: "a@exemple.test", phone: "+33 6 12",
      linkedinUrl: "https://linkedin.test/in/a", githubUrl: "https://github.test/a",
    });
    const rendues = new Set<string>();
    for (const infos of [mixte, toutes]) {
      monter(createElement(Coordonnees, { infos }));
      for (const el of document.querySelectorAll("[class]")) {
        el.classList.forEach((c) => rendues.add(c));
      }
      act(() => racine!.unmount());
      racine = null;
    }
    expect(rendues.size).toBeGreaterThan(0);
    const entetes = reglesDuVolet().map((r) => r.entete);
    for (const c of rendues) expect(entetes, c).toContain(`.${c}`);
    for (const e of entetes) {
      const nom = /\.(coordonnee[\w-]*)/.exec(e)![1]!;
      expect(rendues.has(nom), `${e} vise une classe jamais rendue`).toBe(true);
    }
  });

  it("la cible d un canal est un bloc d au moins 24 x 24 px : le display rend les tailles operantes", () => {
    const corps = regle(".coordonnee-lien");
    expect(["block", "inline-block", "flex", "inline-flex", "grid"]).toContain(valeur(corps, "display"));
    expect(px(valeur(corps, "min-block-size"))).toBeGreaterThanOrEqual(24);
    expect(px(valeur(corps, "min-inline-size"))).toBeGreaterThanOrEqual(24);
  });

  it("le lien reste souligne : la couleur n est pas le seul porteur", () => {
    expect(valeur(regle(".coordonnee-lien"), "text-decoration")).toContain("underline");
  });

  it("aucune regle du volet ne porte de mouvement ni de degrade, quel que soit son selecteur", () => {
    const regles = reglesDuVolet();
    expect(regles.length).toBeGreaterThanOrEqual(5);
    for (const { entete, corps } of regles) {
      for (const { prop, val } of declarations(corps)) {
        expect(prop, `${entete} : ${prop}`).not.toMatch(MOUVEMENT);
        expect(prop, `${entete} : ${prop}`).not.toMatch(IMAGE);
        expect(val, `${entete} : ${prop}`).not.toMatch(/gradient|var\(--degrade/);
        if (prop === "will-change") expect(val).not.toMatch(/transform|translate|rotate|scale|offset/);
      }
    }
  });

  it("le lien herite la couleur du texte, le libelle prend le texte secondaire", () => {
    expect(valeur(regle(".coordonnee-lien"), "color")).toBe("inherit");
    expect(valeur(regle(".coordonnee-libelle"), "color")).toBe("var(--texte-secondaire)");
  });

  for (const [nom, p] of [["clair", PALETTE_CLAIRE], ["sombre", PALETTE_SOMBRE]] as const) {
    it(`${nom} : le libelle atteint 4,5:1 sur le fond ET sur la surface, calcule depuis son jeton`, () => {
      const jeton = JETON[valeur(regle(".coordonnee-libelle"), "color")];
      expect(jeton, "la couleur du libelle n est pas un jeton connu").toBeDefined();
      for (const dessous of [p.fond, p.surface]) {
        expect(ratioContraste(p[jeton!], dessous)).toBeGreaterThanOrEqual(4.5);
      }
    });

    it(`${nom} : l anneau de focus est plein, d au moins 2 px, et atteint 3:1 sur le fond ET sur la surface`, () => {
      const corps = regle(".coordonnee-lien:focus-visible");
      const outline = valeur(corps, "outline");
      const m = /^(\d+(?:\.\d+)?)px\s+(solid|dashed|double)\s+(var\(--[a-z-]+\))$/.exec(outline);
      expect(m, `outline illisible : ${outline}`).not.toBeNull();
      expect(Number(m![1])).toBeGreaterThanOrEqual(2);
      const jeton = JETON[m![3]!];
      expect(jeton, "la couleur de l anneau n est pas un jeton connu").toBeDefined();
      for (const dessous of [p.fond, p.surface]) {
        expect(ratioContraste(p[jeton!], dessous)).toBeGreaterThanOrEqual(3);
      }
    });
  }
});
