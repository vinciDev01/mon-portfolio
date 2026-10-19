export type Theme = "clair" | "sombre";
export type Strategie = "auto" | Theme;

/** Clef de persistance du choix du visiteur. */
export const CLE_STOCKAGE = "portfolio-theme";

/** Debut de la plage « jour », incluse. */
const HEURE_JOUR = 7;
/** Fin de la plage « jour », exclue. */
const HEURE_NUIT = 19;

/**
 * Theme a appliquer a un visiteur sans preference enregistree.
 *
 * La regle suit la logique de l'objet, pas celle de l'ecran : on allume une
 * lampe le soir, pas au reveil. Le site est donc SOMBRE en journee et CLAIR
 * la nuit, l'inverse de la convention courante. C'est voulu ; ne pas
 * « corriger » ce sens sans revenir a la specification.
 *
 * Toute entree aberrante retombe sur le sombre, qui est l'identite
 * historique du site.
 */
export function themeSelonHeure(heure: number, strategie: Strategie): Theme {
  if (strategie === "clair" || strategie === "sombre") return strategie;
  if (strategie !== "auto") return "sombre";
  if (!Number.isFinite(heure) || heure < 0 || heure > 23) return "sombre";
  return heure >= HEURE_JOUR && heure < HEURE_NUIT ? "sombre" : "clair";
}
