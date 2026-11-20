/** Une section du corps de la lettre : un titre facultatif (en gras) et un
 *  texte, dont une ligne vide separe les paragraphes. */
export interface SectionLettreDto {
  titre: string | null;
  corps: string;
}

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
  /** Les sections retirees de cette version : cles de la base et
   *  identifiants des sections libres. */
  sectionsMasquees: string[];
  projetIds: string[];
  technologieIds: string[];
  /** Les competences libres retenues (management...). */
  competenceIds: string[];
  /** Les projets par annee pour cette version ; null : le reglage du CV. */
  projetsParAnnee: boolean | null;
  /** La lettre de motivation ; sans texte dans ses sections, la version
   *  n'en a pas. Le destinataire : une ligne par information. */
  lettreDestinataire: string | null;
  lettreLieu: string | null;
  /** Nulle : la date du jour de la generation. */
  lettreDate: string | null;
  lettreObjet: string | null;
  /** Le corps, de l'appel a la formule de politesse, section par section. */
  lettreSections: SectionLettreDto[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
