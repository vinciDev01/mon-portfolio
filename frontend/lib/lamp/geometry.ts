export type Point = { x: number; y: number };
export type Viewport = { width: number; height: number };

/** Marge appliquee a la diagonale pour garantir que le faisceau sort du cadre. */
const FACTEUR_PORTEE = 1.2;

/**
 * Angle en radians du pivot vers la cible, en coordonnees ecran (y vers le bas).
 * Renvoie Math.PI quand la cible est confondue avec le pivot : la lampe garde
 * alors son orientation neutre vers la gauche plutot que de produire NaN.
 */
export function angleVers(pivot: Point, cible: Point): number {
  const dx = cible.x - pivot.x;
  const dy = cible.y - pivot.y;
  if (dx === 0 && dy === 0) return Math.PI;
  return Math.atan2(dy, dx);
}

/**
 * Les quatre sommets du trapeze lumineux, dans l'ordre A, C, D, B :
 *   A -> C  bord meneur
 *   C -> D  bord lointain, hors cadre
 *   D -> B  bord suiveur
 *   B -> A  ouverture de la tete
 *
 * Les bords meneur et suiveur ont leur propre angle : c'est ce qui permet au
 * trapeze de changer de forme pendant une transition au lieu de se translater.
 */
export function sommetsFaisceau(
  pivot: Point,
  angleTete: number,
  angleMeneur: number,
  angleSuiveur: number,
  longueurTete: number,
  rayonOuverture: number,
  viewport: Viewport,
): [Point, Point, Point, Point] {
  const portee = Math.hypot(viewport.width, viewport.height) * FACTEUR_PORTEE;

  // Centre de l'ouverture, avance de `longueurTete` dans l'axe de la tete.
  const centre: Point = {
    x: pivot.x + Math.cos(angleTete) * longueurTete,
    y: pivot.y + Math.sin(angleTete) * longueurTete,
  };

  // Normale a l'axe de la tete, orientee du cote du bord meneur.
  const nx = Math.sin(angleTete);
  const ny = -Math.cos(angleTete);

  const A: Point = { x: centre.x + nx * rayonOuverture, y: centre.y + ny * rayonOuverture };
  const B: Point = { x: centre.x - nx * rayonOuverture, y: centre.y - ny * rayonOuverture };

  const C: Point = {
    x: pivot.x + Math.cos(angleMeneur) * portee,
    y: pivot.y + Math.sin(angleMeneur) * portee,
  };
  const D: Point = {
    x: pivot.x + Math.cos(angleSuiveur) * portee,
    y: pivot.y + Math.sin(angleSuiveur) * portee,
  };

  return [A, C, D, B];
}

/** Serialise les sommets pour l'attribut `points` d'un <polygon>. */
export function formaterSommets(sommets: readonly Point[]): string {
  return sommets
    .map((p) => `${Math.round(p.x * 10) / 10},${Math.round(p.y * 10) / 10}`)
    .join(" ");
}

/**
 * Couches de penombre du faisceau, du coeur vers l'exterieur.
 *
 * La premiere couche est le faisceau nu ; chaque couche suivante ecarte ses
 * deux bords lointains de `ecartRadians` supplementaires, sans toucher a
 * l'ouverture de la tete. Superposees a faible opacite decroissante, elles
 * produisent la penombre d'une source non ponctuelle : le bord reste franc,
 * mais il cesse d'etre une decoupe parfaite.
 *
 * Le trou du scrim, lui, n'utilise jamais ces couches : il reste un polygone
 * unique et net, pour que la revelation du texte et son contraste ne dependent
 * pas d'un empilement d'opacites.
 */
export function couchesPenombre(
  pivot: Point,
  angleTete: number,
  angleMeneur: number,
  angleSuiveur: number,
  longueurTete: number,
  rayonOuverture: number,
  viewport: Viewport,
  nombreCouches: number,
  ecartRadians: number,
): Array<[Point, Point, Point, Point]> {
  if (nombreCouches < 1) {
    throw new Error("couchesPenombre : il faut au moins une couche");
  }
  return Array.from({ length: nombreCouches }, (_, i) =>
    sommetsFaisceau(
      pivot,
      angleTete,
      angleMeneur - i * ecartRadians,
      angleSuiveur + i * ecartRadians,
      longueurTete,
      rayonOuverture,
      viewport,
    ),
  );
}

/**
 * Decoupe le trapeze en bandes successives le long de son axe, de l'ouverture
 * de la tete vers le lointain. Peintes a opacite decroissante, elles simulent
 * la retombee de l'intensite avec la distance.
 *
 * C'est une approximation en escalier, assumee : la charte du projet interdit
 * les degrades. Aux opacites visees les marches restent sous le seuil de
 * perception ; si un banding apparaissait, la parade est de reduire a une
 * seule bande plutot que d'introduire un degrade.
 */
export function bandesRetombee(
  sommets: readonly [Point, Point, Point, Point],
  nombreBandes: number,
): Array<[Point, Point, Point, Point]> {
  if (nombreBandes < 1) {
    throw new Error("bandesRetombee : il faut au moins une bande");
  }
  const [A, C, D, B] = sommets;
  const entre = (p: Point, q: Point, t: number): Point => ({
    x: p.x + (q.x - p.x) * t,
    y: p.y + (q.y - p.y) * t,
  });

  return Array.from({ length: nombreBandes }, (_, i) => {
    const t0 = i / nombreBandes;
    const t1 = (i + 1) / nombreBandes;
    return [
      i === 0 ? A : entre(A, C, t0),
      entre(A, C, t1),
      entre(B, D, t1),
      i === 0 ? B : entre(B, D, t0),
    ] as [Point, Point, Point, Point];
  });
}
