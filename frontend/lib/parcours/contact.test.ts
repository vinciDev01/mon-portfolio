import { describe, it, expect } from "vitest";
import type { PersonalInfoDto } from "@portfolio/shared-types";
import { canaux, type CleCanal } from "./contact";

/** Une fiche complete, champ par champ : un champ obligatoire ajoute au type fait echouer la compilation ici. */
function fiche(partiel: Partial<PersonalInfoDto> = {}): PersonalInfoDto {
  return {
    id: partiel.id ?? "id-1",
    name: partiel.name ?? "Ada",
    surname: partiel.surname ?? "Lovelace",
    email: partiel.email ?? "",
    phone: partiel.phone === undefined ? null : partiel.phone,
    githubUrl: partiel.githubUrl === undefined ? null : partiel.githubUrl,
    linkedinUrl: partiel.linkedinUrl === undefined ? null : partiel.linkedinUrl,
    avatarPath: partiel.avatarPath === undefined ? null : partiel.avatarPath,
    bio: partiel.bio === undefined ? null : partiel.bio,
  };
}

/** Les quatre canaux remplis et valides, a etaler dans `fiche`. */
const toutPlein = {
  email: "a@exemple.test",
  phone: "+33 6 12 34 56 78",
  linkedinUrl: "https://linkedin.test/in/a",
  githubUrl: "https://github.test/a",
};

/** Le champ de la fiche vers la cle de son canal. */
const cleAttendue: Record<keyof typeof toutPlein, CleCanal> = {
  email: "courriel",
  phone: "telephone",
  linkedinUrl: "linkedin",
  githubUrl: "github",
};

describe("canaux (spec section 3.1)", () => {
  it("rend les quatre canaux dans l ordre de lecture", () => {
    expect(canaux(fiche(toutPlein)).map((c) => c.cle)).toEqual([
      "courriel", "telephone", "linkedin", "github",
    ]);
  });

  it("ne rend AUCUN canal quand les quatre sont vides ou blancs", () => {
    expect(canaux(fiche({ email: "", phone: "   ", linkedinUrl: null, githubUrl: "" })))
      .toEqual([]);
  });

  it("traite le blanc comme une absence sur les QUATRE champs", () => {
    for (const champ of ["email", "phone", "linkedinUrl", "githubUrl"] as const) {
      const c = canaux(fiche({ ...toutPlein, [champ]: "   " }));
      expect(c.map((x) => x.cle), champ).not.toContain(cleAttendue[champ]);
      expect(c, champ).toHaveLength(3);
    }
  });

  it("n accepte que https: pour LinkedIn et GitHub", () => {
    for (const mauvais of ["http://x.test", "javascript:alert(1)", "x.test", "https:"]) {
      const c = canaux(fiche({ ...toutPlein, linkedinUrl: mauvais, githubUrl: mauvais }));
      expect(c.map((x) => x.cle), mauvais).toEqual(["courriel", "telephone"]);
    }
  });

  it("compose le courriel en mailto: et le telephone en tel:", () => {
    const c = canaux(fiche({ ...toutPlein, email: "  a@exemple.test  " }));
    expect(c[0].href).toBe("mailto:a@exemple.test");
    expect(c[0].valeur).toBe("a@exemple.test");
  });

  // Point de vigilance 2 : le tel: doit rester composable.
  it("retire les blancs de l href du telephone mais les garde a l affichage", () => {
    const c = canaux(fiche({ ...toutPlein, phone: "+33 6 12 34 56 78" }));
    const tel = c.find((x) => x.cle === "telephone")!;
    expect(tel.href).toBe("tel:+33612345678");
    expect(tel.valeur).toBe("+33 6 12 34 56 78");
  });

  it("rogne le telephone a l affichage comme a l href", () => {
    const tel = canaux(fiche({ ...toutPlein, phone: "  +33 6 12 34 56 78  " }))
      .find((x) => x.cle === "telephone")!;
    expect(tel.valeur).toBe("+33 6 12 34 56 78");
    expect(tel.href).toBe("tel:+33612345678");
  });

  it("affiche le nom du service et non l URL entiere", () => {
    const c = canaux(fiche(toutPlein));
    expect(c.find((x) => x.cle === "linkedin")!.valeur).not.toContain("https://");
    expect(c.find((x) => x.cle === "github")!.valeur).not.toContain("https://");
  });

  it("garde l adresse https: des profils telle quelle dans l href", () => {
    const c = canaux(fiche(toutPlein));
    expect(c.find((x) => x.cle === "linkedin")!.href).toBe(toutPlein.linkedinUrl);
    expect(c.find((x) => x.cle === "github")!.href).toBe(toutPlein.githubUrl);
  });

  it("rend une cle de libelle par canal, jamais un libelle resolu", () => {
    const c = canaux(fiche(toutPlein));
    expect(c.map((x) => x.cleLibelle)).toEqual([
      "contact.email", "contact.phone", "contact.linkedin", "contact.github",
    ]);
  });
});
