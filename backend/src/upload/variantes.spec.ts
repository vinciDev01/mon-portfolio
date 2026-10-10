import { taillesPour, nomVariante, TAILLES_MEDAILLON } from "./variantes";
import * as partage from "@portfolio/shared-types";

describe("variantes de téléversement", () => {
  it("produit trois tailles pour la catégorie personal", () => {
    expect(taillesPour("personal")).toEqual([88, 176, 264]);
  });

  it("ne produit aucune variante pour les autres catégories", () => {
    for (const c of ["projects", "technologies", "certifications", "blog", "site"]) {
      expect(taillesPour(c)).toEqual([]);
    }
  });

  it("ne produit aucune variante pour une catégorie inconnue", () => {
    expect(taillesPour("inconnue")).toEqual([]);
  });

  it("nomme la variante en suffixant la taille avant l'extension", () => {
    expect(nomVariante("abc.webp", 176)).toBe("abc-176.webp");
  });

  it("laisse intact un nom sans extension", () => {
    expect(nomVariante("abc", 176)).toBe("abc-176");
  });

  it("préserve un chemin à dossiers", () => {
    expect(nomVariante("personal/abc.webp", 264)).toBe("personal/abc-264.webp");
  });

  it("expose les trois tailles du médaillon, que le frontend lira aussi", () => {
    expect(TAILLES_MEDAILLON).toEqual([88, 176, 264]);
  });
});

describe("accord entre la copie backend et le paquet partagé", () => {
  it("taillesPour renvoie le même tableau des deux côtés", () => {
    for (const c of ["personal", "projects", "technologies", "certifications", "blog", "site", "inconnue"]) {
      expect(taillesPour(c)).toEqual(partage.taillesPour(c));
    }
  });

  it("nomVariante renvoie la même chaîne des deux côtés", () => {
    const bases = [
      "abc.webp",
      "abc",
      "personal/abc.webp",
      "dossier.v2/abc",
      "dossier.v2/abc.webp",
      "a\\b.webp",
      ".cache",
      "archive.tar.gz",
    ];
    for (const base of bases) {
      for (const taille of [88, 176, 264]) {
        expect(nomVariante(base, taille)).toBe(partage.nomVariante(base, taille));
      }
    }
  });

  it("TAILLES_MEDAILLON est identique des deux côtés", () => {
    expect([...partage.TAILLES_MEDAILLON]).toEqual([...TAILLES_MEDAILLON]);
  });
});
