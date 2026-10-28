/**
 * Le cap de l'aiguille de la boussole, en degres. La premiere section du
 * parcours est au nord, les suivantes se repartissent sur un tour complet.
 *
 * L'angle est CUMULE : partant de `precedent`, l'aiguille prend le chemin le
 * plus court vers le cap de la section `index`. Passer de la derniere section
 * a la premiere la fait avancer d'un cran, au lieu de lui faire faire presque
 * un tour a rebours. Une section inconnue (`index` negatif) ne la bouge pas.
 */
export function capSuivant(precedent: number, index: number, total: number): number {
  if (index < 0 || total <= 0) return precedent;
  const cible = (index * 360) / total;
  // L'ecart vers la cible ramene dans ]-180, 180].
  let ecart = (((cible - precedent) % 360) + 360) % 360;
  if (ecart > 180) ecart -= 360;
  return precedent + ecart;
}
