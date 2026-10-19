import { describe, it, expect } from "vitest";
import {
  prochainIndex, estEnButee, creerAccumulateur, indexDepuisFragment,
  normaliserDelta, LIGNE_PX, SEUIL_MOLETTE, FENETRE_MOLETTE,
} from "./pagination";

describe("prochainIndex (spec section 2.3)", () => {
  it("ne bouge pas tant que la section n est pas en butee", () => {
    expect(prochainIndex(2, 9, 1, false)).toBe(2);
    expect(prochainIndex(2, 9, -1, false)).toBe(2);
  });

  it("avance d un cran en butee", () => {
    expect(prochainIndex(2, 9, 1, true)).toBe(3);
  });

  it("recule d un cran en butee", () => {
    expect(prochainIndex(2, 9, -1, true)).toBe(1);
  });

  it("ne depasse pas la derniere section et ne rebondit pas", () => {
    expect(prochainIndex(8, 9, 1, true)).toBe(8);
  });

  it("ne depasse pas la premiere section et ne rebondit pas", () => {
    expect(prochainIndex(0, 9, -1, true)).toBe(0);
  });

  // Point de vigilance 1 : une seule section active.
  it("tient avec une seule section, dans les deux directions", () => {
    expect(prochainIndex(0, 1, 1, true)).toBe(0);
    expect(prochainIndex(0, 1, -1, true)).toBe(0);
  });
});

describe("estEnButee (spec section 2.3)", () => {
  it("vers le bas : vrai au bas du defilement", () => {
    expect(estEnButee({ scrollTop: 400, scrollHeight: 1000, clientHeight: 600 }, 1)).toBe(true);
  });

  it("vers le bas : faux au milieu", () => {
    expect(estEnButee({ scrollTop: 200, scrollHeight: 1000, clientHeight: 600 }, 1)).toBe(false);
  });

  it("vers le haut : vrai en haut", () => {
    expect(estEnButee({ scrollTop: 0, scrollHeight: 1000, clientHeight: 600 }, -1)).toBe(true);
  });

  it("tolere un pixel, pour les rapports de pixels fractionnaires", () => {
    expect(estEnButee({ scrollTop: 399.4, scrollHeight: 1000, clientHeight: 600 }, 1)).toBe(true);
    expect(estEnButee({ scrollTop: 0.8, scrollHeight: 1000, clientHeight: 600 }, -1)).toBe(true);
  });

  // Point de vigilance 3 : une section exactement de la hauteur de l ecran.
  it("une section qui ne defile pas est en butee dans les deux sens", () => {
    const fixe = { scrollTop: 0, scrollHeight: 600, clientHeight: 600 };
    expect(estEnButee(fixe, 1)).toBe(true);
    expect(estEnButee(fixe, -1)).toBe(true);
  });
});

describe("indexDepuisFragment (point de vigilance 4)", () => {
  const ids = ["ouverture", "projets", "contact"];

  it("trouve la section nommee", () => {
    expect(indexDepuisFragment("#projets", ids)).toBe(1);
  });

  it("tolere l absence du diese", () => {
    expect(indexDepuisFragment("projets", ids)).toBe(1);
  });

  it("retombe sur la premiere section si le fragment est vide", () => {
    expect(indexDepuisFragment("", ids)).toBe(0);
    expect(indexDepuisFragment("#", ids)).toBe(0);
  });

  it("retombe sur la premiere section si le fragment est inconnu", () => {
    expect(indexDepuisFragment("#inexistant", ids)).toBe(0);
  });

  // Le coeur du point de vigilance : la section existe dans la spec mais son
  // reglage est eteint, donc elle n'est pas dans `ids`.
  it("retombe sur la premiere section si la section est eteinte", () => {
    expect(indexDepuisFragment("#temoignages", ids)).toBe(0);
  });

  it("rend zero sur une liste vide, sans index negatif", () => {
    expect(indexDepuisFragment("#projets", [])).toBe(0);
  });
});

describe("accumulateur de molette (spec section 2.4)", () => {
  function horloge() {
    let t = 0;
    return { avancer: (ms: number) => (t += ms), lire: () => t };
  }

  it("ne pagine pas sous le seuil", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    expect(a.pousser(SEUIL_MOLETTE - 1)).toBeNull();
  });

  it("pagine vers le bas quand le cumul atteint le seuil", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    a.pousser(SEUIL_MOLETTE / 2);
    expect(a.pousser(SEUIL_MOLETTE / 2)).toBe(1);
  });

  it("pagine vers le haut sur un cumul negatif", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    expect(a.pousser(-SEUIL_MOLETTE)).toBe(-1);
  });

  it("oublie le cumul apres la fenetre de temps", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    a.pousser(SEUIL_MOLETTE - 1);
    h.avancer(FENETRE_MOLETTE + 1);
    expect(a.pousser(1)).toBeNull();
  });

  it("repart de zero apres avoir pagine", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    expect(a.pousser(SEUIL_MOLETTE)).toBe(1);
    expect(a.pousser(SEUIL_MOLETTE - 1)).toBeNull();
  });

  it("change de direction remet le cumul a zero", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    a.pousser(SEUIL_MOLETTE - 1);
    // Sans la garde de signe, le cumul vaudrait -2 et rendrait null.
    expect(a.pousser(-(SEUIL_MOLETTE + 1))).toBe(-1);
  });

  it("un delta nul ne reinitialise pas le cumul en cours", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    a.pousser(SEUIL_MOLETTE / 2 + 20);
    expect(a.pousser(0)).toBeNull();
    expect(a.pousser(10)).toBe(1);
  });

  // Point de vigilance 5 : une rafale de molette.
  it("une rafale de petits crans ne pagine qu une fois par seuil", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    let pages = 0;
    for (let i = 0; i < 30; i++) {
      h.avancer(8);
      if (a.pousser(10) !== null) pages++;
    }
    // 30 crans de 10 px, seuil de 60 : cinq paginations, pas trente.
    expect(pages).toBe(5);
  });
});

describe("normaliserDelta (deltaMode)", () => {
  it("laisse les pixels tels quels (deltaMode 0)", () => {
    expect(normaliserDelta(10, 0)).toBe(10);
  });

  it("convertit les lignes en pixels (deltaMode 1)", () => {
    expect(normaliserDelta(3, 1)).toBe(3 * LIGNE_PX);
  });

  it("convertit les pages en pixels (deltaMode 2)", () => {
    expect(normaliserDelta(2, 2)).toBe(2 * 800);
    expect(normaliserDelta(2, 2, 600)).toBe(2 * 600);
  });

  it("retombe sur les pixels pour un mode inconnu", () => {
    expect(normaliserDelta(5, 7)).toBe(5);
  });

  it("preserve le signe dans les trois modes", () => {
    expect(normaliserDelta(-10, 0)).toBeLessThan(0);
    expect(normaliserDelta(-3, 1)).toBeLessThan(0);
    expect(normaliserDelta(-1, 2)).toBeLessThan(0);
  });
});
