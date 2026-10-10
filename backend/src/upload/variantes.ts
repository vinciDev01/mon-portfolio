/**
 * Copie backend de la règle de `packages/shared-types/src/variantes.ts`.
 * Elle existe parce qu'importer le paquet partagé déplacerait la racine de
 * sortie du build (`dist/src/main.js` deviendrait `dist/backend/src/main.js`) ;
 * `variantes.spec.ts` garde les deux copies en phase.
 */
export const TAILLES_MEDAILLON = [88, 176, 264] as const;

const TAILLES: Record<string, readonly number[]> = {
  personal: TAILLES_MEDAILLON,
};

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
