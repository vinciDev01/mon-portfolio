"use client";

import { useTheme } from "@/lib/theme/theme-context";

/**
 * L'interrupteur de l'ampoule : un vrai <button>, frere des SVG (jamais a
 * l'interieur) et hors de `.ampoule`, donc non mis a l'echelle : sa zone
 * de clic reste d'au moins 44 x 44 px (voir `.ampoule-interrupteur`,
 * globals.css). La bascule elle-meme (classe, stockage, animation) vit
 * dans le fournisseur de theme ; le bouton ne fait qu'appeler `basculer`.
 * Ni `disabled` ni anti-rebond : le garde-fou est dans l'animation.
 */
export function Interrupteur() {
  const { allumee, basculer } = useTheme();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={allumee}
      aria-label="Éclairage de la page"
      onClick={basculer}
      className="ampoule-interrupteur"
    >
      {/* Libelle d'etat, annonce au changement (annexe §8.5). Son texte
          depend de l'etat reel du theme, que le serveur ignore : divergence
          legitime avec le rendu serveur, donc `suppressHydrationWarning`. */}
      <span className="sr-only" aria-live="polite" suppressHydrationWarning>
        {allumee ? "Allumé, thème clair" : "Éteint, thème sombre"}
      </span>
    </button>
  );
}
