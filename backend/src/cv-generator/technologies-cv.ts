/** Une ligne du CV a deux colonnes : l'etiquette (la famille) et sa valeur.
 *  `etiquette` nulle : la ligne s'imprime seule, sans colonne de gauche. */
export type Paire = { etiquette: string | null; valeur: string };

const AUTRES = 'Autres';

/**
 * Les technologies rangees par famille, une ligne par famille, deja triees
 * dans l'ordre d'affichage recu. Les familles suivent l'ordre de leur premiere
 * technologie ; la casse et les blancs de bord ne distinguent pas deux
 * familles, et la premiere graphie rencontree est gardee. Les technologies
 * sans famille vont sous « Autres », en dernier. Si aucune n'a de famille, le
 * classement n'apporte rien : une seule ligne, sans etiquette.
 */
export function grouperTechnologies(
  technologies: readonly { label: string; family: string | null }[],
): Paire[] {
  if (technologies.length === 0) return [];
  const familles = new Map<string, { etiquette: string; labels: string[] }>();
  const sansFamille: string[] = [];

  for (const t of technologies) {
    const famille = t.family?.trim();
    if (!famille) {
      sansFamille.push(t.label);
      continue;
    }
    const cle = famille.toLocaleLowerCase('fr');
    const groupe = familles.get(cle);
    if (groupe) groupe.labels.push(t.label);
    else familles.set(cle, { etiquette: famille, labels: [t.label] });
  }

  if (familles.size === 0) return [{ etiquette: null, valeur: sansFamille.join(', ') }];

  const paires: Paire[] = [...familles.values()].map((g) => ({
    etiquette: g.etiquette,
    valeur: g.labels.join(', '),
  }));
  if (sansFamille.length) paires.push({ etiquette: AUTRES, valeur: sansFamille.join(', ') });
  return paires;
}
