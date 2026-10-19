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
      {/* Libelle d'etat, annonce au changement (annexe §8.5). Plus de
          `suppressHydrationWarning` ici : le premier rendu client rend
          desormais le meme etat que le serveur (etat initial deterministe
          du fournisseur de theme), et c'est l'effet d'alignement qui
          remplace ensuite ce texte par l'etat reel, par un vrai rendu.
          Le laisser masquerait une divergence future au lieu de la
          reparer. Une divergence masquee laisse le libelle du serveur en
          place, donc un lecteur d'ecran qui annonce l'inverse. */}
      <span className="sr-only" aria-live="polite">
        {allumee ? "Allumé, thème clair" : "Éteint, thème sombre"}
      </span>
    </button>
  );
}
