import { describe, it, expect } from "vitest";
import { pasRessort, estImmobile, differenceAngulaire, DT_MAX } from "./spring";

const OMEGA = 9;
const ZETA = 0.9;
const DT = 1 / 60;

/** Fait tourner le ressort et renvoie la trace complete des valeurs. */
function simuler(cible: number, pas: number, dt = DT) {
  let etat = { valeur: 0, vitesse: 0 };
  const trace = [etat.valeur];
  for (let i = 0; i < pas; i++) {
    etat = pasRessort(etat, cible, OMEGA, ZETA, dt);
    trace.push(etat.valeur);
  }
  return { etat, trace };
}

describe("pasRessort", () => {
  it("converge vers la cible en moins d une seconde", () => {
    const { etat } = simuler(1, 60);
    expect(etat.valeur).toBeCloseTo(1, 2);
  });

  it("ne depasse pas la cible de plus de 2 pour cent", () => {
    const { trace } = simuler(1, 240);
    expect(Math.max(...trace)).toBeLessThan(1.02);
  });

  it("accelere au demarrage plutot que de bondir", () => {
    const { trace } = simuler(1, 240);
    // le premier pas ne couvre qu'une fraction infime du trajet
    expect(trace[1]).toBeLessThan(0.05);
    // et le mouvement s'amplifie ensuite
    expect(trace[2] - trace[1]).toBeGreaterThan(trace[1] - trace[0]);
  });

  it("reste stable quand l onglet a ete masque longtemps", () => {
    // dt de 5 secondes : sans bornage, l integration explose
    let etat = { valeur: 0, vitesse: 0 };
    etat = pasRessort(etat, 1, OMEGA, ZETA, 5);
    expect(Number.isFinite(etat.valeur)).toBe(true);
    expect(Math.abs(etat.valeur)).toBeLessThan(2);
  });

  it("borne le pas de temps a DT_MAX", () => {
    const grand = pasRessort({ valeur: 0, vitesse: 0 }, 1, OMEGA, ZETA, 10);
    const borne = pasRessort({ valeur: 0, vitesse: 0 }, 1, OMEGA, ZETA, DT_MAX);
    expect(grand.valeur).toBeCloseTo(borne.valeur, 10);
  });

  it("ne bouge pas quand il est deja sur sa cible", () => {
    const etat = pasRessort({ valeur: 1, vitesse: 0 }, 1, OMEGA, ZETA, DT);
    expect(etat.valeur).toBeCloseTo(1, 10);
    expect(etat.vitesse).toBeCloseTo(0, 10);
  });
});

describe("estImmobile", () => {
  it("est faux tant que le ressort voyage", () => {
    expect(estImmobile({ valeur: 0, vitesse: 0 }, 1)).toBe(false);
  });

  it("devient vrai apres convergence", () => {
    const { etat } = simuler(1, 300);
    expect(estImmobile(etat, 1)).toBe(true);
  });

  it("est faux si la valeur est arrivee mais que la vitesse subsiste", () => {
    expect(estImmobile({ valeur: 1, vitesse: 0.5 }, 1)).toBe(false);
  });
});

describe("differenceAngulaire", () => {
  it("prend le chemin court au passage de pi", () => {
    expect(differenceAngulaire(3.0, -3.0)).toBeCloseTo(0.2832, 3);
  });

  it("prend le chemin court dans l autre sens", () => {
    expect(differenceAngulaire(-3.0, 3.0)).toBeCloseTo(-0.2832, 3);
  });

  it("renvoie une difference simple loin des bords", () => {
    expect(differenceAngulaire(0.5, 1.0)).toBeCloseTo(0.5, 10);
  });

  it("ne renvoie jamais plus d un demi-tour", () => {
    for (let a = -Math.PI; a <= Math.PI; a += 0.3) {
      for (let b = -Math.PI; b <= Math.PI; b += 0.3) {
        expect(Math.abs(differenceAngulaire(a, b))).toBeLessThanOrEqual(Math.PI + 1e-9);
      }
    }
  });
});
