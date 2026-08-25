/**
 * Lecture des secrets, en echouant franchement.
 *
 * Ce module existe parce que l'ancienne implementation avait une valeur de
 * repli en dur : un deploiement qui oubliait de definir JWT_SECRET demarrait
 * sans bruit avec un secret que n'importe qui pouvait lire dans le depot, et
 * fabriquer un jeton administrateur valide devenait trivial.
 *
 * Un serveur qui refuse de demarrer se remarque en quelques secondes. Un
 * serveur qui demarre avec un secret public ne se remarque jamais.
 */

export const LONGUEUR_MINIMALE_SECRET = 32;

/** Valeurs de gabarit croisees dans la nature ou dans l'historique du projet. */
const GABARITS = [
  'portfolio-secret-key-change-in-prod',
  'change-me',
  'changeme',
  'secret',
  'votre-secret-ici',
  'your-secret-here',
];

export function lireSecretJwt(env: Record<string, string | undefined>): string {
  const valeur = (env.JWT_SECRET ?? '').trim();

  if (valeur.length === 0) {
    throw new Error(
      "JWT_SECRET n'est pas defini. Le serveur refuse de demarrer sans lui : " +
        'sans secret propre, quiconque lit le depot peut fabriquer un jeton ' +
        'administrateur. Generez-en un avec : openssl rand -base64 48',
    );
  }

  if (valeur.length < LONGUEUR_MINIMALE_SECRET) {
    throw new Error(
      `JWT_SECRET fait ${valeur.length} caracteres ; il en faut au moins ` +
        `${LONGUEUR_MINIMALE_SECRET}. Generez-en un avec : openssl rand -base64 48`,
    );
  }

  const minuscule = valeur.toLowerCase();
  if (GABARITS.some((g) => minuscule.includes(g))) {
    throw new Error(
      'JWT_SECRET est une valeur de gabarit, connue de quiconque lit ce code. ' +
        'Generez-en un avec : openssl rand -base64 48',
    );
  }

  if (new Set(valeur).size < 8) {
    throw new Error(
      'JWT_SECRET est trop peu varie pour resister a une attaque. ' +
        'Generez-en un avec : openssl rand -base64 48',
    );
  }

  return valeur;
}
