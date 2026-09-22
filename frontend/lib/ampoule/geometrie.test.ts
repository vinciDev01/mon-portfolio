import { describe, it, expect } from "vitest";
import {
  CENTRE_X,
  EPAISSEUR_BRIN,
  R,
  SEUIL_FUSION_PX,
  cercles,
  meridiens,
  pasLocal,
  xProjete,
} from "./geometrie";

describe("pasLocal", () => {
  it("vaut 7,33 px au centre du dome", () => {
    expect(pasLocal(0)).toBeCloseTo(7.33, 2);
  });

  it("suit la loi en cosinus, verifiee sur la table de controle", () => {
    expect(pasLocal(45)).toBeCloseTo(5.18, 2);
    expect(pasLocal(70)).toBeCloseTo(2.51, 2);
    expect(pasLocal(80)).toBeCloseTo(1.27, 2);
  });

  it("decroit strictement du centre vers le bord", () => {
    for (let t = 0; t < 85; t += 5) {
      expect(pasLocal(t + 5)).toBeLessThan(pasLocal(t));
    }
  });

  it("s annule au bord exact", () => {
    expect(pasLocal(90)).toBeCloseTo(0, 6);
  });
});

describe("xProjete", () => {
  it("place le meridien central sur l axe de symetrie", () => {
    expect(xProjete(0)).toBe(CENTRE_X);
  });

  it("respecte la table de controle", () => {
    expect(xProjete(30)).toBeCloseTo(130.0, 1);
    expect(xProjete(60)).toBeCloseTo(160.746, 2);
    expect(xProjete(75)).toBeCloseTo(169.138, 2);
  });

  it("est symetrique autour de l axe", () => {
    for (const t of [15, 45, 75]) {
      expect(xProjete(t) - CENTRE_X).toBeCloseTo(CENTRE_X - xProjete(-t), 6);
    }
  });

  it("atteint le bord du dome a 90 degres", () => {
    expect(xProjete(90)).toBeCloseTo(CENTRE_X + R, 6);
  });
});

describe("meridiens", () => {
  it("en rend 37 sur la face avant, au pas de 5 degres", () => {
    expect(meridiens()).toHaveLength(37);
  });

  it("en rend 19 au pas degrade de 10 degres", () => {
    expect(meridiens(10)).toHaveLength(19);
  });

  it("marque comme fusionnes ceux dont le pas passe sous deux epaisseurs", () => {
    const m = meridiens();
    const premierFusionne = m.find((x) => x.fusionne && x.theta > 0);
    expect(premierFusionne?.theta).toBe(75);
    expect(m.find((x) => x.theta === 70)?.fusionne).toBe(false);
  });

  it("place le seuil de fusion a 79,4 px de l axe", () => {
    const limite = R * Math.sin(Math.acos(SEUIL_FUSION_PX / (R * (Math.PI / 36))));
    expect(limite).toBeCloseTo(79.4, 1);
  });

  it("donne une echelle horizontale egale au sinus de l angle", () => {
    const m = meridiens();
    const a30 = m.find((x) => x.theta === 30);
    expect(a30?.echelle).toBeCloseTo(0.5, 6);
  });

  it("n a jamais deux meridiens au meme angle", () => {
    const angles = meridiens().map((m) => m.theta);
    expect(new Set(angles).size).toBe(angles.length);
  });

  it("garde le seuil de fusion egal au double de l epaisseur de brin", () => {
    expect(SEUIL_FUSION_PX).toBeCloseTo(2 * EPAISSEUR_BRIN, 6);
  });
});

describe("cercles", () => {
  it("en rend 18 du sommet a l ourlet", () => {
    expect(cercles()).toHaveLength(18);
  });

  it("termine exactement sur l ellipse de bord", () => {
    const dernier = cercles()[17];
    expect(dernier.rx).toBeCloseTo(84, 1);
    expect(dernier.ry).toBeCloseTo(12, 1);
    expect(dernier.cy).toBeCloseTo(256, 1);
  });

  it("garde un pas d arc constant de 7,42 px", () => {
    expect(133.5 / 18).toBeCloseTo(7.42, 2);
  });

  it("elargit strictement chaque cercle vers le bas", () => {
    const c = cercles();
    for (let i = 1; i < c.length; i++) {
      expect(c[i].rx).toBeGreaterThan(c[i - 1].rx);
      expect(c[i].cy).toBeGreaterThan(c[i - 1].cy);
    }
  });

  it("renforce les cercles de structure C6, C12 et C17", () => {
    const c = cercles();
    for (const i of [6, 12, 17]) {
      expect(c[i - 1].epaisseur).toBeCloseTo(2.2, 2);
    }
    expect(c[0].epaisseur).toBeCloseTo(0.9, 2);
  });

  it("donne a l ourlet sa sur-epaisseur", () => {
    expect(cercles()[17].epaisseur).toBeCloseTo(2.4, 2);
  });

  it("garde toutes ses coordonnees finies", () => {
    for (const c of cercles()) {
      expect(Number.isFinite(c.rx) && Number.isFinite(c.ry) && Number.isFinite(c.cy)).toBe(true);
    }
  });
});
