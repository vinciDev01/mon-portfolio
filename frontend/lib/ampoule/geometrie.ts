/**
 * Geometrie du tressage, construite en projection.
 *
 * Le point cardinal de la specification : l'assombrissement des bords du dome
 * ne doit JAMAIS etre simule par un degrade. Il emerge du fait que les
 * meridiens se resserrent en projection (leur pas local suit une loi en
 * cosinus) et donc que la densite de brins opaques augmente vers le bord.
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
 * Identifiant du `<symbol>` qui rasterise la maille filtree (annexe §2.3,
 * `feTurbulence` + `feDisplacementMap`) une seule fois : `maille.tsx`
 * l'utilise pour son propre rendu (le dome visible), `couches-lumiere.tsx`
 * le reutilise pour L6 la moucheture (tache 9) via un second `<use>` :
 * jamais un second filtre, qui doublerait le cout du premier rendu (annexe
 * §8.1). Vit ici plutot que dans `maille.tsx` : ce dernier porte
 * `"use client"`, et un export de fonction « plate » d'un module client ne
 * peut pas etre appele depuis un composant serveur (`Ampoule` et
 * `couches-lumiere.tsx` n'en portent pas) : seuls des composants JSX
 * peuvent traverser cette frontiere. `geometrie.ts` n'a pas cette
 * contrainte.
 */
export function idSymboleMaille(id: string): string {
  return `maille-symbole-${id}`;
}

/**
 * En dessous de deux epaisseurs de brin, deux meridiens voisins se recouvrent :
 * les dessiner separement produit du moire et du crenelage. Au-dela, la
 * specification impose une bande pleine.
 */
export const SEUIL_FUSION_PX = 2 * EPAISSEUR_BRIN;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Pas de projection entre deux meridiens voisins, a l'angle donne. */
export function pasLocal(
  thetaDeg: number,
  pasDeg: number = PAS_ANGULAIRE_DEG,
): number {
  return R * rad(pasDeg) * Math.cos(rad(thetaDeg));
}

/**
 * Demi-largeur au-dela de laquelle deux meridiens voisins se recouvrent, pour
 * un pas angulaire donne. C'est de la que se deduisent les bandes pleines :
 * elles couvrent exactement la zone ou les brins ne sont plus separables.
 */
export function limiteFusion(pasDeg: number = PAS_ANGULAIRE_DEG): number {
  const cosinus = SEUIL_FUSION_PX / (R * rad(pasDeg));
  if (cosinus >= 1) return 0;
  return R * Math.sin(Math.acos(cosinus));
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
      fusionne: Math.abs(pasLocal(t, pasDeg)) < SEUIL_FUSION_PX,
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

/**
 * Nervures de structure : aux tiers du parcours, plus celle qui precede
 * l'ourlet. Exprimees en fraction d'arc et non en indices figes, sinon elles
 * se deplacent des que le cardinal change : a 11 cercles, l'ancien indice 6
 * tombait au milieu du dome au lieu du premier tiers.
 */
function estRenforce(indice: number, nombre: number): boolean {
  return (
    indice === Math.round(nombre / 3) ||
    indice === Math.round((2 * nombre) / 3) ||
    indice === nombre - 1
  );
}

/** Nombre de pas d'integration. 500 suffit : l'ecart a une integration
 *  reparametree exacte reste sous 0,002 px, bien moins que l'epaisseur d'un
 *  brin. Un echantillonnage uniforme s'est revele six fois plus precis qu'un
 *  echantillonnage resserre vers l'apex, a nombre de pas egal. */
const PAS_INTEGRATION = 500;

/**
 * Ordonnee du profil mesuree depuis l'apex, pour t = rx / R dans [0, 1].
 * Superellipse de Lame : (rx/R)^n + (1 - y/H)^n = 1.
 */
export function ordonnee(t: number): number {
  const u = Math.min(Math.max(t, 0), 1);
  return H * (1 - Math.pow(1 - Math.pow(u, EXPOSANT), 1 / EXPOSANT));
}

/**
 * Longueur d'arc du profil, de l'apex a t, par sommation de cordes a pas
 * uniforme.
 *
 * La tangente devient verticale au bord, mais la divergence est integrable
 * (l'exposant vaut -0,615) et l'erreur residuelle reste tres en dessous de la
 * precision utile : inutile de compliquer le schema.
 */
export function longueurArc(t: number, pas = PAS_INTEGRATION): number {
  let total = 0;
  let px = 0;
  let py = ordonnee(0);
  for (let k = 1; k <= pas; k++) {
    const tk = (t * k) / pas;
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

/** Abscisses normalisees des cercles, calculees une fois par cardinal.
 *  L'inversion par dichotomie est chere ; la refaire a chaque rendu
 *  couterait une centaine de millisecondes sur le chemin du premier
 *  affichage. */
const ABSCISSES = new Map<number, number[]>();

function abscisses(nombre: number): number[] {
  const memo = ABSCISSES.get(nombre);
  if (memo) return memo;
  const calcule: number[] = [];
  for (let i = 1; i <= nombre; i++) {
    calcule.push(i === nombre ? 1 : tPourArc((i / nombre) * ARC_TOTAL));
  }
  ABSCISSES.set(nombre, calcule);
  return calcule;
}

/**
 * Les 18 cercles, a pas d'arc CONSTANT, et non a pas vertical constant.
 *
 * Chaque cercle est place en inversant la longueur d'arc par dichotomie :
 * le cercle i est a l'abscisse curviligne i * ARC_TOTAL / 18. C'est ce qui
 * produit le resserrement au sommet, ou les premiers cercles se chevauchent
 * en projection : la specification impose de les remplacer par une calotte
 * pleine au rendu.
 */
export function cercles(nombre = 18): Cercle[] {
  return abscisses(nombre).map((t, k) => {
    const indice = k + 1;
    const rx = R * t;
    return {
      indice,
      rx,
      ry: rx * INCLINAISON,
      cy: APEX_Y + ordonnee(t),
      epaisseur:
        indice === nombre ? 2.4 : estRenforce(indice, nombre) ? 2.2 : 0.9,
    };
  });
}
