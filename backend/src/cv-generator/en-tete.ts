/**
 * Bloc de contact du CV, partage par le rendu PDF et le rendu Word.
 *
 * Il vit dans une fonction pure parce qu'il porte une regle de
 * confidentialite : l'adresse postale ne sort que si elle a ete declaree
 * publique. Un refactor qui casserait cette regle en silence publierait le
 * domicile du proprietaire du site — d'ou les tests.
 */

export type InfoContact = {
  nationalite?: string | null;
  adresse?: string | null;
  adressePublique: boolean;
  phone?: string | null;
  email?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
};

export type LigneContact =
  | { genre: 'texte'; texte: string }
  | { genre: 'lien'; etiquette: string; url: string };

/** Vrai seulement si la valeur contient autre chose que des blancs. */
function renseigne(v: string | null | undefined): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function lignesContact(info: InfoContact | null): LigneContact[] {
  if (!info) return [];

  const lignes: LigneContact[] = [];

  if (renseigne(info.nationalite)) {
    lignes.push({ genre: 'texte', texte: info.nationalite.trim() });
  }

  // L'adresse exige les deux conditions : etre renseignee ET etre publique.
  if (renseigne(info.adresse) && info.adressePublique) {
    lignes.push({ genre: 'texte', texte: `Adresse : ${info.adresse.trim()}` });
  }

  if (renseigne(info.phone)) {
    lignes.push({ genre: 'texte', texte: `Tel : ${info.phone.trim()}` });
  }
  if (renseigne(info.email)) {
    lignes.push({ genre: 'lien', etiquette: 'Email : ', url: info.email.trim() });
  }
  if (renseigne(info.githubUrl)) {
    lignes.push({ genre: 'lien', etiquette: 'Github : ', url: info.githubUrl.trim() });
  }
  if (renseigne(info.linkedinUrl)) {
    lignes.push({
      genre: 'lien',
      etiquette: 'LinkedIn : ',
      url: info.linkedinUrl.trim(),
    });
  }

  return lignes;
}

/**
 * Nom du fichier telecharge.
 *
 * Un recruteur qui recoit dix fichiers nommes « CV.pdf » ne retrouve pas le
 * votre. On compose donc le nom depuis l'identite, sans diacritiques ni
 * caracteres interdits par les systemes de fichiers.
 */
export function nomFichier(
  nom: string,
  prenom: string,
  extension: string,
): string {
  const nettoyer = (v: string) =>
    v
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // retire les diacritiques
      .replace(/[^A-Za-z0-9 ]/g, '') // puis tout ce qui n'est pas alphanumerique
      .trim()
      .replace(/\s+/g, '_');

  const morceaux = [nettoyer(nom), nettoyer(prenom)].filter(
    (m) => m.length > 0,
  );

  return ['CV', ...morceaux].join('_') + '.' + extension;
}

/**
 * Cible reelle d'un lien de contact.
 *
 * Une adresse electronique n'est pas une URL : sans le schema `mailto:`, les
 * lecteurs PDF et Word la rendent inerte ou la prefixent en `http://`.
 */
export function hrefDeLien(valeur: string): string {
  const v = valeur.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return v;
  return v.includes('@') ? `mailto:${v}` : `https://${v}`;
}
