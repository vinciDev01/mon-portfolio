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

/** Exposant de la superellipse de Lame qui donne le galbe du dome. */
const EXPOSANT = 2.6;
/** Rapport ry/rx de l'ellipse de bord : angle de vue de 8,2 degres sous le plan. */
const INCLINAISON = 12 / 84;
const RENFORCES = new Set([6, 12, 17]);
/** Nombre de pas d'integration. 1000 suffit : l'ecart a une integration fine
 *  reste sous 0,002 px, soit bien moins que l'epaisseur d'un brin. */
const PAS_INTEGRATION = 1000;

/**
 * Ordonnee du profil mesuree depuis l'apex, pour t = rx / R dans [0, 1].
 * Superellipse de Lame : (rx/R)^n + (1 - y/H)^n = 1.
 */
export function ordonnee(t: number): number {
  const u = Math.min(Math.max(t, 0), 1);
  return H * (1 - Math.pow(1 - Math.pow(u, EXPOSANT), 1 / EXPOSANT));
}

/**
 * Longueur d'arc du profil, de l'apex a t.
 *
 * L'echantillonnage est cubique et non uniforme : pres du bord la tangente
 * devient verticale, et un pas uniforme sous-estimerait la longueur la ou la
 * courbe s'allonge le plus.
 */
export function longueurArc(t: number, pas = PAS_INTEGRATION): number {
  let total = 0;
  let px = 0;
  let py = ordonnee(0);
  for (let k = 1; k <= pas; k++) {
    const tk = t * Math.pow(k / pas, 3);
    const x = R * tk;
    const y = ordonnee(tk);
    total += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return total;
}

/** Longueur d'arc du demi-profil, de l'apex au bord. Vaut 133,50 px. */
const ARC_TOTAL = longueurArc(1);

/**
 * Les 18 cercles, a pas d'arc CONSTANT — et non a pas vertical constant.
 *
 * Chaque cercle est place en inversant la longueur d'arc par dichotomie :
 * le cercle i est a l'abscisse curviligne i * ARC_TOTAL / 18. C'est ce qui
 * produit le resserrement au sommet, ou les premiers cercles se chevauchent
 * en projection — la specification impose de les remplacer par une calotte
 * pleine au rendu.
 */
export function cercles(nombre = 18): Cercle[] {
  const sortie: Cercle[] = [];
  for (let i = 1; i <= nombre; i++) {
    const t = i === nombre ? 1 : tPourArc((i / nombre) * ARC_TOTAL);
    const rx = R * t;
    sortie.push({
      indice: i,
      rx,
      ry: rx * INCLINAISON,
      cy: APEX_Y + ordonnee(t),
      epaisseur: i === nombre ? 2.4 : RENFORCES.has(i) ? 2.2 : 0.9,
    });
  }
  return sortie;
}

/** Inverse `longueurArc` par dichotomie. 40 passes suffisent largement. */
function tPourArc(cible: number): number {
  let bas = 0;
  let haut = 1;
  for (let i = 0; i < 40; i++) {
    const milieu = (bas + haut) / 2;
    if (longueurArc(milieu) < cible) bas = milieu;
    else haut = milieu;
  }
  return (bas + haut) / 2;
}
