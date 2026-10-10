import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../i18n/i18n-context";
import { ParcoursPagine } from "@/components/parcours/parcours-pagine";
import { SECTIONS } from "./sections";
import { lire, tableDesContenus } from "./feuille-test";
import { useSectionActive } from "@/components/parcours/parcours-pagine";

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

  // Sans cette classe, `inset: 0` se resout contre la fenetre, en silence.
  it("porte la classe parcours-pagine sur le conteneur reel, parent des sections", () => {
    const html = rendre(["ouverture", "projets"]);
    expect(html).toMatch(/<div class="parcours-pagine"[^>]*>\s*<div id="ouverture" class="section-paginee"/);
    expect([...html.matchAll(/class="section-paginee"/g)]).toHaveLength(2);
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

describe("les retraits de la tache 5 (spec section 3.1)", () => {
  it("use-reveal est supprime", () => {
    expect(() => lire("lib/use-reveal.ts")).toThrow();
  });

  it("plus aucun fichier source n importe le hook de revelation", () => {
    for (const f of ["components/portfolio/section-shell.tsx", "app/page.tsx"]) {
      expect(lire(f), f).not.toContain("use-reveal");
      expect(lire(f), f).not.toContain("useReveal");
    }
  });

  it("la coquille de section n a plus de reveal ni data-rang, et peut recevoir le focus", () => {
    const coquille = lire("components/portfolio/section-shell.tsx");
    expect(coquille).not.toContain("reveal");
    expect(coquille).not.toContain("data-rang");
    expect(coquille).toMatch(/<section[^>]*tabIndex=\{-1\}/);
  });

  it("l identifiant de section n est pose que par le conteneur", () => {
    // Deux elements portant le meme id casseraient les ancres et le focus.
    expect(lire("components/portfolio/section-shell.tsx")).not.toMatch(/\bid=/);
    expect(lire("app/page.tsx")).not.toMatch(/\bid=/);
  });
});

describe("l ouverture inconditionnelle (spec section 3.1)", () => {
  it("la table couvre exactement les sections declarees", () => {
    expect(tableDesContenus().map((e) => e.id)).toEqual(SECTIONS.map((s) => s.id));
  });

  it("page.tsx ne conditionne aucune section : les reglages passent par sectionsActives", () => {
    const page = lire("app/page.tsx");
    expect(page).toContain("sectionsActives(s)");
    // Categorique : aucune coquille n'est precedee d'un `show... &&`, y compris
    // celle de l'ouverture.
    expect(page).not.toMatch(/show[A-Z]\w+\s*&&\s*\(?\s*<SectionShell/);
  });

  it("showPresentations ne conditionne que les cartes de l ouverture", () => {
    const ouverture = tableDesContenus().find((e) => e.id === "ouverture")!;
    const conditions = [...ouverture.texte.matchAll(/(show[A-Z]\w+)\s*&&\s*\(?\s*<(\w+)/g)];
    expect(conditions.map((m) => [m[1], m[2]])).toEqual([
      ["showPresentations", "PresentationSection"],
    ]);
  });

  it("le pied et la colonne sont passes au conteneur, pas rendus a cote", () => {
    const page = lire("app/page.tsx");
    const conteneur = page.slice(page.indexOf("<ParcoursPagine"), page.indexOf("/>", page.indexOf("colonne=")));
    expect(conteneur).toContain("pied={<Footer");
    expect(conteneur).toContain("colonne={<ColonnePassage");
    expect(page.match(/<Footer/g)).toHaveLength(1);
    expect(page.match(/<ColonnePassage/g)).toHaveLength(1);
  });
});

describe("la colonne lit la section active du conteneur", () => {
  const colonne = lire("components/parcours/colonne-passage.tsx");

  it("n importe plus l ancien suivi de position, ni ne l appelle", () => {
    expect(colonne).not.toContain("section-courante");
    expect(colonne).not.toContain("useSectionCourante");
    expect(colonne).toContain("useSectionActive()");
  });

  it("le contexte fournit l identifiant de la section active a un enfant rendu en prop", () => {
    // Le comportement dont `aria-current` depend : un element passe par la
    // prop `colonne` lit l'id de la section affichee.
    function Sonde() {
      return createElement("i", { "data-lu": String(useSectionActive()) });
    }
    const sections = SECTIONS.filter((s) => ["ouverture", "projets"].includes(s.id));
    const html = renderToStaticMarkup(
      createElement(
        I18nProvider as ComponentType<{ defaultLocale: string }>,
        { defaultLocale: "fr" },
        createElement(ParcoursPagine, {
          sections,
          enfants: { ouverture: "a", projets: "b" },
          pied: "p",
          colonne: createElement(Sonde),
        }),
      ),
    );
    expect(html).toContain('data-lu="ouverture"');
  });

  it("en dehors du conteneur, aucune section n est active", () => {
    function Sonde() {
      return createElement("i", { "data-lu": String(useSectionActive()) });
    }
    expect(renderToStaticMarkup(createElement(Sonde))).toContain('data-lu="null"');
  });
});
