import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PersonalInfoDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { LiensReseaux } from "@/components/portfolio/liens-reseaux";
import { bloc, cssNu, lire, tableDesContenus, valeur } from "../parcours/feuille-test";

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const infos = (p: Partial<PersonalInfoDto>) =>
  ({ name: "B", surname: "F", email: "", githubUrl: null, linkedinUrl: null, ...p }) as PersonalInfoDto;
const rendre = (p: Partial<PersonalInfoDto>) =>
  renderToStaticMarkup(createElement(Fournisseur, { defaultLocale: "fr" }, createElement(LiensReseaux, { infos: infos(p) })));

describe("les reseaux renseignes au backoffice", () => {
  it("rend chaque reseau renseigne, nomme, et ouvre les sites dans un nouvel onglet", () => {
    const html = rendre({
      githubUrl: "https://github.com/moi",
      linkedinUrl: "https://www.linkedin.com/in/moi",
      email: "moi@exemple.org",
    });
    expect(html).toMatch(/<a[^>]*href="https:\/\/github.com\/moi"[^>]*aria-label="GitHub"/);
    expect(html).toMatch(/<a[^>]*href="https:\/\/www.linkedin.com\/in\/moi"[^>]*aria-label="LinkedIn"/);
    expect(html).toMatch(/<a[^>]*href="mailto:moi@exemple.org"/);
    expect(html.match(/target="_blank"/g)).toHaveLength(2);
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(2);
  });

  it("n affiche rien pour un reseau absent", () => {
    const html = rendre({ linkedinUrl: "https://www.linkedin.com/in/moi" });
    expect(html).not.toContain("GitHub");
    expect(html).not.toContain("mailto:");
    expect(html.match(/<a /g)).toHaveLength(1);
  });

  it("ecarte une adresse qui n est pas en https, comme partout sur le site", () => {
    const html = rendre({ githubUrl: "javascript:alert(1)", linkedinUrl: "http://linkedin.com/in/moi" });
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("http://linkedin");
  });

  it("ne rend rien du tout sans aucun reseau", () => {
    expect(rendre({})).toBe("");
  });

  it("donne a chaque icone une cible d au moins 24 px", () => {
    const lien = bloc(/\.lien-reseau\s*\{/, cssNu);
    expect(parseInt(valeur(lien, "min-inline-size"))).toBeGreaterThanOrEqual(24);
    expect(parseInt(valeur(lien, "min-block-size"))).toBeGreaterThanOrEqual(24);
  });
});

describe("les reseaux sur la presentation et au pied de page", () => {
  it("la presentation les montre sous le portrait, dans sa colonne", () => {
    const ouverture = tableDesContenus().find((e) => e.id === "ouverture")!.texte;
    const identite = ouverture.indexOf('className="ouverture-identite"');
    expect(identite).toBeGreaterThan(-1);
    expect(ouverture.indexOf("<Medaillon")).toBeGreaterThan(identite);
    expect(ouverture.indexOf("<LiensReseaux")).toBeGreaterThan(ouverture.indexOf("<Medaillon"));
    expect(ouverture.indexOf("<LiensReseaux")).toBeLessThan(ouverture.indexOf('className="ouverture-texte"'));
  });

  it("le pied de page passe par le meme composant, plus de copie", () => {
    const pied = lire("components/portfolio/footer.tsx");
    expect(pied).toContain("<LiensReseaux");
    expect(pied).not.toContain("aria-label=\"LinkedIn\"");
  });

  it("au pied de page, des cibles compactes mais d au moins 24 px", () => {
    expect(lire("components/portfolio/footer.tsx")).toContain('className="liens-reseaux-compacts"');
    const compact = bloc(/\.liens-reseaux-compacts \.lien-reseau\s*\{/, cssNu);
    expect(valeur(compact, "min-inline-size")).toBe("24px");
    expect(valeur(compact, "min-block-size")).toBe("24px");
  });

  it("sur telephone, les icones se placent a cote du petit portrait", () => {
    const etroit = bloc(/@media \(max-width:\s*599px\)\s*\{(?=\s*\.medaillon-niche)/, cssNu);
    expect(valeur(bloc(/\.ouverture-identite\s*\{/, etroit), "flex-direction")).toBe("row");
  });
});
