/**
 * Avec la pagination, chaque section arrive entierement visible : sans delai,
 * une rafale de molette annoncerait les neuf sections traversees. On n'annonce
 * donc que celle ou l'on s'arrete vraiment, et tout nouveau changement annule
 * l'annonce en attente.
 *
 * Le delai retire aussi une fausse annonce : a l'ouverture sur un fragment
 * (`#projets`), le conteneur active brievement la section 0 avant de sauter a
 * la cible. Le changement vers la cible arrive dans le delai et annule
 * l'annonce de la section 0 : seule la section d'arrivee est annoncee.
 */
export const DELAI_STABILISATION = 400;

/**
 * La regle, sans horloge : l'ecoulement du temps est injecte pour qu'elle se
 * teste sans navigateur ni minuterie.
 */
export function annonceAPoser(poser: (id: string) => void, delai: number) {
  let attendu: string | null = null;
  let restant = 0;

  return {
    /** Remplace l'annonce en attente et repart du delai plein. */
    planifier(id: string) {
      attendu = id;
      restant = delai;
    },
    /** Fait avancer le temps ; pose l'annonce si le delai est atteint. */
    ecouler(ms: number) {
      if (attendu === null) return;
      restant -= ms;
      if (restant > 0) return;
      const id = attendu;
      attendu = null;
      poser(id);
    },
    /** Abandonne l'annonce en attente. */
    annuler() {
      attendu = null;
    },
  };
}

/**
 * La regle branchee sur une vraie minuterie : chaque signalement annule la
 * minuterie precedente, puis en arme une nouvelle de la duree du delai.
 */
export function creerAnnonceur(
  poser: (id: string) => void,
  delai: number = DELAI_STABILISATION,
) {
  const regle = annonceAPoser(poser, delai);
  let minuterie: ReturnType<typeof setTimeout> | undefined;

  return {
    signaler(id: string) {
      clearTimeout(minuterie);
      regle.planifier(id);
      minuterie = setTimeout(() => regle.ecouler(delai), delai);
    },
    arreter() {
      clearTimeout(minuterie);
      regle.annuler();
    },
  };
}
