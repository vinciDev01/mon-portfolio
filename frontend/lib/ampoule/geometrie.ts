/**
 * Geometrie du tressage, construite en projection.
 *
 * Le point cardinal de la specification : l'assombrissement des bords du dome
 * ne doit JAMAIS etre simule par un degrade. Il emerge du fait que les
 * meridiens se resserrent en projection — leur pas local suit une loi en
 * cosinus — et donc que la densite de brins opaques augmente vers le bord.
 * Peindre la lueur SOUS la maille et la maille par-dessus suffit : le rapport
 * de transmission 0,484 au centre contre 0,145 au bord se produit tout seul.
 */

/** Demi-largeur du dome, en unites SVG. */
export const R = 84;
/** Hauteur du dome. */
export const H = 78;
/** Axe de symetrie. Le demi-profil gauche en est la symetrie exacte. */
export const CENTRE_X = 88;
export const APEX_Y = 178;
export const BORD_Y = 256;

export const EPAISSEUR_BRIN = 1.2;
export const PAS_ANGULAIRE_DEG = 5;

/**
 * En dessous de deux epaisseurs de brin, deux meridiens voisins se recouvrent :
 * les dessiner separement produit du moire et du crenelage. Au-dela, la
 * specification impose une bande pleine.
 */
export const SEUIL_FUSION_PX = 2 * EPAISSEUR_BRIN;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Pas de projection entre deux meridiens voisins, a l'angle donne. */
export function pasLocal(thetaDeg: number): number {
  return R * rad(PAS_ANGULAIRE_DEG) * Math.cos(rad(thetaDeg));
}

/** Abscisse projetee d'un meridien. */
export function xProjete(thetaDeg: number): number {
  return CENTRE_X + R * Math.sin(rad(thetaDeg));
}

export type Meridien = {
  theta: number;
  x: number;
  /** Facteur d'echelle horizontale a appliquer au demi-profil. */
  echelle: number;
  /** Vrai quand le pas local passe sous le seuil : a remplacer par une bande. */
  fusionne: boolean;
};

export function meridiens(pasDeg: number = PAS_ANGULAIRE_DEG): Meridien[] {
  const sortie: Meridien[] = [];
  for (let theta = -90; theta <= 90 + 1e-9; theta += pasDeg) {
    const t = Math.round(theta * 1e6) / 1e6;
    sortie.push({
      theta: t,
      x: xProjete(t),
      echelle: Math.sin(rad(t)),
      fusionne: Math.abs(pasLocal(t)) < SEUIL_FUSION_PX,
    });
  }
  return sortie;
}

export type Cercle = {
  indice: number;
  rx: number;
  ry: number;
  cy: number;
  epaisseur: number;
};

/** Longueur d'arc du demi-profil, de l'apex au bord. */
const ARC_TOTAL = 133.5;
/** Rapport ry/rx de l'ellipse de bord : angle de vue de 8,2 degres sous le plan. */
const INCLINAISON = 12 / 84;
const RENFORCES = new Set([6, 12, 17]);

/**
 * Les 18 cercles, a pas d'arc CONSTANT — et non a pas vertical constant.
 * C'est ce qui produit le resserrement visible au sommet : les quatre
 * premiers cercles se chevauchent en projection, et la specification impose
 * de les remplacer par une calotte pleine au rendu.
 */
export function cercles(nombre = 18): Cercle[] {
  const sortie: Cercle[] = [];
  for (let i = 1; i <= nombre; i++) {
    const s = (i / nombre) * ARC_TOTAL;
    // Parametre normalise le long du profil, de l'apex (0) au bord (1).
    const u = s / ARC_TOTAL;
    // Superellipse de Lame : x = R * u^(1/n) approche le profil a 0,9 px pres
    // sur la plage utile, ce qui suffit pour positionner des cercles.
    const rx = R * Math.pow(u, 1 / 2.6);
    sortie.push({
      indice: i,
      rx,
      ry: rx * INCLINAISON,
      cy: APEX_Y + H * Math.pow(u, 2.6),
      epaisseur: i === nombre ? 2.4 : RENFORCES.has(i) ? 2.2 : 0.9,
    });
  }
  return sortie;
}
