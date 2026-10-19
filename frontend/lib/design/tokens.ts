/**
 * Source unique de verite de l'identite visuelle.
 * Toute valeur de `globals.css` doit correspondre a ce fichier.
 */

/**
 * Les deux palettes du site, commutees par l'ampoule.
 *
 * `bordureSignifiante` existe separement de `bordure` parce que WCAG 1.4.11
 * impose 3:1 a tout contour qui identifie un composant, alors qu'une
 * separation purement decorative peut rester bien plus discrete.
 */
export const PALETTE_CLAIRE = Object.freeze({
  fond: "#F6F1E8",
  surface: "#FCF8F1",
  bordure: "#DCD1BF",
  bordureSignifiante: "#948263",
  texteSecondaire: "#5E564A",
  textePrincipal: "#1F2320",
  accent: "#456040",
});

export const PALETTE_SOMBRE = Object.freeze({
  fond: "#131518",
  surface: "#1A1D21",
  bordure: "#22262B",
  bordureSignifiante: "#707780",
  // Releve de #8b8f8a : l'ancienne valeur donnait 5,15:1 sur la surface,
  // conforme mais sans marge face aux couches de blend de l'ambiance.
  texteSecondaire: "#9AA096",
  textePrincipal: "#E4E5E3",
  accent: "#7E9B76",
});

export const PALETTES = Object.freeze({
  clair: PALETTE_CLAIRE,
  sombre: PALETTE_SOMBRE,
});

/** Couleurs propres a l'eclairage, communes aux deux themes. */
export const LUMIERE = Object.freeze({
  filamentFroid: "#3A3128",
  filamentChaud: "#FFFDF6",
  brinEteint: "#6E6355",
  ourletEteint: "#7C7162",
});

/** Ratios de l'echelle modulaire, indexes par le reglage `typeScale`. */
export const ECHELLE_TYPO = Object.freeze({
  compact: 1.2,
  normal: 1.25,
  airy: 1.333,
});

/** Corps de reference en pixels, avant application du reglage `fontSize`. */
export const CORPS_BASE = 17;
