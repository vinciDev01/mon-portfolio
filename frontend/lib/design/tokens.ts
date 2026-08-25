/**
 * Source unique de verite de l'identite visuelle.
 * Toute valeur de `globals.css` doit correspondre a ce fichier.
 */
export const PALETTE = Object.freeze({
  fond: "#131518",
  surface: "#1A1D21",
  bordure: "#22262B",
  texteSecondaire: "#8B8F8A",
  textePrincipal: "#E4E5E3",
  accent: "#7E9B76",
  /** Couleur du scrim de la lampe. */
  ombre: "#0D0F11",
  /** Voile chaud pose a l'interieur du faisceau. */
  lumiere: "#F2EFE6",
});

/** Ratios de l'echelle modulaire, indexes par le reglage `typeScale`. */
export const ECHELLE_TYPO = Object.freeze({
  compact: 1.2,
  normal: 1.25,
  airy: 1.333,
});

/** Corps de reference en pixels, avant application du reglage `fontSize`. */
export const CORPS_BASE = 17;
