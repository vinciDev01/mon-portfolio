/**
 * Une version du CV, une par candidature. Les listes d'identifiants
 * retiennent ce qui entre dans cette version ; une liste vide retient tout.
 */
export interface CvVersionDto {
  id: string;
  nom: string;
  langue: "fr" | "en";
  /** Le poste vise ; null : celui des reglages du CV. */
  titrePoste: string | null;
  /** La presentation propre a la version ; null : celle de la base. */
  presentation: string | null;
  sectionsMasquees: string[];
  projetIds: string[];
  technologieIds: string[];
  /** Les competences libres retenues (management...). */
  competenceIds: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
