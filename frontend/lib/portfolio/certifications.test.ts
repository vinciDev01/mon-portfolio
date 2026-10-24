import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { CertificationDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { CertificationsSection } from "@/components/portfolio/certifications-section";
import { bloc, valeur } from "../parcours/feuille-test";
import { cheminSceau, initialesOrganisme, regrouperParOrganisme } from "./certifications";

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;

function certif(
  id: string,
  organisme: string,
  extra: Partial<CertificationDto> = {},
): CertificationDto {
  return {
    id,
    name: `Certif ${id}`,
    imagePath: null,
    organizationId: organisme,
    organization: { id: organisme, label: organisme, logoPath: null, websiteUrl: null, sortOrder: 0 },
    description: null,
    issueDate: null,
    credentialUrl: null,
    sortOrder: 0,
    ...extra,
  };
}

describe("le regroupement par organisme", () => {
  it("garde l ordre de premiere apparition, et l ordre recu dans chaque groupe", () => {
    const g = regrouperParOrganisme([
      certif("a", "Fortinet"),
      certif("b", "Cisco"),
      certif("c", "Fortinet"),
    ]);
    expect(g.map((x) => x.organisme.label)).toEqual(["Fortinet", "Cisco"]);
    expect(g[0]!.certifications.map((c) => c.id)).toEqual(["a", "c"]);
  });
});

describe("les initiales du sceau", () => {
  it("prend la premiere lettre des deux premiers mots", () => {
    expect(initialesOrganisme("Cisco Networking Academy")).toBe("CN");
  });
  it("prend une seule lettre pour un nom d un mot", () => {
    expect(initialesOrganisme("Oracle")).toBe("O");
  });
  it("ignore les espaces superflus et met en capitales", () => {
    expect(initialesOrganisme("  amazon   web services ")).toBe("AW");
  });
});

describe("le bord festonne du sceau", () => {
  it("est un trace ferme, d un feston par dent", () => {
    const d = cheminSceau(12);
    expect(d.startsWith("M")).toBe(true);
    expect(d.trim().endsWith("Z")).toBe(true);
    expect(d.match(/Q/g)).toHaveLength(12);
  });
});

describe("la section des certifications", () => {
  const rendre = (certifs: CertificationDto[]) =>
    renderToStaticMarkup(
      createElement(Fournisseur, { defaultLocale: "fr" }, createElement(CertificationsSection, { certifications: certifs })),
    );

  it("rend un sceau et un titre par organisme, ses certifications a cote", () => {
    const html = rendre([certif("a", "Fortinet"), certif("b", "Oracle"), certif("c", "Fortinet")]);
    expect(html.match(/class="sceau"/g)).toHaveLength(2);
    expect(html.match(/<h3[^>]*>/g)).toHaveLength(2);
    const fortinet = html.indexOf(">Fortinet<");
    const oracle = html.indexOf(">Oracle<");
    expect(fortinet).toBeGreaterThan(-1);
    expect(html.indexOf("Certif c")).toBeGreaterThan(fortinet);
    expect(html.indexOf("Certif c")).toBeLessThan(oracle);
  });

  it("le sceau est un dessin : il ne double pas le nom de l organisme", () => {
    const html = rendre([certif("a", "Oracle")]);
    expect(/<svg[^>]*class="sceau"[^>]*aria-hidden="true"/.test(html)).toBe(true);
  });

  it("montre l annee et le lien seulement quand ils existent", () => {
    const sans = rendre([certif("a", "Oracle")]);
    expect(sans).not.toContain("Voir la certification");
    expect(sans).not.toMatch(/<time/);
    const avec = rendre([
      certif("a", "Oracle", { issueDate: "2024-06-15T00:00:00.000Z", credentialUrl: "https://exemple.org/c" }),
    ]);
    expect(avec).toMatch(/<time[^>]*dateTime="2024-06-15"[^>]*>2024<\/time>/);
    expect(avec).toContain('href="https://exemple.org/c"');
  });

  it("montre la vignette d une certification, nommee par son image", () => {
    const html = rendre([certif("a", "Oracle", { imagePath: "certifications/c.webp" })]);
    const bouton = /<button[^>]*class="registre-image"[^>]*>[\s\S]*?<\/button>/.exec(html)?.[0];
    expect(bouton, "aucune vignette rendue").toBeDefined();
    // Le nom accessible du bouton vient de l'alternative de l'image.
    expect(bouton).toMatch(/<img[^>]*alt="Image de la certification Certif a"/);
  });

  it("la fenetre de l image est centree, malgre le preflight", () => {
    expect(valeur(bloc(/^\s*\.visionneuse\s*\{/m), "margin")).toBe("auto");
    expect(valeur(bloc(/\.visionneuse-image\s*\{/), "object-fit")).toBe("contain");
  });

  it("sans image, aucune vignette ni colonne reservee", () => {
    const html = rendre([certif("a", "Oracle")]);
    expect(html).not.toContain("registre-image");
    expect(html).not.toContain("avec-image");
  });

  it("la vignette est contenue entiere, jamais rognee", () => {
    const img = bloc(/\.registre-image img\s*\{/);
    expect(valeur(img, "object-fit")).toBe("contain");
    expect(valeur(bloc(/\.registre-entree\.avec-image\s*\{/), "grid-template-columns")).toMatch(/px/);
  });

  it("ne rend rien sans certification", () => {
    expect(rendre([])).toBe("");
  });

  it("au palier etroit, la liste passe sous le sceau, sur toute la largeur", () => {
    const etroit = bloc(/@media \(max-width:\s*599px\)\s*\{(?=\s*\.registre-certifs)/);
    expect(valeur(bloc(/\.registre-liste\s*\{/, etroit), "grid-column")).toBe("1 / -1");
    // Le sceau, le nom et la liste sont freres dans la grille : enveloppes dans
    // un meme bloc, la liste ne pourrait pas quitter la colonne du texte.
    const html = renderToStaticMarkup(
      createElement(Fournisseur, { defaultLocale: "fr" }, createElement(CertificationsSection, { certifications: [certif("a", "Oracle")] })),
    );
    expect(html).toMatch(/<section class="registre-certifs"[^>]*><span class="sceau-boite">[\s\S]*?<\/span><h3[^>]*>Oracle<\/h3><ul class="registre-liste">/);
  });

  it("un logo remplace initiales et anneau, sur une pastille claire", () => {
    const html = rendre([
      certif("a", "Fortinet", {
        organization: { id: "Fortinet", label: "Fortinet", logoPath: "organizations/f.webp", websiteUrl: null, sortOrder: 0 },
      }),
    ]);
    expect(html).toMatch(/<span class="sceau-plaque"><img[^>]*class="sceau-logo"/);
    expect(html).not.toContain("sceau-initiales");
    expect(html).not.toContain("sceau-anneau");
  });

  it("le logo tient entier : contenu, jamais decoupe en rond", () => {
    // Un logotype est allonge (Fortinet : 270 x 148). Arrondi, il perdait ses
    // lettres aux extremites ; c'est la pastille qui est ronde, pas lui.
    const logo = bloc(/\.sceau-logo\s*\{/);
    expect(logo).not.toMatch(/border-radius/);
    expect(valeur(logo, "object-fit")).toBe("contain");
    expect(valeur(bloc(/\.sceau-plaque\s*\{/), "border-radius")).toBe("50%");
    expect(valeur(bloc(/\.sceau-plaque\s*\{/), "background")).toBe("var(--surface-clair)");
  });

  it("le trait du sceau suit la palette, sans couleur propre", () => {
    const bord = bloc(/\.sceau-bord\s*\{/);
    expect(valeur(bord, "stroke")).toBe("currentColor");
    expect(valeur(bloc(/^\s*\.sceau\s*\{/m), "color")).toMatch(/^var\(--/);
  });
});
