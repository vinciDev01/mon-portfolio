export type EtatRessort = { valeur: number; vitesse: number };

/**
 * Pas de temps maximal, en secondes. Un onglet masse puis revele produit un dt
 * de plusieurs secondes ; sans ce plafond l'integration d'Euler diverge et la
 * lampe part a l'infini.
 */
export const DT_MAX = 1 / 30;

const EPSILON_VALEUR = 1e-3;
const EPSILON_VITESSE = 1e-3;

/**
 * Un pas d'integration semi-implicite d'un ressort amorti.
 *
 *   a = -omega^2 * (x - cible) - 2 * zeta * omega * v
 *
 * zeta = 0.9 place le systeme juste sous l'amortissement critique : acceleration
 * au depart, arret net, aucun rebond visible.
 */
export function pasRessort(
  etat: EtatRessort,
  cible: number,
  omega: number,
  zeta: number,
  dt: number,
): EtatRessort {
  const pas = Math.min(dt, DT_MAX);
  const acceleration =
    -(omega * omega) * (etat.valeur - cible) - 2 * zeta * omega * etat.vitesse;
  const vitesse = etat.vitesse + acceleration * pas;
  const valeur = etat.valeur + vitesse * pas;
  return { valeur, vitesse };
}

/**
 * Vrai quand le ressort est arrive et ne bouge plus. C'est la condition d'arret
 * de la boucle rAF : sans elle, la boucle tourne indefiniment et vide la
 * batterie sur une page immobile.
 */
export function estImmobile(etat: EtatRessort, cible: number): boolean {
  return (
    Math.abs(etat.valeur - cible) < EPSILON_VALEUR &&
    Math.abs(etat.vitesse) < EPSILON_VITESSE
  );
}

/**
 * Ecart angulaire le plus court entre deux angles, ramene dans (-pi, pi].
 * Sans cela, une tete a 3.0 rad visant -3.0 rad ferait presque un tour complet
 * au lieu des 0.28 rad qui les separent reellement.
 */
export function differenceAngulaire(depuis: number, vers: number): number {
  let d = (vers - depuis) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}
