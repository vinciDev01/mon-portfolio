"use client";

import { useEffect, useState, type MouseEvent } from "react";

/**
 * La tache d'encre : un clic sur une entree de la colonne y laisse une petite
 * tache, au point exact du clic, comme une plume posee sur le papier. Elle
 * reste jusqu'au clic suivant, qui la deplace. Statique : aucun mouvement ne
 * s'ajoute aux deux du site.
 *
 * Seul un clic de pointeur la pose : une activation au clavier (`detail` nul)
 * n'a pas de point, elle n'en laisse donc pas. La tache est decorative,
 * masquee aux technologies d'assistance et transparente aux clics.
 */

/** Trois taches irregulieres, boite 12 x 12 : un corps et une goutte. */
export const FORMES_TACHE = [
  "M 6.2 1.6 C 8.6 1.2 10.4 3 10.2 5.4 C 10.6 7.6 9 10 6.4 10.2 C 3.8 10.8 1.6 9 1.8 6.4 C 1.2 4 3.6 1.8 6.2 1.6 Z M 11 1.4 a 0.8 0.8 0 1 0 0.01 0 Z",
  "M 5.4 2 C 7.4 0.8 10.2 2.2 10 4.8 C 11.2 6.8 9.2 9.8 6.6 9.6 C 4.6 11 1.6 9.8 2 7.2 C 0.8 5.4 3 2.8 5.4 2 Z M 1.6 1.8 a 0.7 0.7 0 1 0 0.01 0 Z",
  "M 6 2.2 C 8.8 1.8 10.8 4 9.8 6.2 C 10.4 8.8 7.8 10.8 5.6 9.8 C 3 10.4 1.4 8 2.4 5.8 C 2 3.6 3.8 2 6 2.2 Z M 10.6 10.4 a 0.9 0.9 0 1 0 0.01 0 Z",
] as const;

export type Tache = { x: number; y: number; forme: number; angle: number };

/**
 * La tache d'un clic dans la colonne, en coordonnees de la colonne (defilement
 * compris : elle suit son entree quand la colonne defile), ou null si le clic
 * ne la merite pas.
 */
export function tacheDuClic(
  e: { clientX: number; clientY: number; detail: number; target: EventTarget | null },
  colonne: HTMLElement,
  hasard: () => number = Math.random,
): Tache | null {
  if (e.detail === 0) return null;
  if (!(e.target instanceof Element) || !e.target.closest(".entree-parcours")) return null;
  const boite = colonne.getBoundingClientRect();
  return {
    x: e.clientX - boite.left + colonne.scrollLeft,
    y: e.clientY - boite.top + colonne.scrollTop,
    forme: Math.floor(hasard() * FORMES_TACHE.length),
    angle: Math.round(hasard() * 360),
  };
}

/** L'etat de la tache et le gestionnaire a poser sur la colonne. */
export function useTacheEncre() {
  const [tache, setTache] = useState<Tache | null>(null);

  // Au changement de taille, les entrees changent de place : la tache, posee
  // en coordonnees de la colonne, tomberait a cote. Elle s'en va.
  useEffect(() => {
    if (!tache) return;
    const effacer = () => setTache(null);
    window.addEventListener("resize", effacer);
    return () => window.removeEventListener("resize", effacer);
  }, [tache]);

  const surClic = (e: MouseEvent<HTMLElement>) => {
    const nouvelle = tacheDuClic(e, e.currentTarget);
    if (nouvelle) setTache(nouvelle);
  };

  return { tache, surClic };
}

export function TacheEncre({ tache }: { tache: Tache | null }) {
  if (!tache) return null;
  return (
    <svg
      className="tache-encre"
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
      style={{ left: tache.x, top: tache.y, rotate: `${tache.angle}deg` }}
    >
      <path d={FORMES_TACHE[tache.forme]} />
    </svg>
  );
}
