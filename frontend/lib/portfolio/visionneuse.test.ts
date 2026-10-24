// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { CertificationDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { FournisseurSectionActive, useSurcoucheOuverte } from "@/components/parcours/parcours-pagine";
import { CertificationsSection } from "@/components/portfolio/certifications-section";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const FournisseurSection = FournisseurSectionActive as ComponentType<{ initial: string | null }>;

const certif = {
  id: "a",
  name: "NSE 1",
  imagePath: "certifications/c.webp",
  organizationId: "f",
  organization: { id: "f", label: "Fortinet", logoPath: null, websiteUrl: null, sortOrder: 0 },
  description: null,
  issueDate: null,
  credentialUrl: null,
  sortOrder: 0,
} as CertificationDto;

/** Rend l'etat du drapeau de surcouche, que lit la pagination. */
function Sonde() {
  return createElement("i", { "data-surcouche": String(useSurcoucheOuverte()) });
}

let racine: Root;
let hote: HTMLElement;
beforeEach(() => {
  hote = document.createElement("div");
  document.body.appendChild(hote);
  racine = createRoot(hote);
  act(() =>
    racine.render(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(
          FournisseurSection,
          { initial: null },
          createElement(Sonde),
          createElement(CertificationsSection, { certifications: [certif] }),
        ),
      ),
    ),
  );
});
afterEach(() => {
  act(() => racine.unmount());
  hote.remove();
});

const dialogue = () => hote.querySelector("dialog.visionneuse");
const surcouche = () => hote.querySelector("[data-surcouche]")!.getAttribute("data-surcouche");
const ouvrir = () => act(() => hote.querySelector<HTMLButtonElement>("button.registre-image")!.click());

describe("l image d une certification s ouvre dans une fenetre, sans quitter la page", () => {
  it("la vignette est un bouton, pas un lien vers un autre onglet", () => {
    const vignette = hote.querySelector("button.registre-image");
    expect(vignette, "la vignette n est pas un bouton").not.toBeNull();
    expect(vignette!.getAttribute("aria-haspopup")).toBe("dialog");
    expect(hote.querySelector('a[target="_blank"].registre-image')).toBeNull();
    expect(dialogue()).toBeNull();
  });

  it("s ouvre au clic, avec l image entiere et son nom, et suspend la pagination", () => {
    ouvrir();
    const d = dialogue();
    expect(d, "aucune fenetre ouverte").not.toBeNull();
    expect(d!.hasAttribute("open")).toBe(true);
    expect(d!.querySelector("img")?.getAttribute("src")).toContain("certifications/c.webp");
    expect(d!.textContent).toContain("NSE 1");
    expect(surcouche()).toBe("true");
  });

  it("se ferme par son bouton, et rend la pagination", () => {
    ouvrir();
    act(() => dialogue()!.querySelector<HTMLButtonElement>(`button[aria-label="Fermer l'image"]`)!.click());
    expect(dialogue()).toBeNull();
    expect(surcouche()).toBe("false");
  });

  it("se ferme par Echap", () => {
    ouvrir();
    act(() => void dialogue()!.dispatchEvent(new Event("cancel", { cancelable: true })));
    expect(dialogue()).toBeNull();
  });

  it("se ferme par un clic hors de l image", () => {
    ouvrir();
    act(() => dialogue()!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(dialogue()).toBeNull();
  });
});
