// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import type { PersonalInfoDto } from "@portfolio/shared-types";
import { Coordonnees } from "@/components/portfolio/coordonnees";
import { I18nProvider } from "../i18n/i18n-context";
import { bloc, lire, px, valeur, cssNu } from "./feuille-test";

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
      fr["contact.email"] + "ada@exemple.test",
      fr["contact.github"] + "GitHub",
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
    expect(liens().map((a) => a.querySelector(".coordonnee-libelle")!.textContent)).toEqual([
      fr["contact.email"], fr["contact.phone"], fr["contact.linkedin"], fr["contact.github"],
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

  it("le nom accessible de chaque lien contient son libelle ET sa valeur", () => {
    monter(createElement(Coordonnees, { infos: mixte }));
    const attendus = [
      [fr["contact.email"], "ada@exemple.test"],
      [fr["contact.github"], "GitHub"],
    ];
    liens().forEach((a, i) => {
      const nom = a.textContent!;
      expect(nom).toContain(attendus[i]![0]);
      expect(nom).toContain(attendus[i]![1]);
      expect(a.hasAttribute("aria-label")).toBe(false);
    });
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

describe("la feuille du volet des coordonnees", () => {
  it("chaque classe posee par le composant est declaree dans la feuille", () => {
    const src = lire("components/portfolio/coordonnees.tsx");
    const classes = [...src.matchAll(/className="([^"]+)"/g)].flatMap((m) => m[1]!.split(/\s+/));
    expect(classes.length).toBeGreaterThan(0);
    for (const c of classes) expect(cssNu, c).toMatch(new RegExp(`\\.${c}\\s*[{,:]`));
  });

  it("la cible d un canal couvre au moins 24 x 24 px", () => {
    const corps = bloc(/\.coordonnee-lien\s*\{/);
    expect(px(valeur(corps, "min-block-size"))).toBeGreaterThanOrEqual(24);
    expect(px(valeur(corps, "min-inline-size"))).toBeGreaterThanOrEqual(24);
  });

  it("le lien reste souligne : la couleur n est pas le seul porteur", () => {
    expect(valeur(bloc(/\.coordonnee-lien\s*\{/), "text-decoration")).toContain("underline");
  });

  it("aucun mouvement, aucun degrade dans les regles du volet", () => {
    for (const re of [/\.coordonnees-titre\s*\{/, /\.coordonnees-liste\s*\{/, /\.coordonnee-lien\s*\{/,
      /\.coordonnee-lien:focus-visible\s*\{/, /\.coordonnee-libelle\s*\{/, /\.coordonnee-valeur\s*\{/]) {
      expect(bloc(re), String(re)).not.toMatch(/transform|transition|animation|gradient/);
    }
  });
});
