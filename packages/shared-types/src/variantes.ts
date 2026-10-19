/**
 * La règle de nommage des variantes de densité, partagée par les deux
 * workspaces. Le téléversement les écrit, le médaillon les lit : si la règle
 * vivait des deux côtés, elle dériverait au premier changement.
 *
 * Seule la catégorie `personal` reçoit des variantes : c'est la seule image du
 * site affichée à une taille fixe connue. Les autres ne dépassent pas 200 px à
 * la source et ne gagneraient rien à être déclinées.
 */
export const TAILLES_MEDAILLON = [88, 176, 264] as const;

const TAILLES: Record<string, readonly number[]> = {
  personal: TAILLES_MEDAILLON,
};

/** Les catégories qui reçoivent des variantes : les clés de la table. */
export function categoriesAvecVariantes(): string[] {
  return Object.keys(TAILLES);
}

export function taillesPour(categorie: string): number[] {
  return [...(TAILLES[categorie] ?? [])];
}

/** Suffixe la taille avant l'extension : `a/b.webp` donne `a/b-176.webp`. */
export function nomVariante(base: string, taille: number): string {
  const barre = Math.max(base.lastIndexOf("/"), base.lastIndexOf("\\"));
  const point = base.lastIndexOf(".");
  if (point <= barre + 1) return `${base}-${taille}`;
  return `${base.slice(0, point)}-${taille}${base.slice(point)}`;
}
