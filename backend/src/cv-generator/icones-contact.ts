import { traceDe } from '../logos/catalogue-logos';

/**
 * Les icones des coordonnees du CV, boite 24 x 24. Des traits simples pour
 * le telephone, le courriel, l'adresse, la nationalite, LinkedIn et le
 * portfolio (dessins de Lucide, licence ISC) ; le logo plein de GitHub, tire
 * du catalogue Simple Icons (CC0) deja embarque. LinkedIn a fait retirer le
 * sien de Simple Icons, d'ou son trait.
 */
export type CleContact =
  | 'nationalite'
  | 'adresse'
  | 'tel'
  | 'email'
  | 'github'
  | 'linkedin'
  | 'portfolio';

export type IconeContact = { trace: string; mode: 'trait' | 'plein' };

const TRAITS: Partial<Record<CleContact, string>> = {
  tel: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  email:
    'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6',
  adresse:
    'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 1 0 0-6z',
  nationalite:
    'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7',
  linkedin:
    'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 2a2 2 0 1 0 0 4 2 2 0 1 0 0-4z',
  portfolio:
    'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
};

const LOGOS: Partial<Record<CleContact, string>> = { github: 'github' };

/** L'icone d'une coordonnee, ou null si elle n'en a pas. */
export function iconeContact(cle: CleContact): IconeContact | null {
  const logo = LOGOS[cle];
  if (logo) {
    const trace = traceDe(logo);
    // Logo absent d'une version du catalogue : le globe du portfolio.
    return trace
      ? { trace, mode: 'plein' }
      : { trace: TRAITS.portfolio!, mode: 'trait' };
  }
  const trait = TRAITS[cle];
  return trait ? { trace: trait, mode: 'trait' } : null;
}
