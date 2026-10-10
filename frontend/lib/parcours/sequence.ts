/** Duree de sortie de repli, si la lecture de la transition echoue : 45 % de
 *  la duree nominale de 400 ms. */
export const SORTIE_REPLI_MS = 180;
/** Le verrou survit a l'activation de la cible, pour absorber l'inertie d'un
 *  geste continu (spec section 2.4). */
export const VERROU_APRES_MS = 80;

/**
 * Lit une duree CSS en millisecondes, telle que `getComputedStyle` rend
 * `transition-duration` : « 0.18s », « 180ms », ou une liste dont on garde le
 * premier terme. Retourne `null` si rien n'est lisible : zero est une duree
 * valide (mouvement reduit), `null` ne l'est pas.
 */
export function analyserDuree(valeur: string): number | null {
  const v = valeur.trim().split(",")[0]!.trim();
  const m = /^(-?\d*\.?\d+)(ms|s)$/.exec(v);
  if (!m) return null;
  return parseFloat(m[1]!) * (m[2] === "s" ? 1000 : 1);
}

type Options = {
  /** Duree de la sortie, relue a CHAQUE changement : le reglage de vitesse du
   *  backoffice peut avoir change. */
  dureeSortie: () => number;
  /** Etape 1 : plus aucune section ne porte `data-active`. */
  desactiver: () => void;
  /** Etape 3 : la cible porte `data-active`. */
  activer: (cible: number) => void;
  /** Le verrou vient de se lever. */
  surDeverrouillage: () => void;
  planifier?: (fn: () => void, ms: number) => unknown;
  annulerPlanif?: (id: unknown) => void;
};

/**
 * Le sequencement en trois etats d'un changement de section : desactiver,
 * attendre la sortie, activer. Sans l'etat intermediaire, retirer et poser
 * l'attribut d'un seul geste lancerait sortie et entree ensemble, soit le
 * fondu croise que le proprietaire a ecarte. Verrouille pendant tout le
 * changement et `VERROU_APRES_MS` apres.
 */
export function creerSequenceur(o: Options) {
  const planifier = o.planifier ?? ((fn, ms) => setTimeout(fn, ms));
  const annulerPlanif =
    o.annulerPlanif ?? ((id) => clearTimeout(id as ReturnType<typeof setTimeout>));
  let verrouille = false;
  const minuteries: unknown[] = [];

  return {
    get verrouille() {
      return verrouille;
    },
    /** Retourne `false` sans rien faire si le verrou est pose. */
    aller(cible: number): boolean {
      if (verrouille) return false;
      verrouille = true;
      const attente = Math.max(0, o.dureeSortie());
      o.desactiver();
      minuteries.push(
        planifier(() => {
          o.activer(cible);
          minuteries.push(
            planifier(() => {
              verrouille = false;
              o.surDeverrouillage();
            }, VERROU_APRES_MS),
          );
        }, attente),
      );
      return true;
    },
    annuler() {
      for (const m of minuteries) annulerPlanif(m);
      minuteries.length = 0;
      verrouille = false;
    },
  };
}
