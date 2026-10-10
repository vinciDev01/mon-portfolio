export type Direction = 1 | -1;

/** Cumul de `deltaY` requis pour paginer (spec section 2.4). */
export const SEUIL_MOLETTE = 60;
/** Au-dela de ce silence, le cumul est oublie (spec section 2.4). */
export const FENETRE_MOLETTE = 300;
/** Tolerance de butee, pour les rapports de pixels fractionnaires. */
const TOLERANCE = 1;

/**
 * La regle de pagination, sans effet de bord. Hors butee la section defile a
 * l'interieur et l'index ne change pas. En butee l'index bouge d'un cran, et
 * aux deux extremites il ne bouge pas : rien ne rebondit.
 */
export function prochainIndex(
  index: number,
  nombre: number,
  direction: Direction,
  enButee: boolean,
): number {
  if (!enButee) return index;
  const vise = index + direction;
  if (vise < 0 || vise >= nombre) return index;
  return vise;
}

/**
 * La tolerance d'un pixel absorbe les rapports de pixels fractionnaires, ou
 * `scrollTop` n'atteint jamais exactement sa borne. Une section qui ne defile
 * pas du tout est en butee dans les deux sens, ce qui fait paginer des le
 * premier cran au lieu d'attendre un defilement impossible.
 */
export function estEnButee(
  el: { scrollTop: number; scrollHeight: number; clientHeight: number },
  direction: Direction,
): boolean {
  if (direction === -1) return el.scrollTop <= TOLERANCE;
  return el.scrollHeight - el.clientHeight - el.scrollTop <= TOLERANCE;
}

/**
 * Un fragment inconnu, vide, ou nommant une section que le backoffice a
 * eteinte retombe sur la premiere section. Jamais d'index negatif, qui
 * donnerait une page blanche.
 */
export function indexDepuisFragment(fragment: string, ids: string[]): number {
  const id = fragment.replace(/^#/, "");
  if (!id) return 0;
  const i = ids.indexOf(id);
  return i === -1 ? 0 : i;
}

/**
 * Le pavé tactile emet beaucoup de petits evenements, un cran de souris en
 * emet un gros. On cumule donc, et on ne pagine qu'au seuil. Un changement de
 * direction ou un silence plus long que la fenetre remet le cumul a zero.
 */
export function creerAccumulateur(maintenant: () => number) {
  let cumul = 0;
  let dernier = -Infinity;

  return {
    pousser(delta: number): Direction | null {
      const t = maintenant();
      if (t - dernier > FENETRE_MOLETTE) cumul = 0;
      if (cumul !== 0 && Math.sign(delta) !== Math.sign(cumul)) cumul = 0;
      dernier = t;
      cumul += delta;
      if (Math.abs(cumul) < SEUIL_MOLETTE) return null;
      const direction: Direction = cumul > 0 ? 1 : -1;
      cumul = 0;
      return direction;
    },
    reinitialiser() {
      cumul = 0;
      dernier = -Infinity;
    },
  };
}
