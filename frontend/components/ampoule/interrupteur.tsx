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
      onClick={basculer}
      aria-pressed={allumee}
      className="ampoule-interrupteur"
    >
      <span className="sr-only">
        {allumee
          ? "Éteindre la lampe et passer au thème sombre"
          : "Allumer la lampe et passer au thème clair"}
      </span>
    </button>
  );
}
