/**
 * Reglages qui changent entre le poste de developpement et le serveur.
 *
 * Meme principe que `secrets.ts` : en production, une valeur absente ou
 * dangereuse arrete le demarrage plutot que de retomber sur un defaut.
 */

type Env = Record<string, string | undefined>;

export const ORIGINES_DE_DEVELOPPEMENT = [
  'http://localhost:3000',
  'http://localhost:3001',
];

const enProduction = (env: Env) => env.NODE_ENV === 'production';

/**
 * Les sites autorises a appeler l'API depuis un navigateur, lus dans
 * `CORS_ORIGINS` (liste separee par des virgules). Hors production, les
 * origines locales servent de defaut.
 */
export function lireOriginesAutorisees(env: Env): string[] {
  const origines = (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter((o) => o.length > 0);

  if (origines.length === 0) {
    if (enProduction(env)) {
      throw new Error(
        "CORS_ORIGINS n'est pas defini. En production, listez les adresses du " +
          'portfolio et du backoffice, par exemple : ' +
          'CORS_ORIGINS=https://exemple.dev,https://admin.exemple.dev',
      );
    }
    return ORIGINES_DE_DEVELOPPEMENT;
  }

  for (const origine of origines) {
    if (origine === '*') {
      throw new Error(
        'CORS_ORIGINS ne peut pas valoir « * » : les requetes portent un jeton ' +
          "d'administration, n'importe quel site pourrait les emettre.",
      );
    }
    if (!/^https?:\/\/[^/\s]+$/.test(origine)) {
      throw new Error(
        `CORS_ORIGINS contient « ${origine} », qui n'est pas une origine : ` +
          'attendu un schema et un hote, sans chemin (https://exemple.dev).',
      );
    }
  }

  return origines;
}

/**
 * La documentation Swagger decrit chaque route de l'API : utile en
 * developpement, inutile au public. Coupee en production sauf `SWAGGER=true`.
 */
export function swaggerActif(env: Env): boolean {
  return !enProduction(env) || env.SWAGGER === 'true';
}
