/** Une ligne du CV a deux colonnes : l'etiquette (la famille) et sa valeur.
 *  `etiquette` nulle : la ligne s'imprime seule, sans colonne de gauche. */
export type Paire = { etiquette: string | null; valeur: string };

const AUTRES = 'Autres';

/**
 * Les technologies rangees par famille, une ligne par famille, deja triees
 * dans l'ordre d'affichage recu. Les familles suivent leur propre ordre
 * (`sortOrder`, regle au backoffice), puis, a ordre egal, celui de leur
 * premiere technologie. Les technologies sans famille vont sous « Autres »,
 * en dernier. Si aucune n'a de famille, le classement n'apporte rien : une
 * seule ligne, sans etiquette.
 */
export function grouperTechnologies(
  technologies: readonly { label: string; family: { name: string; sortOrder: number } | null }[],
): Paire[] {
  if (technologies.length === 0) return [];
  const familles = new Map<string, { sortOrder: number; arrivee: number; labels: string[] }>();
  const sansFamille: string[] = [];

  technologies.forEach((t, i) => {
    if (!t.family) {
      sansFamille.push(t.label);
      return;
    }
    const groupe = familles.get(t.family.name);
    if (groupe) groupe.labels.push(t.label);
    else familles.set(t.family.name, { sortOrder: t.family.sortOrder, arrivee: i, labels: [t.label] });
  });

  if (familles.size === 0) return [{ etiquette: null, valeur: sansFamille.join(', ') }];

  const paires: Paire[] = [...familles.entries()]
    .sort(([, a], [, b]) => a.sortOrder - b.sortOrder || a.arrivee - b.arrivee)
    .map(([nom, g]) => ({ etiquette: nom, valeur: g.labels.join(', ') }));
  if (sansFamille.length) paires.push({ etiquette: AUTRES, valeur: sansFamille.join(', ') });
  return paires;
}
