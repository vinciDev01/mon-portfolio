import { describe, it, expect } from "vitest";
import { bloc, contenuGaucheA, lire, PALIERS, variableA } from "./feuille-test";

/* Le defaut : trois elements vivent hors de `SectionShell` et ne recevaient
   donc jamais la gouttiere gauche qui reserve la colonne de passage, opaque et
   fixe. Le pied de page glissait dessous de 32 a 80 px, la ligne de
   disponibilite commencait a x = 0, le toast se centrait sur la fenetre. */

const page = lire("app/page.tsx");
const GOUTTIERE = "gouttiere-parcours";

/** Elements rendus par la page hors de toute `SectionShell`. */
const HORS_COQUILLE = [
  { balise: "Footer", fichier: "components/portfolio/footer.tsx" },
  { balise: "LigneDisponibilite", fichier: "components/parcours/drapeau-disponibilite.tsx" },
  { balise: "ToastNotification", fichier: "components/portfolio/toast-notification.tsx" },
] as const;

describe("la gouttiere du parcours", () => {
  it("est une regle unique, qui reserve la colonne", () => {
    const regle = bloc(/\.gouttiere-parcours\s*\{/);
    expect(regle).toMatch(/padding-inline-start:\s*var\(--contenu-gauche\)/);
    expect(regle).toMatch(/padding-inline-end:\s*var\(--gouttiere\)/);
  });

  it("depasse la colonne a chaque palier, d'apres la feuille", () => {
    expect(PALIERS.length).toBeGreaterThan(1);
    for (const p of PALIERS) {
      const fenetre = Math.max(p.min, 320);
      expect(contenuGaucheA(fenetre), `palier ${p.min} px`).toBeGreaterThan(
        variableA("--colonne", fenetre),
      );
    }
  });

  it("est declaree une seule fois : plus de copie de ses deux declarations", () => {
    const css = lire("app/globals.css");
    expect(css.match(/padding-inline-start:\s*var\(--contenu-gauche\)/g)).toHaveLength(1);
  });

  it("la coquille de section la porte", () => {
    expect(lire("components/portfolio/section-shell.tsx")).toContain(GOUTTIERE);
  });
});

describe("les elements hors de SectionShell", () => {
  it("la page les rend bien (sinon ce test ne garde plus rien)", () => {
    for (const { balise } of HORS_COQUILLE) {
      expect(page, balise).toMatch(new RegExp(`<${balise}[\\s/>]`));
    }
  });

  it("le pied de page et la ligne de disponibilite portent la gouttiere", () => {
    for (const { fichier } of HORS_COQUILLE.slice(0, 2)) {
      expect(lire(fichier), fichier).toContain(GOUTTIERE);
    }
  });

  it("le pied de page ne declare plus d'utilitaire px-", () => {
    const pied = lire("components/portfolio/footer.tsx");
    const racine = /<footer\s[^>]*className="([^"]*)"/.exec(pied);
    expect(racine, "balise footer introuvable").not.toBeNull();
    expect(racine![1]).toContain(GOUTTIERE);
    expect(racine![1]).not.toMatch(/(?:^|[\s:])px-/);
  });

  it("le toast se centre dans l'espace restant, par un retrait et non par un padding", () => {
    const toast = lire("components/portfolio/toast-notification.tsx");
    const m = /className="(fixed [^"]*)"/.exec(toast);
    expect(m, "conteneur fixe introuvable").not.toBeNull();
    expect(m![1]).toContain("start-[var(--colonne)]");
    expect(m![1]).not.toContain("inset-x-0");
  });

  it("la ligne de disponibilite garde sa marge et sa gouttiere", () => {
    expect(bloc(/\.ligne-disponibilite\s*\{/)).toMatch(/margin-block-end/);
    expect(lire("components/parcours/drapeau-disponibilite.tsx")).toMatch(
      /className="ligne-disponibilite gouttiere-parcours"/,
    );
  });
});
