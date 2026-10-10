import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import sharp from "sharp";
import {
  taillesPour,
  nomVariante,
  TAILLES_MEDAILLON,
  categoriesAvecVariantes,
  ecrireVariantes,
} from "./variantes";
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

  it("les catégories à variantes sont les mêmes des deux côtés, et leurs tailles aussi", () => {
    expect(categoriesAvecVariantes().sort()).toEqual(partage.categoriesAvecVariantes().sort());
    for (const c of [...categoriesAvecVariantes(), ...partage.categoriesAvecVariantes()]) {
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

describe("ecrireVariantes", () => {
  let dossier: string;
  beforeEach(() => {
    dossier = fs.mkdtempSync(path.join(os.tmpdir(), "variantes-"));
  });
  afterEach(() => fs.rmSync(dossier, { recursive: true, force: true }));

  const source = (width: number, height: number) =>
    sharp({ create: { width, height, channels: 3, background: "#c33" } })
      .png()
      .toBuffer();

  it.each([
    [200, 150],
    [150, 200],
    [500, 300],
    [100, 100],
  ])("produit des variantes carrées et jamais agrandies pour %ix%i", async (w, h) => {
    const noms = await ecrireVariantes(await source(w, h), dossier, "abc.webp", "personal");
    expect(noms).toEqual(["abc-88.webp", "abc-176.webp", "abc-264.webp"]);
    for (const [i, taille] of [88, 176, 264].entries()) {
      const m = await sharp(path.join(dossier, noms[i])).metadata();
      expect(m.width).toBe(m.height);
      expect(m.width).toBe(Math.min(taille, w, h));
    }
  });

  it("n'écrit rien hors de la catégorie personal", async () => {
    expect(await ecrireVariantes(await source(200, 150), dossier, "abc.webp", "projects")).toEqual([]);
    expect(fs.readdirSync(dossier)).toEqual([]);
  });
});
