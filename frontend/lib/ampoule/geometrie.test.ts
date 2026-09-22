import { describe, it, expect } from "vitest";
import {
  APEX_Y,
  CENTRE_X,
  EPAISSEUR_BRIN,
  H,
  R,
  SEUIL_FUSION_PX,
  cercles,
  limiteFusion,
  longueurArc,
  meridiens,
  ordonnee,
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

  it("calcule la fusion avec son propre pas et non celui par defaut", () => {
    const fusionnes = (pas?: number) =>
      meridiens(pas).filter((m) => m.fusionne).map((m) => m.theta);
    expect(fusionnes()).toEqual([-90, -85, -80, -75, 75, 80, 85, 90]);
    expect(fusionnes(10)).toEqual([-90, 90]);
  });

  it("situe la limite de fusion selon le pas angulaire", () => {
    expect(limiteFusion(5)).toBeCloseTo(79.37, 2);
    expect(limiteFusion(10)).toBeCloseTo(82.87, 2);
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

  it("retrouve la longueur d arc du demi-profil", () => {
    expect(longueurArc(1)).toBeCloseTo(133.5, 1);
  });

  it("place chaque cercle a pas d arc constant", () => {
    const pas = longueurArc(1) / 18;
    cercles().forEach((c, k) => {
      expect(longueurArc(c.rx / R)).toBeCloseTo((k + 1) * pas, 1);
    });
  });

  it("garde tous ses cercles sur la superellipse de Lame", () => {
    for (const c of cercles()) {
      const gauche =
        Math.pow(c.rx / R, 2.6) + Math.pow(1 - (c.cy - APEX_Y) / H, 2.6);
      expect(gauche).toBeCloseTo(1, 3);
    }
  });

  it("respecte la table de controle des cotes", () => {
    const c = cercles();
    expect(c[0].rx).toBeCloseTo(7.416, 2);
    expect(c[0].cy).toBeCloseTo(178.055, 2);
    expect(c[5].rx).toBeCloseTo(43.856, 2);
    expect(c[5].cy).toBeCloseTo(183.887, 2);
    expect(c[11].rx).toBeCloseTo(76.414, 2);
    expect(c[11].cy).toBeCloseTo(212.573, 2);
    expect(c[17].rx).toBeCloseTo(84, 6);
    expect(c[17].cy).toBeCloseTo(256, 6);
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

  it("place les nervures aux memes fractions quel que soit le cardinal", () => {
    const renforces = (n: number) =>
      cercles(n).filter((c) => c.epaisseur === 2.2).map((c) => c.indice);
    expect(renforces(18)).toEqual([6, 12, 17]);
    expect(renforces(11)).toEqual([4, 7, 10]);
  });

  it("donne a l ourlet sa sur-epaisseur", () => {
    expect(cercles()[17].epaisseur).toBeCloseTo(2.4, 2);
  });

  it("garde toutes ses coordonnees finies", () => {
    for (const c of cercles()) {
      expect(Number.isFinite(c.rx) && Number.isFinite(c.ry) && Number.isFinite(c.cy)).toBe(true);
    }
  });

  it("rend des objets neufs a chaque appel malgre la memoisation", () => {
    const a = cercles();
    const b = cercles();
    expect(a).not.toBe(b);
    expect(a[0]).not.toBe(b[0]);
    a[0].rx = -1;
    expect(cercles()[0].rx).toBeCloseTo(7.416, 2);
  });
});
