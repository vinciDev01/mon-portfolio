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
