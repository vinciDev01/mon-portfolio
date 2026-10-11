import { describe, it, expect } from "vitest";
import type { ProjectDto, ProjectCollaboratorDto } from "@portfolio/shared-types";
import { blocsPresents, credits } from "./parchemin";
import { css } from "./feuille-test";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";

function projet(p: Partial<ProjectDto>): ProjectDto {
  return {
    id: "x", name: "Projet", description: null,
    photo1Path: null, photo2Path: null, demoUrl: null, targetAudience: null,
    startDate: null, endDate: null, technologies: [], collaborators: [],
    sortOrder: 0, ...p,
  } as ProjectDto;
}

function qui(p: Partial<ProjectCollaboratorDto>): ProjectCollaboratorDto {
  return {
    id: "c", firstName: "Ada", lastName: "Lovelace",
    email: null, linkedinUrl: null, sortOrder: 0, ...p,
  };
}

describe("blocsPresents (spec section 4)", () => {
  // Point de vigilance 1 : un projet depouille.
  it("ne rend aucun bloc pour un projet sans rien", () => {
    expect(blocsPresents(projet({}))).toEqual([]);
  });

  it("rend les photos des qu une seule existe", () => {
    expect(blocsPresents(projet({ photo1Path: "a.webp" }))).toContain("photos");
    expect(blocsPresents(projet({ photo2Path: "b.webp" }))).toContain("photos");
  });

  it("ne rend pas le public cible quand il est vide ou blanc", () => {
    expect(blocsPresents(projet({ targetAudience: "" }))).not.toContain("public");
    expect(blocsPresents(projet({ targetAudience: "   " }))).not.toContain("public");
  });

  it("ne rend pas la description quand elle est blanche", () => {
    expect(blocsPresents(projet({ description: "  " }))).not.toContain("description");
  });

  it("ne rend pas les technologies sur une liste vide", () => {
    expect(blocsPresents(projet({ technologies: [] }))).not.toContain("technologies");
  });

  it("ne rend pas les collaborateurs sur une liste vide", () => {
    expect(blocsPresents(projet({ collaborators: [] }))).not.toContain("collaborateurs");
  });

  it("garde l ordre de lecture de la spec", () => {
    const tout = projet({
      photo1Path: "a.webp", description: "d", targetAudience: "p",
      technologies: [{ id: "t", label: "Angular", logoPath: null, sortOrder: 0 }],
      collaborators: [qui({})], demoUrl: "https://exemple.test",
    });
    expect(blocsPresents(tout)).toEqual([
      "photos", "description", "public", "technologies",
      "collaborateurs", "demonstration",
    ]);
  });
});

describe("credits (spec section 4)", () => {
  // Point de vigilance 2 : un collaborateur sans LinkedIn.
  it("rend un nom sans lien quand le LinkedIn est nul", () => {
    expect(credits(projet({ collaborators: [qui({ linkedinUrl: null })] })))
      .toEqual([{ cle: "c", nom: "Ada Lovelace", lien: null }]);
  });

  it("traite une chaine vide ou blanche comme une absence de lien", () => {
    expect(credits(projet({ collaborators: [qui({ linkedinUrl: "   " })] }))[0].lien)
      .toBeNull();
  });

  it("rend le lien quand il existe", () => {
    const c = credits(projet({
      collaborators: [qui({ linkedinUrl: "https://linkedin.test/in/ada" })],
    }));
    expect(c[0].lien).toBe("https://linkedin.test/in/ada");
  });

  it("trie par sortOrder et non par ordre d arrivee", () => {
    const c = credits(projet({
      collaborators: [
        qui({ id: "b", firstName: "Grace", lastName: "Hopper", sortOrder: 5 }),
        qui({ id: "a", firstName: "Ada", lastName: "Lovelace", sortOrder: 0 }),
      ],
    }));
    expect(c.map((x) => x.cle)).toEqual(["a", "b"]);
  });

  it("ne modifie pas le tableau recu", () => {
    const liste = [
      qui({ id: "b", sortOrder: 5 }),
      qui({ id: "a", sortOrder: 0 }),
    ];
    credits(projet({ collaborators: liste }));
    expect(liste.map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("tolere un nom partiel sans laisser d espace en trop", () => {
    expect(credits(projet({ collaborators: [qui({ lastName: "" })] }))[0].nom)
      .toBe("Ada");
  });
});

/** Corps de chaque bloc dont l'en-tete correspond. */
function blocs(entete: RegExp, source: string): string[] {
  const re = new RegExp(entete.source, "g");
  const trouves: string[] = [];
  for (let m = re.exec(source); m; m = re.exec(source)) {
    let profondeur = 0;
    for (let i = m.index + m[0].length - 1; i < source.length; i++) {
      if (source[i] === "{") profondeur++;
      if (source[i] === "}" && --profondeur === 0) {
        trouves.push(source.slice(m.index + m[0].length, i));
        break;
      }
    }
  }
  return trouves;
}

function lum(hex: string): number {
  const n = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)];
  const [h, l] = x > y ? [x, y] : [y, x];
  return (h + 0.05) / (l + 0.05);
}

describe("la forme du parchemin (spec section 2)", () => {
  const regles = () =>
    [...css.matchAll(/([^{}]*\.parchemin[a-z-]*[^{}]*)\{([^}]*)\}/g)];

  it("declare au moins la feuille et les bandes", () => {
    const noms = regles().map((m) => m[1]).join(" ");
    expect(noms).toContain(".parchemin-feuille");
    expect(noms).toContain(".parchemin-bande");
  });

  // Categorique : AUCUNE regle du parchemin ne bouge, quelle qu'elle soit.
  // `animat` couvre `animation` comme `animate` ; rotate et skew ferment la
  // classe des transformations individuelles.
  it("aucune regle du parchemin ne porte de mouvement", () => {
    const r = regles();
    expect(r.length, "aucune regle .parchemin").toBeGreaterThan(0);
    for (const [, sel, corps] of r) {
      expect(corps, sel.trim()).not.toMatch(
        /transition|transform|translate|rotate|skew|scale|animat/,
      );
    }
  });

  it("aucun @keyframes ne sert le parchemin", () => {
    expect(css).not.toMatch(/@keyframes\s+[a-z-]*parchemin/);
  });

  it("aucune regle du parchemin ne porte de degrade", () => {
    for (const [, sel, corps] of regles()) {
      expect(corps, sel.trim()).not.toMatch(/gradient/);
    }
  });

  it("la feuille est en surface et bordee de la bordure signifiante", () => {
    const f = blocs(/\.parchemin-feuille\s*\{/, css).join("\n");
    expect(f).toContain("var(--surface)");
    expect(f).toContain("var(--bordure-signifiante)");
  });

  it("les bandes d enroulement sont remplies a plat en fond", () => {
    const b = blocs(/\.parchemin-bande\s*\{/, css).join("\n");
    expect(b).toContain("var(--fond)");
    expect(b).not.toMatch(/gradient/);
  });

  it("les couleurs forcees donnent aux bandes une paire systeme, sans rendre la couleur de l auteur", () => {
    const forces = blocs(/@media \(forced-colors: active\)\s*\{/, css).join("\n");
    const b = blocs(/\.parchemin-bande\s*\{/, forces).join("\n");
    expect(b).toContain("fill: Canvas");
    expect(b).toContain("stroke: CanvasText");
    const f = blocs(/\.parchemin-feuille\s*\{/, forces).join("\n");
    expect(f).toContain("CanvasText");
    for (const corps of [b, f]) expect(corps).not.toMatch(/forced-color-adjust/);
  });
});

describe("les contrastes du parchemin, calcules et non epingles", () => {
  for (const [nom, p] of [["clair", PALETTE_CLAIRE], ["sombre", PALETTE_SOMBRE]] as const) {
    it(`${nom} : bordure sur la feuille atteint 3:1`, () => {
      expect(ratio(p.bordureSignifiante, p.surface)).toBeGreaterThanOrEqual(3);
    });
    it(`${nom} : texte secondaire sur la feuille atteint 4,5:1`, () => {
      expect(ratio(p.texteSecondaire, p.surface)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${nom} : accent sur la feuille atteint 4,5:1`, () => {
      expect(ratio(p.accent, p.surface)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("le fond reste plus sombre que la surface, sinon la bande ne lit plus", () => {
    // C'est ce qui fait qu'une bande en `--fond` se lit comme un dessous
    // ombre dans les DEUX palettes, sans degrade.
    expect(lum(PALETTE_CLAIRE.fond)).toBeLessThan(lum(PALETTE_CLAIRE.surface));
    expect(lum(PALETTE_SOMBRE.fond)).toBeLessThan(lum(PALETTE_SOMBRE.surface));
  });
});
