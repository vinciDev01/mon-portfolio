/**
 * L'arche du portrait, tracee a la main : en coordonnees de boite (0 a 1),
 * pour servir de gabarit `objectBoundingBox` a toutes les tailles du
 * medaillon. Le haut est un demi-cercle (rayon : la demi-largeur, soit 0,4
 * de la hauteur pour une arche de 176 x 220), les cotes et le bas sont
 * droits ; chaque point s'ecarte d'un rien, environ un pixel a 176 px.
 *
 * Deterministe : une meme graine donne la meme arche, au serveur comme au
 * client.
 */

function generateur(graine: string): () => number {
  let h = 2166136261;
  for (const c of graine) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const arrondi = (n: number) => Math.round(n * 10000) / 10000;

/** Hauteur, en fraction de la boite, ou le demi-cercle du haut rejoint les cotes. */
export const NAISSANCE_ARCHE = 0.4;

/** Ecart maximal d'un point, en fraction de la largeur (environ 1 px a 176 px). */
export const ECART_ARCHE = 0.007;

export function tracerArche(graine: string): string {
  const hasard = generateur(graine);
  const ecart = () => (hasard() * 2 - 1) * ECART_ARCHE;
  const points: [number, number][] = [];
  // Le demi-cercle, de gauche a droite par le haut. Les points restent dans
  // la boite : un ecart vers l'exterieur est rabattu a l'interieur.
  const pasArc = 20;
  for (let i = 0; i <= pasArc; i++) {
    const a = Math.PI - (Math.PI * i) / pasArc;
    const r = 1 - Math.abs(ecart()) * 2;
    points.push([0.5 + 0.5 * r * Math.cos(a), NAISSANCE_ARCHE - NAISSANCE_ARCHE * r * Math.sin(a)]);
  }
  // Le cote droit, vers le bas.
  for (let y = NAISSANCE_ARCHE + 0.1; y < 1; y += 0.1) points.push([1 - Math.abs(ecart()), y]);
  // Le bas, de droite a gauche, coins compris : en s'arretant avant x = 0,
  // le coin bas gauche serait coupe en biais.
  for (let i = 0; i <= 8; i++) {
    const x = 1 - i / 8;
    points.push([i === 0 ? 1 - Math.abs(ecart()) : i === 8 ? Math.abs(ecart()) : x, 1 - Math.abs(ecart())]);
  }
  // Le cote gauche, vers le haut.
  for (let y = 1 - 0.1; y > NAISSANCE_ARCHE; y -= 0.1) points.push([Math.abs(ecart()), y]);
  return "M " + points.map(([x, y]) => `${arrondi(x)} ${arrondi(y)}`).join(" L ") + " Z";
}
