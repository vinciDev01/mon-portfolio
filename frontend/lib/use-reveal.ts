"use client";

import { useCallback, useRef } from "react";

/**
 * Une seule instance d'IntersectionObserver pour toute la page, partagee par
 * tous les blocs. L'ancien composant d'animation au defilement en creait une
 * par bloc, avec des seuils qui pouvaient diverger d'une section a l'autre.
 */
let observateur: IntersectionObserver | null = null;

function obtenirObservateur(): IntersectionObserver {
  if (observateur) return observateur;
  observateur = new IntersectionObserver(
    (entrees) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        entree.target.classList.add("reveal-visible");
        observateur?.unobserve(entree.target);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );
  return observateur;
}

export function useReveal() {
  const precedent = useRef<HTMLElement | null>(null);

  return useCallback((el: HTMLElement | null) => {
    if (precedent.current) obtenirObservateur().unobserve(precedent.current);
    precedent.current = el;
    if (el) {
      el.classList.add("reveal");
      obtenirObservateur().observe(el);
    }
  }, []);
}
