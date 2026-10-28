import { describe, it, expect } from "vitest";
import type { CoursPublicDto, TechnologyFamilyDto } from "@portfolio/shared-types";
import { ratioContraste } from "@/lib/color/contrast";
import { CUIRS, cuirDe, rangerEnPlanches, tailleLisible } from "./etagere";

const famille = (id: string, sortOrder: number, name = `Famille ${id}`): TechnologyFamilyDto => ({ id, name, sortOrder });

function cours(id: string, fam: TechnologyFamilyDto | null, extra: Partial<CoursPublicDto> = {}): CoursPublicDto {
  return {
    id,
    titre: `Cours ${id}`,
    titreCourt: null,
    description: null,
    niveau: "debutant",
    pages: null,
    taille: 1000,
    updatedAt: "2026-10-01T00:00:00.000Z",
    sortOrder: 0,
    technology: {
      id: `t-${id}`,
      label: `Techno ${id}`,
      logoPath: null, logoSlug: null,
      sortOrder: 0,
      showInCv: true,
      familyId: fam?.id ?? null,
      family: fam,
    },
    ...extra,
  };
}

describe("ranger les cours en planches", () => {
  it("une planche par famille, dans l ordre des familles, Autres en dernier", () => {
    const b = famille("b", 1);
    const a = famille("a", 0);
    const p = rangerEnPlanches([cours("1", b), cours("2", null), cours("3", a)]);
    expect(p.map((x) => x.famille?.id ?? "autres")).toEqual(["a", "b", "autres"]);
  });

  it("a ordre egal, departage les familles par leur nom", () => {
    const p = rangerEnPlanches([cours("1", famille("z", 0, "Zeta")), cours("2", famille("y", 0, "Alpha"))]);
    expect(p.map((x) => x.famille?.name)).toEqual(["Alpha", "Zeta"]);
  });

  it("aucune planche vide : une famille sans cours n apparait pas", () => {
    expect(rangerEnPlanches([])).toEqual([]);
    expect(rangerEnPlanches([cours("1", famille("a", 0))])).toHaveLength(1);
  });

  it("dans une planche : ordre du cours, puis de la technologie, puis titre", () => {
    const a = famille("a", 0);
    const p = rangerEnPlanches([
      cours("1", a, { sortOrder: 2, titre: "B" }),
      cours("2", a, { sortOrder: 1, titre: "Z" }),
      cours("3", a, { sortOrder: 1, titre: "A" }),
    ]);
    expect(p[0]!.cours.map((c) => c.titre)).toEqual(["A", "Z", "B"]);
  });
});

describe("le cuir de chaque livre", () => {
  it("est toujours le meme pour une technologie", () => {
    expect(cuirDe("java")).toEqual(cuirDe("java"));
  });

  it("varie d une technologie a l autre", () => {
    const fonds = new Set(Array.from({ length: 20 }, (_, i) => cuirDe(`techno-${i}`).fond));
    expect(fonds.size).toBeGreaterThanOrEqual(4);
  });

  it("chaque cuir porte un texte de tranche lisible, 4,5:1 au moins", () => {
    expect(CUIRS.length).toBeGreaterThanOrEqual(6);
    for (const c of CUIRS) {
      expect(ratioContraste(c.texte, c.fond), `${c.texte} sur ${c.fond}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("la taille lisible d un fichier", () => {
  it("en Mo, a une decimale, au format de la langue", () => {
    expect(tailleLisible(2516582, "fr")).toBe("2,4 Mo");
    expect(tailleLisible(2516582, "en")).toBe("2.4 MB");
  });

  it("en Ko sous le mega-octet", () => {
    expect(tailleLisible(600 * 1024, "fr")).toBe("600 Ko");
  });
});
