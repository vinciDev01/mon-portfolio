import { describe, it, expect } from "vitest";
import { angleVers, sommetsFaisceau, formaterSommets } from "./geometry";

const VIEWPORT = { width: 1440, height: 900 };
const PIVOT = { x: 1400, y: 450 };

describe("angleVers", () => {
  it("pointe vers la gauche quand la cible est a gauche", () => {
    expect(angleVers(PIVOT, { x: 200, y: 450 })).toBeCloseTo(Math.PI, 5);
  });

  it("pointe vers le haut quand la cible est au-dessus", () => {
    expect(angleVers(PIVOT, { x: 1400, y: 0 })).toBeCloseTo(-Math.PI / 2, 5);
  });

  it("pointe vers le bas quand la cible est en dessous", () => {
    expect(angleVers(PIVOT, { x: 1400, y: 900 })).toBeCloseTo(Math.PI / 2, 5);
  });

  it("renvoie un angle fini quand la cible est confondue avec le pivot", () => {
    expect(Number.isFinite(angleVers(PIVOT, PIVOT))).toBe(true);
  });
});

describe("sommetsFaisceau", () => {
  const phi = (28 / 2) * (Math.PI / 180);
  const tete = Math.PI;

  function sommets(angleTete = tete) {
    return sommetsFaisceau(
      PIVOT, angleTete, angleTete - phi, angleTete + phi, 40, 26, VIEWPORT,
    );
  }

  it("renvoie exactement quatre sommets", () => {
    expect(sommets()).toHaveLength(4);
  });

  it("projette les bords au-dela de la diagonale du viewport", () => {
    const [, C, D] = sommets();
    const diagonale = Math.hypot(VIEWPORT.width, VIEWPORT.height);
    expect(Math.hypot(C.x - PIVOT.x, C.y - PIVOT.y)).toBeGreaterThan(diagonale);
    expect(Math.hypot(D.x - PIVOT.x, D.y - PIVOT.y)).toBeGreaterThan(diagonale);
  });

  it("separe les deux bords de l ouverture de la tete", () => {
    const [A, , , B] = sommets();
    expect(Math.hypot(A.x - B.x, A.y - B.y)).toBeCloseTo(52, 5);
  });

  it("place l ouverture devant le pivot, pas dessus", () => {
    const [A, , , B] = sommets();
    const milieu = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
    expect(Math.hypot(milieu.x - PIVOT.x, milieu.y - PIVOT.y)).toBeCloseTo(40, 5);
    // tete pointant vers la gauche : l'ouverture est a gauche du pivot
    expect(milieu.x).toBeLessThan(PIVOT.x);
  });

  it("produit un quadrilatere simple, sans croisement", () => {
    const [A, C, D, B] = sommets();
    expect(segmentsSeCroisent(A, C, D, B)).toBe(false);
  });

  it("suit la tete quand elle pivote vers le haut", () => {
    // Convention (confirmee par les tests angleVers) : -PI/2 pointe vers le
    // haut, +PI/2 vers le bas. Au repos la tete pointe vers la gauche (PI).
    // En partant de PI et en augmentant l'angle, on se rapproche de -PI/2
    // (= 3*PI/2 modulo 2*PI), donc du "haut" ; en le diminuant, on se
    // rapproche de +PI/2, donc du "bas".
    const haut = sommets(Math.PI + 0.4);
    const bas = sommets(Math.PI - 0.4);
    expect(haut[1].y).toBeLessThan(bas[1].y);
  });

  it("renvoie des coordonnees finies pour tout angle", () => {
    for (let a = -Math.PI; a <= Math.PI; a += Math.PI / 8) {
      for (const p of sommets(a)) {
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
      }
    }
  });
});

describe("formaterSommets", () => {
  it("produit la chaine attendue par l attribut points", () => {
    const s = formaterSommets([
      { x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }, { x: 7, y: 8 },
    ]);
    expect(s).toBe("1,2 3,4 5,6 7,8");
  });

  it("arrondit au dixieme pour limiter la taille de l attribut", () => {
    const s = formaterSommets([
      { x: 1.23456, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }, { x: 7, y: 8 },
    ]);
    expect(s.startsWith("1.2,2 ")).toBe(true);
  });
});

/** Test d'intersection de segments, utilise pour verifier la simplicite du quadrilatere. */
function segmentsSeCroisent(
  p1: { x: number; y: number }, p2: { x: number; y: number },
  p3: { x: number; y: number }, p4: { x: number; y: number },
): boolean {
  const d = (a: typeof p1, b: typeof p1, c: typeof p1) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2);
  const d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}

// --- Imperfections de la lumiere -------------------------------------------

import { couchesPenombre, bandesRetombee } from "./geometry";

const PHI = (28 / 2) * (Math.PI / 180);
const TETE = Math.PI;

function coeur() {
  return sommetsFaisceau(PIVOT, TETE, TETE - PHI, TETE + PHI, 70, 42, VIEWPORT);
}

/**
 * Ouverture angulaire vue depuis le pivot, entre les deux sommets lointains.
 * L'ecart est replie dans (-pi, pi] : sans cela, un faisceau pointant vers la
 * gauche (angle proche de +/-pi) verrait ses deux bords tomber de part et
 * d'autre de la coupure d'atan2, et la mesure renverrait l'angle reflexe.
 */
function ouverture(couche: { x: number; y: number }[]) {
  const [, C, D] = couche;
  const aC = Math.atan2(C.y - PIVOT.y, C.x - PIVOT.x);
  const aD = Math.atan2(D.y - PIVOT.y, D.x - PIVOT.x);
  let d = (aD - aC) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d <= -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

describe("couchesPenombre", () => {
  const ECART = 0.4 * (Math.PI / 180);

  function couches(n = 3) {
    return couchesPenombre(
      PIVOT, TETE, TETE - PHI, TETE + PHI, 70, 42, VIEWPORT, n, ECART,
    );
  }

  it("renvoie autant de couches que demande", () => {
    expect(couches(3)).toHaveLength(3);
    expect(couches(1)).toHaveLength(1);
  });

  it("place le coeur en premiere couche, identique au faisceau nu", () => {
    expect(couches()[0]).toEqual(coeur());
  });

  it("elargit strictement chaque couche successive", () => {
    const cs = couches(4);
    for (let i = 1; i < cs.length; i++) {
      expect(ouverture(cs[i])).toBeGreaterThan(ouverture(cs[i - 1]));
    }
  });

  it("elargit des deux cotes, pas d un seul", () => {
    const [coeurC, penombre] = couches(2);
    // le bord meneur s'ecarte d'un cote, le suiveur de l'autre
    const dMeneur = Math.atan2(penombre[1].y - PIVOT.y, penombre[1].x - PIVOT.x)
      - Math.atan2(coeurC[1].y - PIVOT.y, coeurC[1].x - PIVOT.x);
    const dSuiveur = Math.atan2(penombre[2].y - PIVOT.y, penombre[2].x - PIVOT.x)
      - Math.atan2(coeurC[2].y - PIVOT.y, coeurC[2].x - PIVOT.x);
    expect(Math.sign(dMeneur)).toBe(-Math.sign(dSuiveur));
    expect(Math.abs(dMeneur)).toBeCloseTo(ECART, 6);
    expect(Math.abs(dSuiveur)).toBeCloseTo(ECART, 6);
  });

  it("garde l ouverture de la tete commune a toutes les couches", () => {
    const cs = couches(3);
    for (const c of cs) {
      expect(c[0]).toEqual(cs[0][0]);
      expect(c[3]).toEqual(cs[0][3]);
    }
  });

  it("renvoie des coordonnees finies pour tout angle", () => {
    for (let a = -Math.PI; a <= Math.PI; a += Math.PI / 8) {
      const cs = couchesPenombre(PIVOT, a, a - PHI, a + PHI, 70, 42, VIEWPORT, 3, ECART);
      for (const couche of cs) {
        for (const p of couche) {
          expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
        }
      }
    }
  });

  it("refuse un nombre de couches inferieur a un", () => {
    expect(() => couches(0)).toThrow();
  });
});

describe("bandesRetombee", () => {
  it("renvoie autant de bandes que demande", () => {
    expect(bandesRetombee(coeur(), 3)).toHaveLength(3);
  });

  it("rend le trapeze intact quand on ne demande qu une bande", () => {
    expect(bandesRetombee(coeur(), 1)[0]).toEqual(coeur());
  });

  it("fait partir la premiere bande de l ouverture de la tete", () => {
    const [A, , , B] = coeur();
    const premiere = bandesRetombee(coeur(), 3)[0];
    expect(premiere[0]).toEqual(A);
    expect(premiere[3]).toEqual(B);
  });

  it("fait finir la derniere bande sur le bord lointain", () => {
    const [, C, D] = coeur();
    const bandes = bandesRetombee(coeur(), 3);
    const derniere = bandes[bandes.length - 1];
    expect(derniere[1].x).toBeCloseTo(C.x, 6);
    expect(derniere[1].y).toBeCloseTo(C.y, 6);
    expect(derniere[2].x).toBeCloseTo(D.x, 6);
    expect(derniere[2].y).toBeCloseTo(D.y, 6);
  });

  it("colle les bandes bout a bout, sans trou ni recouvrement", () => {
    const bandes = bandesRetombee(coeur(), 4);
    for (let i = 1; i < bandes.length; i++) {
      expect(bandes[i][0].x).toBeCloseTo(bandes[i - 1][1].x, 6);
      expect(bandes[i][0].y).toBeCloseTo(bandes[i - 1][1].y, 6);
      expect(bandes[i][3].x).toBeCloseTo(bandes[i - 1][2].x, 6);
      expect(bandes[i][3].y).toBeCloseTo(bandes[i - 1][2].y, 6);
    }
  });

  it("refuse un nombre de bandes inferieur a un", () => {
    expect(() => bandesRetombee(coeur(), 0)).toThrow();
  });
});
