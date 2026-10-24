import { describe, it, expect } from "vitest";
import { bloc, cssNu, lire, tableDesContenus, valeur } from "../parcours/feuille-test";

describe("la presentation tient sur un ecran", () => {
  const ouverture = tableDesContenus().find((e) => e.id === "ouverture")!;

  it("le portrait passe a cote du texte, plus au-dessus", () => {
    const corps = ouverture.texte.indexOf('className="ouverture-corps"');
    const portrait = ouverture.texte.indexOf("<Medaillon");
    const texte = ouverture.texte.indexOf('className="ouverture-texte"');
    expect(corps, "enveloppe de l ouverture introuvable").toBeGreaterThan(-1);
    expect(portrait).toBeGreaterThan(corps);
    expect(texte).toBeGreaterThan(portrait);
    // La disponibilite et les cartes vivent dans la colonne du texte.
    expect(ouverture.texte.indexOf("<LigneDisponibilite")).toBeGreaterThan(texte);
    expect(ouverture.texte.indexOf("<PresentationSection")).toBeGreaterThan(texte);
  });

  it("deux colonnes : le portrait a sa largeur, le texte le reste", () => {
    const regle = bloc(/^\s*\.ouverture-corps\s*\{/m, cssNu);
    expect(valeur(regle, "display")).toBe("grid");
    expect(valeur(regle, "grid-template-columns")).toBe("auto minmax(0, 1fr)");
  });

  it("le portrait, dans la grille, garde sa taille et ne garde que la place de son echo", () => {
    const niche = bloc(/\.ouverture-corps \.medaillon-niche\s*\{/, cssNu);
    expect(valeur(niche, "margin-block-end")).toBe("var(--medaillon-echo)");
    // Sans cela, la colonne unique du telephone etire la niche et son echo.
    expect(valeur(niche, "justify-self")).toBe("start");
  });

  it("les cartes se resserrent : un ecart de 40 px, plus de 64", () => {
    const cartes = lire("components/portfolio/presentation-section.tsx");
    expect(cartes).toContain('marginTop: "var(--espace-4)"');
    expect(cartes).not.toContain("var(--espace-5)");
  });

  it("sur telephone, le portrait repasse au-dessus du texte, qui reprend toute la largeur", () => {
    const etroit = bloc(/@media \(max-width:\s*599px\)\s*\{(?=\s*\.medaillon-niche)/, cssNu);
    expect(valeur(bloc(/\.ouverture-corps\s*\{/, etroit), "grid-template-columns")).toBe("minmax(0, 1fr)");
  });

  it("sur un ecran bas, les marges des sections se resserrent sans jamais grandir", () => {
    const bas = bloc(/@media \(max-height:\s*860px\)\s*\{(?=\s*:root)/, cssNu);
    expect(valeur(bas, "--espace-section")).toBe("min(var(--portfolio-section-spacing, 120px), 64px)");
    expect(valeur(bas, "--section-bas")).toBe("var(--espace-3)");
  });

  it("les tailles des cartes vivent dans la feuille, pour suivre la hauteur de l ecran", () => {
    const cartes = lire("components/portfolio/presentation-section.tsx");
    expect(cartes).not.toMatch(/text-(?:xl|2xl|3xl|lg|base|sm)\b/);
    expect(cartes).toContain('className="presentation-titre"');
    const bas = bloc(/@media \(max-height:\s*780px\)\s*\{(?=\s*\.presentation-titre)/, cssNu);
    expect(bas).toMatch(/\.presentation-titre\s*\{[^}]*font-size/);
  });
});