import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../i18n/i18n-context";
import { FormulaireContact } from "@/components/portfolio/formulaire-contact";
import { bloc, cssNu, lire, valeur } from "../parcours/feuille-test";

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const html = renderToStaticMarkup(createElement(Fournisseur, { defaultLocale: "fr" }, createElement(FormulaireContact)));

describe("contact et son pied de page tiennent sur un ecran", () => {
  it("courriel et sujet partagent une rangee, comme prenom et nom", () => {
    const morceaux = html.split('<div class="formulaire-rangee">');
    // Deux rangees : prenom et nom, puis courriel et sujet.
    expect(morceaux).toHaveLength(3);
    expect(morceaux[1]).toMatch(/name="firstName"[\s\S]*name="lastName"/);
    const seconde = morceaux[2]!.slice(0, morceaux[2]!.indexOf('name="message"'));
    expect(seconde).toMatch(/name="email"[\s\S]*name="subject"/);
  });

  it("une rangee garde deux champs cote a cote jusqu a 8 rem chacun", () => {
    expect(valeur(bloc(/\.formulaire-rangee\s*\{/, cssNu), "grid-template-columns")).toBe(
      "repeat(auto-fit, minmax(8rem, 1fr))",
    );
  });

  it("le pied de page se resserre : 20 px au lieu de 40 de chaque cote", () => {
    const pied = /<footer\s[^>]*className="([^"]*)"/.exec(lire("components/portfolio/footer.tsx"))![1]!;
    expect(pied.split(/\s+/)).toContain("py-5");
    expect(pied).not.toContain("py-10");
  });

  it("sur un ecran bas, l accroche se rapproche ; la zone garde ses trois lignes", () => {
    const bas = bloc(/@media \(max-height:\s*800px\)\s*\{(?=\s*\.contact-accroche)/, cssNu);
    expect(valeur(bloc(/\.contact-accroche\s*\{/, bas), "margin-block-end")).toBe("var(--espace-1)");
    expect(bas).not.toContain("formulaire-zone");
  });

  it("sur un ecran bas, les champs se rapprochent : 12 px entre eux au lieu de 16", () => {
    expect(valeur(bloc(/^\s*\.formulaire-contact\s*\{/m, cssNu), "gap")).toBe("var(--formulaire-ecart, var(--espace-2))");
    const bas = bloc(/@media \(max-height:\s*800px\)\s*\{(?=\s*\.contact-accroche)/, cssNu);
    expect(valeur(bloc(/\.contact-volets\s*\{/, bas), "--formulaire-ecart")).toBe("12px");
  });
});
