import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../i18n/i18n-context";
import { ParcoursPagine } from "@/components/parcours/parcours-pagine";
import { SECTIONS } from "./sections";

/** Le fournisseur declare `children` en prop requise et `createElement` les
 *  passe en troisieme argument, que les surcharges de TypeScript ne comptent
 *  pas. Le cast ne masque rien : les enfants sont bien fournis. */
const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;

function rendre(ids: string[], pied = "PIED") {
  const sections = SECTIONS.filter((s) => ids.includes(s.id));
  const enfants: Record<string, string> = {};
  for (const id of ids) enfants[id] = `CONTENU-${id}`;
  return renderToStaticMarkup(
    createElement(
      Fournisseur,
      { defaultLocale: "fr" },
      createElement(ParcoursPagine, { sections, enfants, pied }),
    ),
  );
}

describe("ParcoursPagine (spec sections 2 et 5)", () => {
  it("rend une section par entree, dans l ordre", () => {
    const html = rendre(["ouverture", "projets", "contact"]);
    const ordre = ["ouverture", "projets", "contact"].map((id) =>
      html.indexOf(`CONTENU-${id}`),
    );
    expect(ordre[0]).toBeGreaterThan(-1);
    expect(ordre[1]).toBeGreaterThan(ordre[0]);
    expect(ordre[2]).toBeGreaterThan(ordre[1]);
  });

  it("n active que la premiere section au rendu serveur", () => {
    const html = rendre(["ouverture", "projets"]);
    expect([...html.matchAll(/data-active="true"/g)]).toHaveLength(1);
  });

  it("donne a chaque section tabindex -1, pour recevoir le focus", () => {
    const html = rendre(["ouverture", "projets"]);
    expect([...html.matchAll(/tabindex="-1"/g)]).toHaveLength(2);
  });

  it("porte une region aria-live polite pour annoncer l arrivee", () => {
    expect(rendre(["ouverture"])).toMatch(/aria-live="polite"/);
  });

  // Spec section 3.3 : le pied descend dans la DERNIERE section rendue.
  it("met le pied dans la derniere section rendue, pas dans temoignages", () => {
    const html = rendre(["ouverture", "projets"]);
    const dernier = html.indexOf("CONTENU-projets");
    expect(html.indexOf("PIED")).toBeGreaterThan(dernier);
    expect(html.indexOf("PIED")).toBeGreaterThan(html.indexOf("CONTENU-ouverture"));
  });

  it("ne rend le pied qu une fois", () => {
    expect([...rendre(["ouverture", "projets", "contact"]).matchAll(/PIED/g)])
      .toHaveLength(1);
  });

  // Point de vigilance 2 : aucune section active.
  it("rend un document valide avec une liste vide, sans lever", () => {
    expect(() => rendre([])).not.toThrow();
    expect(rendre([])).toContain("PIED");
  });

  it("n emploie aucun mouvement propre", () => {
    const html = rendre(["ouverture"]);
    expect(html).not.toMatch(/slide-in|translate-|animate-in/);
  });
});
