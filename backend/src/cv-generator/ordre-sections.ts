/**
 * Section prete a etre dessinee dans le CV.
 */
export type SectionCv = {
  titre: string;
  lignes: string[];
  rang: number;
};

/** Section alimentee par la base, avec son rang implicite. */
export type SectionBase = {
  titre: string;
  lignes: string[];
  rang: number;
};

/** Section libre saisie depuis le backoffice. */
export type SectionLibre = {
  titre: string;
  /** Une entree par ligne. */
  lignes: string;
  publique: boolean;
  sortOrder: number;
};

/** Decoupe un bloc de texte en entrees, en jetant les lignes blanches. */
function decouper(lignes: string): string[] {
  return lignes
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Fusionne les sections issues de la base et les sections libres, puis les
 * ordonne.
 *
 * Les sections de la base portent un rang implicite (presentation 10,
 * technologies 30, certifications 40, experiences 50, projets 60) ; les
 * sections libres s'intercalent par leur `sortOrder`. A rang egal, la base
 * passe en premier : c'est le tri stable de `Array.prototype.sort`, garanti
 * par la specification depuis ES2019.
 *
 * Deux filtres, dans cet ordre :
 *  - une section libre non publique ne sort jamais dans le CV telechargeable ;
 *  - une section sans aucune ligne utile est omise plutot que d'imprimer un
 *    titre suivi de rien.
 */
export function ordonnerSections(
  base: readonly SectionBase[],
  libres: readonly SectionLibre[],
): SectionCv[] {
  const depuisBase: SectionCv[] = base
    .filter((s) => s.lignes.some((l) => l.trim().length > 0))
    .map((s) => ({
      titre: s.titre,
      lignes: s.lignes.map((l) => l.trim()).filter((l) => l.length > 0),
      rang: s.rang,
    }));

  const depuisLibres: SectionCv[] = libres
    .filter((s) => s.publique)
    .map((s) => ({
      titre: s.titre,
      lignes: decouper(s.lignes),
      rang: s.sortOrder,
    }))
    .filter((s) => s.lignes.length > 0);

  return [...depuisBase, ...depuisLibres].sort((a, b) => a.rang - b.rang);
}
