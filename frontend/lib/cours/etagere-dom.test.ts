// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { CoursPublicDto, TechnologyFamilyDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { FournisseurSectionActive, useSurcoucheOuverte } from "@/components/parcours/parcours-pagine";
import { CoursSection } from "@/components/portfolio/cours-section";
import { cuirDe } from "./etagere";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const FournisseurSection = FournisseurSectionActive as ComponentType<{ initial: string | null }>;
const langages: TechnologyFamilyDto = { id: "f1", name: "Langages", sortOrder: 0 };

function cours(id: string, extra: Partial<CoursPublicDto> = {}): CoursPublicDto {
  return {
    id,
    titre: "Java, des bases aux objets",
    titreCourt: null,
    description: "Ce cours reprend Java depuis zero.",
    niveau: "debutant",
    pages: 84,
    taille: 2516582,
    updatedAt: "2026-10-01T00:00:00.000Z",
    sortOrder: 0,
    technology: { id: "t-java", label: "Java", logoPath: null, logoSlug: null, sortOrder: 0, showInCv: true, familyId: "f1", family: langages },
    ...extra,
  };
}

function Sonde() {
  return createElement("i", { "data-surcouche": String(useSurcoucheOuverte()) });
}

let racine: Root;
let hote: HTMLElement;
function monter(liste: CoursPublicDto[]) {
  act(() =>
    racine.render(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(FournisseurSection, { initial: null }, createElement(Sonde), createElement(CoursSection, { cours: liste })),
      ),
    ),
  );
}
beforeEach(() => {
  hote = document.createElement("div");
  document.body.appendChild(hote);
  racine = createRoot(hote);
});
afterEach(() => {
  act(() => racine.unmount());
  hote.remove();
});

const livre = () => hote.querySelector<HTMLButtonElement>("button.livre-cours")!;
const dialogue = () => hote.querySelector("dialog.livre-ouvert");
const surcouche = () => hote.querySelector("[data-surcouche]")!.getAttribute("data-surcouche");

describe("l etagere des cours", () => {
  it("une planche par famille, nommee par une plaquette", () => {
    monter([cours("a"), cours("b", { technology: { ...cours("b").technology, id: "t-x", family: null, familyId: null } })]);
    expect([...hote.querySelectorAll(".planche-cours h3")].map((h) => h.textContent)).toEqual(["Langages", "Autres"]);
  });

  it("chaque livre est un bouton nomme par son titre complet et sa technologie, relie de son cuir", () => {
    monter([cours("a", { titreCourt: "Java" })]);
    const l = livre();
    expect(l.getAttribute("aria-label")).toBe("Java, des bases aux objets, cours de Java");
    expect(l.textContent).toBe("Java");
    expect(l.style.getPropertyValue("--cuir")).toBe(cuirDe("t-java").fond);
  });

  it("sans titre court, la tranche porte le titre", () => {
    monter([cours("a")]);
    expect(livre().textContent).toBe("Java, des bases aux objets");
  });

  it("ne rend rien sans cours", () => {
    monter([]);
    expect(hote.querySelector(".etagere")).toBeNull();
  });
});

describe("le livre ouvert", () => {
  it("s ouvre au clic avec ses deux pages et le lien de telechargement", () => {
    monter([cours("a")]);
    act(() => livre().click());
    const d = dialogue();
    expect(d, "aucun livre ouvert").not.toBeNull();
    const texte = d!.textContent ?? "";
    for (const attendu of ["Langages", "Java, des bases aux objets", "Java", "Ce cours reprend", "Débutant", "84", "2,4 Mo"]) {
      expect(texte, attendu).toContain(attendu);
    }
    const lien = d!.querySelector<HTMLAnchorElement>('a[href$="/api/cours/a/telecharger"]');
    expect(lien, "lien de telechargement introuvable").not.toBeNull();
    expect(lien!.hasAttribute("download")).toBe(true);
    expect(lien!.textContent).toBe("Télécharger le cours (PDF)");
    expect(surcouche()).toBe("true");
  });

  it("se ferme par la croix, par Echap et par un clic hors du livre", () => {
    monter([cours("a")]);
    act(() => livre().click());
    act(() => dialogue()!.querySelector<HTMLButtonElement>('button[aria-label="Fermer le livre"]')!.click());
    expect(dialogue()).toBeNull();
    expect(surcouche()).toBe("false");
    act(() => livre().click());
    act(() => void dialogue()!.dispatchEvent(new Event("cancel", { cancelable: true })));
    expect(dialogue()).toBeNull();
    act(() => livre().click());
    act(() => dialogue()!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(dialogue()).toBeNull();
  });
});

describe("les bords uses de l etagere", () => {
  const aSonBord = (el: Element | null) => el?.querySelector(":scope > svg.bord-imparfait") ?? null;

  it("plaquettes et dos des livres ont un bord imparfait", () => {
    monter([cours("a")]);
    expect(aSonBord(hote.querySelector(".plaquette"))).not.toBeNull();
    expect(aSonBord(livre())).not.toBeNull();
  });

  it("la couverture, les deux pages et le bouton du livre ouvert aussi", () => {
    monter([cours("a")]);
    act(() => livre().click());
    const d = dialogue()!;
    expect(aSonBord(d.querySelector(".livre-reliure-ouverte"))).not.toBeNull();
    for (const page of d.querySelectorAll(".livre-page")) expect(aSonBord(page)).not.toBeNull();
    expect(aSonBord(d.querySelector(".livre-telecharger"))).not.toBeNull();
    // L'icone de telechargement, decorative : le texte dit l'action.
    const icone = d.querySelector(".livre-telecharger svg.livre-telecharger-icone");
    expect(icone).not.toBeNull();
    expect(icone!.getAttribute("aria-hidden")).toBe("true");
  });
});
