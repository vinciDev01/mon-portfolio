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
