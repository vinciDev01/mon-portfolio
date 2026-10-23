// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import type { PersonalInfoDto } from "@portfolio/shared-types";
import { Coordonnees } from "@/components/portfolio/coordonnees";
import { FormulaireContact } from "@/components/portfolio/formulaire-contact";
import { ContactSection } from "@/components/portfolio/contact-section";
import { I18nProvider } from "../i18n/i18n-context";
import { corpsDepuis, cssNu, declareeA, evaluer, lire, px, valeur } from "./feuille-test";
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
    /* Les deux chaines sont celles que le volet rend VRAIMENT quand un canal
       existe : le libelle du premier canal, et son titre propre. Nommer ici
       `contact.headline`, que le volet n emprunte plus, rendrait l assertion
       vide par construction et verte quoi qu on fasse. */
    expect(document.body.textContent).not.toContain(fr["contact.email"]);
    expect(document.body.textContent).not.toContain(fr["contact.directTitle"]);
  });

  it("rend le titre et la liste quand au moins un canal est exploitable", () => {
    monter(createElement(Coordonnees, { infos: mixte }));
    expect(document.querySelector("h3")!.textContent).toBe(fr["contact.directTitle"]);
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
/** Les jetons de shadcn, et les couleurs ecrites hors palette. */
const SHADCN =
  /var\(--(?:background|foreground|muted|border|input|ring|card|popover|primary|secondary|destructive)[\w-]*\)/;
const LITTERALE = /#[0-9a-fA-F]{3}|rgba?\(|hsla?\(|\b(?:green|red|lime|crimson|tomato)\b/;
/** Les classes de Tailwind et de shadcn que plus aucun noeud ne doit porter. */
const CLASSE_HORS_PALETTE = /green|red|muted-foreground|border-border|bg-background/;

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

/* -----------------------------------------------------------------------
   Le formulaire de contact : son etat et ses annonces (spec 3.2, 4 et 5).
   ----------------------------------------------------------------------- */

/** Les cinq champs, et de quoi remplir chacun. */
const SAISIE: Record<string, string> = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@exemple.test",
  subject: "Une machine analytique",
  message: "Bonjour, j aimerais parler de la machine analytique.",
};

/**
 * Ecrit dans un champ controle par React. Le passage par le descripteur du
 * PROTOTYPE est indispensable : React remplace le `value` de chaque noeud par
 * un accesseur qui tient son propre suivi, et une affectation directe
 * mettrait ce suivi a jour, donc React croirait la valeur inchangee et
 * n'appellerait jamais le gestionnaire.
 */
function ecrire(nom: string, v: string) {
  const champ = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `[name="${nom}"]`,
  );
  expect(champ, `champ ${nom} absent`).not.toBeNull();
  const proto =
    champ!.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const poseur = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
  act(() => {
    poseur.call(champ!, v);
    champ!.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

type Pendante = {
  resoudre: (r: { ok: boolean }) => void;
  rejeter: (e: Error) => void;
};

/**
 * Un `fetch` sous controle : chaque appel reste PENDANT jusqu'a ce que le test
 * decide comment il se termine. Sans cela l'etat « envoi en cours » ne serait
 * jamais observable, et le garde du double envoi n'aurait rien a attraper.
 */
function fetchSousControle() {
  const appels: Array<{ url: string; corps: Record<string, string> }> = [];
  const pendantes: Pendante[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = ((url: unknown, init: { body?: unknown }) => {
    appels.push({
      url: String(url),
      corps: JSON.parse(String(init?.body ?? "{}")) as Record<string, string>,
    });
    return new Promise<{ ok: boolean }>((resoudre, rejeter) =>
      pendantes.push({ resoudre, rejeter }),
    );
  }) as unknown as typeof fetch;
  return {
    appels,
    restaurer: () => {
      globalThis.fetch = original;
    },
    /** Termine le dernier appel par une reponse HTTP. */
    repondre: async (ok: boolean) => {
      const p = pendantes.at(-1)!;
      await act(async () => {
        p.resoudre({ ok });
      });
    },
    /** Termine le dernier appel par un rejet reseau : l autre chemin d echec. */
    rompre: async () => {
      const p = pendantes.at(-1)!;
      await act(async () => {
        p.rejeter(new Error("reseau coupe"));
      });
    },
  };
}

const formulaire = () => document.querySelector("form")!;
/**
 * La region d etat DU FORMULAIRE. Ancree sur sa classe, et non sur le premier
 * `[aria-live]` du document : la tache 5 montera la section entiere, qui peut
 * en porter d autres, et `querySelector` rendrait alors le mauvais noeud. Son
 * absence est NOMMEE, sans quoi chaque garde qui la lit tomberait sur un `null`
 * illisible au lieu de dire ce qui manque.
 */
const region = () => {
  const toutes = document.querySelectorAll(".formulaire-etat[aria-live]");
  expect(
    toutes.length,
    "la region aria-live du formulaire : il en faut une, et une seule",
  ).toBe(1);
  return toutes[0]!;
};
const bouton = () => document.querySelector<HTMLButtonElement>("button[type=submit]")!;

/**
 * Remplit les cinq champs puis soumet le formulaire, et constate que la
 * soumission NATIVE a ete annulee. Sans ce constat, un `preventDefault`
 * manquant passe inapercu : jsdom ne navigue pas, mais un navigateur
 * rechargerait la page, le formulaire ne survivrait pas a l envoi et la region
 * vivante n annoncerait jamais rien. Les defauts 1 et 2 du diagnostic
 * reviendraient donc par la porte du chemin natif.
 */
function remplirEtSoumettre() {
  for (const [nom, v] of Object.entries(SAISIE)) ecrire(nom, v);
  const evenement = new Event("submit", { bubbles: true, cancelable: true });
  act(() => {
    formulaire().dispatchEvent(evenement);
  });
  expect(
    evenement.defaultPrevented,
    "la soumission native n est pas annulee : la page se rechargerait",
  ).toBe(true);
}

describe("le formulaire de contact (spec sections 3.2, 4 et 5)", () => {
  let faux: ReturnType<typeof fetchSousControle>;

  beforeEach(() => {
    faux = fetchSousControle();
  });

  afterEach(() => {
    faux.restaurer();
  });

  it("envoie les cinq champs au point d envoi attendu", async () => {
    monter(createElement(FormulaireContact));
    remplirEtSoumettre();
    expect(faux.appels).toHaveLength(1);
    expect(faux.appels[0]!.url).toMatch(/\/api\/contact-messages$/);
    // La fixture porte bien les cinq valeurs : sans elles, les gardes
    // suivantes exerceraient un envoi vide et ne prouveraient rien.
    expect(faux.appels[0]!.corps).toEqual(SAISIE);
    await faux.repondre(true);
  });

  // Defaut 1 du diagnostic : le succes remplacait tout le formulaire.
  it("le formulaire SURVIT a un envoi reussi, et le message parait AU-DESSUS de lui", async () => {
    monter(createElement(FormulaireContact));
    remplirEtSoumettre();
    await faux.repondre(true);

    for (const nom of Object.keys(SAISIE)) {
      expect(document.querySelector(`[name="${nom}"]`), `${nom} a disparu`).not.toBeNull();
    }
    expect(bouton(), "le bouton d envoi a disparu sous le focus").not.toBeNull();
    // Et il est pret pour un second message : la saisie est rendue, non figee.
    for (const nom of Object.keys(SAISIE)) {
      expect(
        document.querySelector<HTMLInputElement>(`[name="${nom}"]`)!.value,
        `${nom} garde son ancienne valeur`,
      ).toBe("");
    }
    expect(region().textContent).toContain(fr["contact.success"]!);
    expect(region().textContent).toContain(fr["contact.successDetail"]!);
    // Au-dessus, et pas seulement present : la region PRECEDE le formulaire.
    expect(
      region().compareDocumentPosition(formulaire()) & Node.DOCUMENT_POSITION_FOLLOWING,
      "le message ne precede pas le formulaire",
    ).toBeTruthy();
  });

  // Defaut 2 du diagnostic : aucun changement d etat n etait annonce.
  it("annonce l etat dans une region aria-live polie qui recoit le focus", async () => {
    monter(createElement(FormulaireContact));
    remplirEtSoumettre();
    await faux.repondre(true);

    expect(region().getAttribute("aria-live")).toBe("polite");
    // Le message est lu d un bloc, et non par le seul morceau qui a change.
    expect(region().getAttribute("aria-atomic")).toBe("true");
    expect(document.activeElement, "le focus n est pas porte sur la region").toBe(region());
    // Une region focalisable mais hors tabulation : on ne l insere pas dans le
    // parcours du clavier.
    expect(region().getAttribute("tabindex")).toBe("-1");
  });

  // Point de vigilance A : l echec HTTP et l echec RESEAU sont deux chemins.
  it.each([
    ["un code HTTP d echec", (f: ReturnType<typeof fetchSousControle>) => f.repondre(false)],
    ["un rejet reseau", (f: ReturnType<typeof fetchSousControle>) => f.rompre()],
  ])("donne l etat d erreur ET le recours pour %s", async (_etiquette, terminer) => {
    monter(createElement(FormulaireContact));
    remplirEtSoumettre();
    await terminer(faux);

    expect(region().textContent).toContain(fr["contact.error"]!);
    // Sans le recours, un envoi qui echoue laisse le visiteur sans rien.
    expect(region().textContent).toContain(fr["contact.errorFallback"]!);
    expect(region().textContent).not.toContain(fr["contact.success"]!);
    expect(document.activeElement).toBe(region());
    // La saisie n est pas perdue : on peut reessayer sans tout retaper.
    expect(document.querySelector<HTMLInputElement>('[name="email"]')!.value).toBe(
      SAISIE.email,
    );
  });

  // Le geste principal : le clic. Les autres gardes soumettent le <form> pour
  // exercer la LOGIQUE du double envoi ; celle-ci exerce le BOUTON, et c est la
  // seule qui voie son rattachement au formulaire.
  it("un clic sur le bouton d envoi produit une requete, et une seule", () => {
    monter(createElement(FormulaireContact));
    for (const [nom, v] of Object.entries(SAISIE)) ecrire(nom, v);
    act(() => {
      bouton().click();
    });
    expect(faux.appels, "le bouton clique ne soumet rien").toHaveLength(1);
    expect(faux.appels[0]!.corps).toEqual(SAISIE);
  });

  // Point de vigilance B : un double envoi rapide ne fait qu une requete.
  it("deux soumissions rapides ne produisent qu une requete", () => {
    monter(createElement(FormulaireContact));
    for (const [nom, v] of Object.entries(SAISIE)) ecrire(nom, v);
    // Soumis DEUX fois sans passer par le bouton : la touche Entree dans un
    // champ soumet le formulaire sans toucher au bouton desactive, donc le
    // `disabled` ne protege rien. Seul un drapeau dans la logique le fait.
    const deux = [0, 1].map(() => new Event("submit", { bubbles: true, cancelable: true }));
    act(() => {
      const f = formulaire();
      for (const e of deux) f.dispatchEvent(e);
    });
    expect(faux.appels).toHaveLength(1);
    // La SECONDE soumission est annulee elle aussi : si `preventDefault` venait
    // apres la garde, elle repartirait en navigation native.
    for (const [i, e] of deux.entries()) {
      expect(e.defaultPrevented, `soumission ${i + 1} non annulee`).toBe(true);
    }
  });

  // Defaut 3 du diagnostic : aucune saisie automatique n etait possible.
  it("porte les trois attributs d auto-remplissage", () => {
    monter(createElement(FormulaireContact));
    const attendus: Record<string, string> = {
      firstName: "given-name",
      lastName: "family-name",
      email: "email",
    };
    for (const [nom, valeurAttendue] of Object.entries(attendus)) {
      const champ = document.querySelector(`[name="${nom}"]`)!;
      expect(champ.getAttribute("autocomplete"), nom).toBe(valeurAttendue);
    }
  });

  // Spec section 5 : le bouton ne devient pas une roue muette.
  it("le bouton d envoi reste identifiable et annonce son etat pendant l envoi", () => {
    monter(createElement(FormulaireContact));
    expect(bouton().textContent!.trim()).toBe(fr["contact.send"]!);
    remplirEtSoumettre();
    // Pendant l envoi : un nom accessible NON VIDE, et qui a change.
    expect(bouton().textContent!.trim()).toBe(fr["contact.sending"]!);
    expect(bouton().textContent!.trim().length).toBeGreaterThan(0);
    expect(bouton().getAttribute("aria-busy")).toBe("true");
    /* Et il reste FOCALISABLE : `aria-disabled` et non `disabled`. Un bouton
       qui devient `disabled` sous le doigt perd le focus au profit du `body`
       dans les navigateurs, donc la tabulation repart du haut de la page.
       MESURE : jsdom, lui, garde le focus sur un bouton desactive, donc ce
       choix ne s observe ici que par ses attributs. */
    expect(bouton().getAttribute("aria-disabled")).toBe("true");
    expect(bouton().disabled, "le bouton desactive perdrait son focus").toBe(false);
  });

  /* Le corollaire : un bouton focalisable est aussi un bouton cliquable, donc
     la protection du double envoi doit tenir sans le `disabled`. Elle tient
     par le drapeau de la logique, et c est ce que cette garde exerce. */
  it("un second clic pendant l envoi ne produit pas de seconde requete", () => {
    monter(createElement(FormulaireContact));
    for (const [nom, v] of Object.entries(SAISIE)) ecrire(nom, v);
    act(() => {
      bouton().click();
    });
    expect(faux.appels, "le premier clic ne soumet rien").toHaveLength(1);
    act(() => {
      bouton().click();
    });
    expect(faux.appels, "le second clic repart en requete").toHaveLength(1);
  });

  // Defaut 4 du diagnostic, et critere 1.4.1.
  it("marque les champs obligatoires autrement que par la couleur", () => {
    monter(createElement(FormulaireContact));
    const noms = Object.keys(SAISIE);
    for (const nom of noms) {
      const champ = document.querySelector<HTMLInputElement>(`[name="${nom}"]`)!;
      expect(champ.required, `${nom} n est pas obligatoire`).toBe(true);
      const etiquette = document.querySelector<HTMLLabelElement>(
        `label[for="${champ.id}"]`,
      );
      expect(etiquette, `${nom} sans etiquette liee`).not.toBeNull();
      const marque = etiquette!.querySelector(".formulaire-requis");
      expect(marque, `${nom} sans marque d obligation`).not.toBeNull();
      // La marque est un CARACTERE : elle survit a la perte de la couleur.
      expect(marque!.textContent!.trim().length, `${nom} : marque vide`).toBeGreaterThan(0);
    }
    expect(noms).toHaveLength(5);
  });

  /* Les cinq etiquettes portent un `*` que rien n expliquait. La legende le
     dit UNE fois, au-dessus des champs : repetee dans les cinq etiquettes elle
     alourdirait chaque nom accessible sans rien apprendre de plus. */
  it("explique l asterisque UNE fois, au-dessus des champs, et jamais dans les etiquettes", () => {
    monter(createElement(FormulaireContact));
    const legendes = document.querySelectorAll(".formulaire-legende");
    expect(
      legendes.length,
      "la legende de l asterisque : il en faut une, et une seule",
    ).toBe(1);
    const legende = legendes[0]!;
    expect(legende.textContent!.trim()).toBe(fr["contact.requiredLegend"]!);
    // Au-dessus, et pas seulement presente : elle PRECEDE le premier champ.
    const premier = document.querySelector('[name="firstName"]')!;
    expect(
      legende.compareDocumentPosition(premier) & Node.DOCUMENT_POSITION_FOLLOWING,
      "la legende ne precede pas les champs",
    ).toBeTruthy();
    const etiquettes = [...document.querySelectorAll("label")];
    expect(etiquettes).toHaveLength(5);
    for (const e of etiquettes) {
      expect(
        e.textContent,
        "une etiquette repete la legende",
      ).not.toContain(fr["contact.requiredLegend"]!);
    }
  });

  // Spec section 4 : la forme et le mot, jamais la couleur.
  it("les glyphes d etat sont dessines, muets, et distinguent le succes de l echec", async () => {
    const dessins = async (terminer: () => Promise<void>) => {
      monter(createElement(FormulaireContact));
      remplirEtSoumettre();
      await terminer();
      const svg = region().querySelector("svg")!;
      expect(svg, "aucun glyphe dessine").not.toBeNull();
      expect(svg.getAttribute("aria-hidden"), "le glyphe n est pas muet").toBe("true");
      // Teinte par l encre : en couleurs forcees il suit le navigateur.
      expect(svg.getAttribute("stroke")).toBe("currentColor");
      /* Le refus de `forced-color-adjust` ne se constate PAS ici :
         c est une propriete CSS et jamais un attribut, donc l asserter sur le
         noeud ne pourrait pas echouer. Le balayage de la feuille s en charge. */
      const traces = [...svg.querySelectorAll("path")].map((p) => p.getAttribute("d"));
      expect(traces.length).toBeGreaterThan(0);
      for (const d of traces) expect(d).toBeTruthy();
      const bloc = region().querySelector(".formulaire-etat-bloc")!;
      const classes = [...bloc.classList].sort().join(" ");
      act(() => racine!.unmount());
      racine = null;
      return { traces: traces.join("|"), classes };
    };
    const succes = await dessins(() => faux.repondre(true));
    const echec = await dessins(() => faux.repondre(false));
    // Deux dessins DIFFERENTS : la forme porte le sens.
    expect(succes.traces).not.toBe(echec.traces);
    // Et la MEME enveloppe : aucune couleur ne distingue les deux etats.
    expect(succes.classes).toBe(echec.classes);
  });

  it("n emploie aucune classe de couleur hors palette dans le DOM rendu", async () => {
    monter(createElement(FormulaireContact));
    remplirEtSoumettre();
    await faux.repondre(false);
    const classes = [...document.querySelectorAll("[class]")].flatMap((el) => [
      ...el.classList,
    ]);
    expect(classes.length).toBeGreaterThan(0);
    for (const c of classes) {
      expect(c, "classe hors palette").not.toMatch(CLASSE_HORS_PALETTE);
    }
  });

  it("les deux cles neuves existent, non vides, en parite dans les trois dictionnaires", () => {
    for (const d of [fr, en, de]) {
      for (const k of ["contact.errorFallback", "contact.directTitle"]) {
        expect(d[k], k).toBeTruthy();
      }
      // Le titre du volet n est PAS l accroche de la section : sans quoi la
      // meme phrase paraitrait deux fois.
      expect(d["contact.directTitle"]).not.toBe(d["contact.headline"]);
    }
  });
});

/** Chaque regle de la feuille dont un selecteur nomme une classe du formulaire. */
function reglesDuFormulaire(): Array<{ entete: string; corps: string }> {
  const regles: Array<{ entete: string; corps: string }> = [];
  for (const m of cssNu.matchAll(/([^{}]*\.formulaire[^{}]*)\{/g)) {
    regles.push({
      entete: m[1]!.trim(),
      corps: corpsDepuis(cssNu, m.index! + m[0].length - 1),
    });
  }
  return regles;
}

/** Le corps de la regle du formulaire dont l en-tete est EXACTEMENT ce selecteur. */
function regleF(entete: string): string {
  const trouvees = reglesDuFormulaire().filter((r) => r.entete === entete);
  expect(trouvees, `regle ${entete}`).toHaveLength(1);
  return trouvees[0]!.corps;
}

/* Les trois reglages typographiques de la feuille, lus et non recopies. Le
   corps et l interligne sont reglables par le visiteur : `evaluer` resout leur
   repli, qui est la valeur par defaut. */
const SANS_VAR = { largeurPct: 0, ch: 0, vars: {} as Record<string, string | number> };
const INTERLIGNE = evaluer(declareeA("--interligne", 1024)!, SANS_VAR);
const CORPS = evaluer(declareeA("--corps", 1024)!, SANS_VAR);
const ESPACE_1 = evaluer(declareeA("--espace-1", 1024)!, SANS_VAR);
/** Hauteur d une ligne de texte, telle que la feuille la declare. */
const LIGNE = INTERLIGNE * CORPS;

/**
 * Une taille declaree, rendue en pixels ET en lignes. L unite `lh` vaut une
 * ligne, donc elle suit le corps et l interligne que le visiteur regle : une
 * hauteur dite en lignes se MESURE, elle ne s epingle pas en pixels.
 */
function taille(decl: string): { pixels: number; lignes: number } {
  const litteral = px(decl);
  if (!Number.isNaN(litteral)) return { pixels: litteral, lignes: litteral / LIGNE };
  const m = /(\d+(?:\.\d+)?)lh/.exec(decl);
  expect(m, `taille illisible : ${decl}`).not.toBeNull();
  const lignes = Number(m![1]);
  // Le reste de l expression, les lignes mises a zero : padding et bordure.
  const appoint = evaluer(decl.replace(/(\d+(?:\.\d+)?)lh/, "0px"), {
    ...SANS_VAR,
    vars: { "--espace-1": ESPACE_1 },
  });
  return { pixels: lignes * LIGNE + appoint, lignes };
}

/** Le jeton de palette qu une variable CSS designe, cote formulaire. */
const JETON_FORMULAIRE: Record<string, keyof typeof PALETTE_CLAIRE> = {
  "var(--texte)": "textePrincipal",
  "var(--texte-secondaire)": "texteSecondaire",
  "var(--accent)": "accent",
  "var(--bordure-signifiante)": "bordureSignifiante",
  "var(--fond)": "fond",
  "var(--surface)": "surface",
};

describe("la feuille du formulaire de contact", () => {
  let faux: ReturnType<typeof fetchSousControle>;

  beforeEach(() => {
    faux = fetchSousControle();
  });
  afterEach(() => {
    faux.restaurer();
  });

  it("chaque classe du DOM rendu a sa regle de base, et aucune regle du formulaire ne vise une classe non rendue", async () => {
    const rendues = new Set<string>();
    const recolter = () => {
      for (const el of document.querySelectorAll("[class]")) {
        el.classList.forEach((c) => rendues.add(c));
      }
    };
    // Les quatre etats : au repos, en envoi, au succes, a l echec.
    monter(createElement(FormulaireContact));
    recolter();
    remplirEtSoumettre();
    recolter();
    await faux.repondre(true);
    recolter();
    act(() => racine!.unmount());
    racine = null;

    monter(createElement(FormulaireContact));
    remplirEtSoumettre();
    await faux.repondre(false);
    recolter();

    expect(rendues.size).toBeGreaterThan(0);
    const entetes = reglesDuFormulaire().map((r) => r.entete);
    for (const c of rendues) expect(entetes, c).toContain(`.${c}`);
    for (const e of entetes) {
      const nom = /\.(formulaire[\w-]*)/.exec(e)![1]!;
      expect(rendues.has(nom), `${e} vise une classe jamais rendue`).toBe(true);
    }
  });

  // Defaut 5 du diagnostic, et point de vigilance C.
  it("la zone de message grandit a la saisie mais sa hauteur est bornee, et c est la zone qui defile", () => {
    const corps = regleF(".formulaire-zone");
    // Elle grandit : plus de `resize: none`, et la hauteur suit le contenu.
    expect(valeur(corps, "field-sizing")).toBe("content");
    expect(valeur(corps, "resize")).not.toBe("none");
    /* Bornee : la decision « le formulaire tient dans l ecran » ne se perd pas
       sous un message tres long. Bornee EN LIGNES, comme le depart : un
       litteral en pixels ne suivrait pas le corps que le visiteur regle, et a
       tres gros corps la zone defilerait des la quatrieme ligne. */
    const brut = valeur(corps, "max-block-size");
    expect(brut, "la borne haute ne suit pas le corps : elle n est pas dite en lh").toMatch(/\dlh/);
    const borne = taille(brut);
    expect(borne.pixels).toBeGreaterThan(0);
    // Au reglage par defaut, elle reste sous le palier de 400 px d origine.
    expect(borne.pixels).toBeLessThanOrEqual(400);
    // Au-dela, c est la ZONE qui defile, pas la section.
    expect(valeur(corps, "overflow-y")).toBe("auto");
    /* TROIS lignes au depart, et non cinq : la spec section 3.2 nomme ce
       chiffre, et c est la borne BASSE qui le tient. La ou `field-sizing`
       s applique, l attribut `rows` ne gouverne plus la hauteur, donc une borne
       basse trop courte ferait partir la zone a deux lignes. */
    const depart = taille(valeur(corps, "min-block-size"));
    expect(depart.lignes, "la zone ne part pas a trois lignes").toBeGreaterThanOrEqual(3);
    expect(depart.lignes, "la zone part a plus de trois lignes").toBeLessThan(4);
    /* Et elle grandit AVANT de defiler, d un facteur qui ne depend PAS du
       corps : au moins deux fois le depart, et jamais plus de dix lignes,
       sinon la section entiere cesserait de tenir dans l ecran. */
    expect(borne.pixels).toBeGreaterThan(depart.pixels);
    expect(borne.lignes, "la zone ne grandit pas assez avant de defiler").toBeGreaterThanOrEqual(
      2 * depart.lignes,
    );
    expect(borne.lignes, "la zone grandit trop avant de defiler").toBeLessThanOrEqual(10);
  });

  // M1 de la revue : le chiffre de la spec se garde aussi sur le DOM, pour les
  // moteurs qui ignorent `field-sizing` et dimensionnent encore par `rows`.
  it("la zone de message part a trois lignes sur le DOM rendu", () => {
    monter(createElement(FormulaireContact));
    const zone = document.querySelector<HTMLTextAreaElement>('[name="message"]')!;
    expect(zone.tagName).toBe("TEXTAREA");
    expect(zone.rows, "la zone ne declare pas trois lignes").toBe(3);
  });

  it("les cibles du formulaire font au moins 24 x 24 px, le display rendant les tailles operantes", () => {
    for (const selecteur of [".formulaire-saisie", ".formulaire-zone", ".formulaire-envoyer"]) {
      const corps = regleF(selecteur);
      expect(
        ["block", "inline-block", "flex", "inline-flex", "grid"],
        `${selecteur} : display`,
      ).toContain(valeur(corps, "display"));
      expect(
        taille(valeur(corps, "min-block-size")).pixels, selecteur,
      ).toBeGreaterThanOrEqual(24);
      expect(
        taille(valeur(corps, "min-inline-size")).pixels, selecteur,
      ).toBeGreaterThanOrEqual(24);
    }
  });

  it("aucune regle du formulaire ne porte de mouvement, de degrade ni de couleur hors palette", () => {
    const regles = reglesDuFormulaire();
    expect(regles.length).toBeGreaterThanOrEqual(8);
    /* La sonde se verifie avant de servir : un balayage trop large bloquerait
       la palette du site, dont `--bordure` n est PAS le `--border` de shadcn. */
    expect("var(--bordure)", "la sonde confond --bordure et --border").not.toMatch(SHADCN);
    expect("var(--bordure-signifiante)").not.toMatch(SHADCN);
    expect("var(--border)", "la sonde ne voit pas le jeton de shadcn").toMatch(SHADCN);
    expect("var(--muted-foreground)").toMatch(SHADCN);
    expect("inherited", "la sonde confond `inherited` et `red`").not.toMatch(LITTERALE);
    expect("red").toMatch(LITTERALE);
    for (const { entete, corps } of regles) {
      for (const { prop, val } of declarations(corps)) {
        expect(prop, `${entete} : ${prop}`).not.toMatch(MOUVEMENT);
        expect(prop, `${entete} : ${prop}`).not.toMatch(IMAGE);
        expect(prop, `${entete} : ${prop}`).not.toBe("forced-color-adjust");
        expect(val, `${entete} : ${prop}`).not.toMatch(/gradient|var\(--degrade/);
        expect(val, `${entete} : ${prop}`).not.toMatch(SHADCN);
        expect(val, `${entete} : ${prop}`).not.toMatch(LITTERALE);
        if (prop === "will-change") expect(val).not.toMatch(/transform|translate|rotate|scale|offset/);
      }
    }
  });

  // L intention de hierarchie, epinglee a part du calcul de contraste.
  it("le bloc d etat se distingue par une bordure signifiante, la meme aux deux etats", () => {
    const corps = regleF(".formulaire-etat-bloc");
    const bordure = valeur(corps, "border");
    const m = /^(\d+(?:\.\d+)?)px\s+(solid|dashed|double)\s+(var\(--[a-z-]+\))$/.exec(bordure);
    expect(m, `bordure illisible : ${bordure}`).not.toBeNull();
    expect(Number(m![1])).toBeGreaterThanOrEqual(1);
    expect(m![3]).toBe("var(--bordure-signifiante)");
  });

  for (const [nom, p] of [["clair", PALETTE_CLAIRE], ["sombre", PALETTE_SOMBRE]] as const) {
    it(`${nom} : le texte du formulaire atteint 4,5:1, calcule depuis ses jetons`, () => {
      /* Le fond de chaque texte se LIT dans sa propre regle : une paire dont
         le dessous serait suppose mesurerait un contraste imaginaire. */
      const fondDe = (selecteur: string) => {
        const j = JETON_FORMULAIRE[valeur(regleF(selecteur), "background-color")];
        expect(j, `${selecteur} : fond hors palette`).toBeDefined();
        return j!;
      };
      const paires: Array<[string, keyof typeof PALETTE_CLAIRE]> = [
        [valeur(regleF(".formulaire-saisie"), "color"), fondDe(".formulaire-saisie")],
        [valeur(regleF(".formulaire-envoyer"), "color"), fondDe(".formulaire-envoyer")],
        [valeur(regleF(".formulaire-etat-titre"), "color"), fondDe(".formulaire-etat-bloc")],
        [valeur(regleF(".formulaire-etat-detail"), "color"), fondDe(".formulaire-etat-bloc")],
      ];
      /* L etiquette et la legende ne declarent aucun fond : elles prennent
         celui que la coquille leur donne. On ne SUPPOSE donc pas lequel, on
         exige les deux. */
      for (const dessous of ["fond", "surface"] as const) {
        paires.push([valeur(regleF(".formulaire-etiquette"), "color"), dessous]);
        paires.push([valeur(regleF(".formulaire-legende"), "color"), dessous]);
      }
      for (const [devant, dessous] of paires) {
        const jeton = JETON_FORMULAIRE[devant];
        expect(jeton, `couleur inconnue : ${devant}`).toBeDefined();
        expect(
          ratioContraste(p[jeton!], p[dessous]),
          `${devant} sur ${dessous}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    it(`${nom} : les bordures signifiantes et l anneau de focus atteignent 3:1 sur le fond ET sur la surface`, () => {
      const bords = [
        valeur(regleF(".formulaire-saisie"), "border"),
        valeur(regleF(".formulaire-etat-bloc"), "border"),
        valeur(regleF(".formulaire-saisie:focus-visible"), "outline"),
        valeur(regleF(".formulaire-envoyer:focus-visible"), "outline"),
      ];
      for (const b of bords) {
        const m = /^(\d+(?:\.\d+)?)px\s+(solid|dashed|double)\s+(var\(--[a-z-]+\))$/.exec(b);
        expect(m, `contour illisible : ${b}`).not.toBeNull();
        const jeton = JETON_FORMULAIRE[m![3]!];
        expect(jeton, `couleur de contour inconnue : ${b}`).toBeDefined();
        for (const dessous of [p.fond, p.surface]) {
          expect(ratioContraste(p[jeton!], dessous), b).toBeGreaterThanOrEqual(3);
        }
      }
      // Les anneaux font au moins 2 px, comme ceux du volet.
      for (const s of [".formulaire-saisie:focus-visible", ".formulaire-envoyer:focus-visible"]) {
        expect(Number(/^(\d+(?:\.\d+)?)px/.exec(valeur(regleF(s), "outline"))![1])).toBeGreaterThanOrEqual(2);
      }
    });
  }
});

/* -----------------------------------------------------------------------
   La coquille de la section : les deux volets, et la migration des jetons.
   ----------------------------------------------------------------------- */

/** Chaque regle de la feuille dont un selecteur nomme une classe de la section. */
function reglesDeLaSection(): Array<{ entete: string; corps: string }> {
  const regles: Array<{ entete: string; corps: string }> = [];
  for (const m of cssNu.matchAll(/([^{}]*\.contact-[^{}]*)\{/g)) {
    regles.push({
      entete: m[1]!.trim(),
      corps: corpsDepuis(cssNu, m.index! + m[0].length - 1),
    });
  }
  return regles;
}

/** Le corps de la regle de la section dont l en-tete est EXACTEMENT ce selecteur. */
function regleS(entete: string): string {
  const trouvees = reglesDeLaSection().filter((r) => r.entete === entete);
  expect(trouvees, `regle ${entete}`).toHaveLength(1);
  return trouvees[0]!.corps;
}

/**
 * Les SEULES classes utilitaires que la section s autorise. Elles vivent dans
 * la feuille generee par Tailwind et non dans `globals.css`, donc le balayage
 * des classes maison ne peut pas les y trouver : elles sont nommees ici, et
 * chacune est par ailleurs exigee sur le DOM, sans quoi cette liste servirait
 * a cacher un retrait.
 */
const UTILITAIRES = ["grid", "grid-cols-1", "md:grid-cols-2"];

const volets = () => {
  const toutes = document.querySelectorAll(".contact-volets");
  expect(toutes.length, "la grille des deux volets : il en faut une, et une seule").toBe(1);
  return toutes[0]!;
};

describe("la section contact (spec sections 2 et 3)", () => {
  let faux: ReturnType<typeof fetchSousControle>;

  beforeEach(() => {
    faux = fetchSousControle();
  });
  afterEach(() => {
    faux.restaurer();
  });

  /** Monte la section avec la fiche mixte : un canal present, un absent. */
  const section = (infos: PersonalInfoDto = mixte) =>
    monter(createElement(ContactSection, { personalInfo: infos }));

  it("rend les deux volets, les coordonnees AVANT le formulaire", () => {
    section();
    /* La fixture exerce les DEUX branches du volet : deux canaux presents
       (courriel, GitHub) et deux absents (telephone blanc, LinkedIn en http).
       Sans canal absent, le filtre ne serait jamais mis a l epreuve ici. */
    expect(document.querySelectorAll("li")).toHaveLength(2);
    const liste = document.querySelector("ul.coordonnees-liste");
    expect(liste, "le volet des coordonnees n est pas rendu").not.toBeNull();
    const formulaire = document.querySelector("form.formulaire-contact");
    expect(formulaire, "le formulaire n est pas rendu").not.toBeNull();
    // L ordre du DOCUMENT decide l ordre sur telephone, ou les volets
    // s empilent : le canal direct se trouve avant le formulaire.
    expect(
      liste!.compareDocumentPosition(formulaire!) & Node.DOCUMENT_POSITION_FOLLOWING,
      "le formulaire ne suit pas les coordonnees dans l ordre du document",
    ).toBeTruthy();
    // Et les deux sont bien DANS la grille : un volet pose a cote ne serait
    // pas dispose par elle.
    expect(volets().contains(liste!), "les coordonnees sont hors de la grille").toBe(true);
    expect(volets().contains(formulaire!), "le formulaire est hors de la grille").toBe(true);
  });

  it("empile les volets sur telephone et les met cote a cote des la tablette", () => {
    section();
    const classes = [...volets().classList];
    for (const u of UTILITAIRES) expect(classes, `classe ${u} absente`).toContain(u);
  });

  it("chaque classe maison du DOM rendu a sa regle, et aucune regle de la section ne vise une classe non rendue", async () => {
    const rendues = new Set<string>();
    const recolter = () => {
      for (const el of document.querySelectorAll("[class]")) {
        el.classList.forEach((c) => rendues.add(c));
      }
    };
    // Les trois etats visibles de la section : au repos, au succes, a l echec.
    section();
    recolter();
    remplirEtSoumettre();
    await faux.repondre(true);
    recolter();
    act(() => racine!.unmount());
    racine = null;

    section();
    remplirEtSoumettre();
    await faux.repondre(false);
    recolter();

    expect(rendues.size).toBeGreaterThan(0);
    /* Le balayage lit le DOM RENDU et non le source : une classe posee par une
       expression que le source n ecrit pas telle quelle lui echapperait. */
    for (const c of rendues) {
      if (UTILITAIRES.includes(c)) continue;
      expect(cssNu, `classe ${c} sans regle dans la feuille`).toContain(`.${c}`);
    }
    // La liste des utilitaires ne peut pas cacher un retrait : chacune y est
    // bien posee sur le DOM.
    for (const u of UTILITAIRES) expect([...rendues], `utilitaire ${u} jamais pose`).toContain(u);
    const entetes = reglesDeLaSection().map((r) => r.entete);
    expect(entetes.length).toBeGreaterThanOrEqual(4);
    for (const e of entetes) {
      const nom = /\.(contact-[\w-]*)/.exec(e)![1]!;
      expect(rendues.has(nom), `${e} vise une classe jamais rendue`).toBe(true);
    }
  });

  it("n emploie AUCUN jeton shadcn ni couleur Tailwind, ni dans la feuille ni sur le DOM rendu", async () => {
    /* Les sondes se verifient avant de servir : `--bordure` est le jeton du
       site et jamais le `--border` de shadcn, et `inherited` n est pas `red`. */
    expect("var(--bordure-signifiante)", "la sonde confond --bordure et --border").not.toMatch(SHADCN);
    expect("var(--muted-foreground)", "la sonde ne voit pas le jeton de shadcn").toMatch(SHADCN);
    expect("border-radius: 4px", "la sonde confond border-radius et red").not.toMatch(LITTERALE);
    expect("color: red").toMatch(LITTERALE);
    expect("coordonnee-libelle", "la sonde de classes confond libelle et red").not.toMatch(
      CLASSE_HORS_PALETTE,
    );
    expect("text-red-500").toMatch(CLASSE_HORS_PALETTE);

    const regles = reglesDeLaSection();
    expect(regles.length).toBeGreaterThanOrEqual(4);
    for (const { entete, corps } of regles) {
      for (const interdit of ["muted-foreground", "border-border", "bg-background", "green"]) {
        expect(corps, `${entete} : ${interdit}`).not.toContain(interdit);
      }
      for (const { prop, val } of declarations(corps)) {
        expect(val, `${entete} : ${prop}`).not.toMatch(SHADCN);
        expect(val, `${entete} : ${prop}`).not.toMatch(LITTERALE);
      }
    }

    /* Et sur le DOM rendu : une classe de Tailwind vit dans l attribut `class`
       et jamais dans `globals.css`, donc le balayage de la feuille ne pourrait
       pas la voir. L etat d echec est exerce : c est lui qui portait
       `text-red-500` dans l ancienne section. */
    section();
    remplirEtSoumettre();
    await faux.repondre(false);
    const classes = [...document.querySelectorAll("[class]")].flatMap((el) => [...el.classList]);
    expect(classes.length).toBeGreaterThan(0);
    for (const c of classes) {
      expect(c, `classe hors palette : ${c}`).not.toMatch(CLASSE_HORS_PALETTE);
    }
  });

  it("n introduit aucun mouvement et aucun degrade", () => {
    /* Faux positif ecarte : `text-transform` contient bien « transform » et ne
       doit PAS declencher le balayage du mouvement, que la section emploie sur
       des noms ENTIERS de propriete. */
    expect("text-transform", "la sonde confond text-transform et transform").not.toMatch(MOUVEMENT);
    expect("transition", "la sonde ne voit pas transition").toMatch(MOUVEMENT);
    const regles = reglesDeLaSection();
    expect(regles.length).toBeGreaterThanOrEqual(4);
    for (const { entete, corps } of regles) {
      for (const { prop, val } of declarations(corps)) {
        expect(prop, `${entete} : ${prop}`).not.toMatch(MOUVEMENT);
        expect(prop, `${entete} : ${prop}`).not.toMatch(IMAGE);
        expect(val, `${entete} : ${prop}`).not.toMatch(/gradient|var\(--degrade/);
        if (prop === "will-change") expect(val).not.toMatch(/transform|translate|rotate|scale|offset/);
      }
    }
  });

  it("l accroche de la section parait UNE fois, et le volet ne l emprunte plus", () => {
    section();
    const texte = document.body.textContent!;
    expect(texte).toContain(fr["contact.subtitle"]!);
    // Exactement une fois : le volet empruntait cette phrase pour son titre,
    // donc elle paraissait deux fois dans la section assemblee.
    expect(
      texte.split(fr["contact.headline"]!).length - 1,
      "l accroche ne parait pas exactement une fois",
    ).toBe(1);
    // Le volet porte son titre PROPRE, et les deux phrases different.
    expect(document.querySelector("h3")!.textContent).toBe(fr["contact.directTitle"]!);
    expect(fr["contact.directTitle"]).not.toBe(fr["contact.headline"]);
  });

  // L intention de hierarchie, epinglee a part du calcul de contraste.
  it("l accroche prend l encre principale et son detail l encre secondaire", () => {
    const titre = valeur(regleS(".contact-accroche-titre"), "color");
    const detail = valeur(regleS(".contact-accroche-detail"), "color");
    expect(titre).toBe("var(--texte)");
    expect(detail).toBe("var(--texte-secondaire)");
    expect(titre, "les deux niveaux se confondent").not.toBe(detail);
  });

  for (const [nom, p] of [["clair", PALETTE_CLAIRE], ["sombre", PALETTE_SOMBRE]] as const) {
    it(`${nom} : les textes de la section atteignent 4,5:1, calcules depuis leurs jetons`, () => {
      /* Aucune des deux regles ne declare de fond : la section prend celui de
         la page. On ne SUPPOSE donc pas lequel, on exige les deux. */
      for (const selecteur of [".contact-accroche-titre", ".contact-accroche-detail"]) {
        const devant = valeur(regleS(selecteur), "color");
        const jeton = JETON_FORMULAIRE[devant];
        expect(jeton, `${selecteur} : couleur inconnue ${devant}`).toBeDefined();
        for (const dessous of [p.fond, p.surface]) {
          expect(ratioContraste(p[jeton!], dessous), `${selecteur} sur ${dessous}`)
            .toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }

  it("la cle neuve de la legende existe, non vide, en parite dans les trois dictionnaires", () => {
    for (const d of [fr, en, de]) {
      expect(d["contact.requiredLegend"], "contact.requiredLegend").toBeTruthy();
      // Elle nomme bien le caractere qu elle explique.
      expect(d["contact.requiredLegend"], "la legende ne nomme pas l asterisque").toContain("*");
    }
  });

  it("la coquille recoit une DONNEE depuis le composant serveur, et jamais une fonction", () => {
    const page = lire("app/page.tsx");
    const m = /<ContactSection([^<]*?)\/>/.exec(page);
    expect(m, "ContactSection n est pas rendue dans page.tsx").not.toBeNull();
    expect(m![1], "personalInfo n est pas transmise").toContain("personalInfo={data.personalInfo}");
    // Pas de fonction passee a un composant client depuis le serveur.
    expect(m![1], "une fonction est passee a la coquille").not.toMatch(/=>|\bfunction\b/);
  });
});
