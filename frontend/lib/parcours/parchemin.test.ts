import { describe, it, expect } from "vitest";
import type { ProjectDto, ProjectCollaboratorDto } from "@portfolio/shared-types";
import { blocsPresents, credits } from "./parchemin";

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
