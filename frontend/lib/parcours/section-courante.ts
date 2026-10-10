"use client";

import { useEffect, useState } from "react";

/** `part` est la hauteur visible de la section, en pixels. */
export type Visible = { ancre: string; part: number; haut: number };

/**
 * Quand deux sections sont visibles, celle dont la part visible est la plus
 * grande gagne. A egalite, la plus haute dans le document gagne : sans cette
 * seconde regle le resultat dependrait de l'ordre d'arrivee des entrees de
 * l'observateur, donc ne serait pas testable.
 */
export function sectionCourante(visibles: Visible[]): string | null {
  const retenues = visibles.filter((v) => v.part > 0);
  if (retenues.length === 0) return null;
  return retenues.reduce((a, b) => {
    if (b.part > a.part) return b;
    if (b.part < a.part) return a;
    return b.haut < a.haut ? b : a;
  }).ancre;
}

/**
 * Reutilise l'IntersectionObserver plutot qu'un ecouteur de defilement : le
 * site en a deja un dans section-toast-observer.tsx, et un ecouteur de
 * defilement se declencherait a chaque image.
 */
export function useSectionCourante(ancres: string[]): string | null {
  const [courante, setCourante] = useState<string | null>(null);
  const cle = ancres.join(",");

  useEffect(() => {
    if (!cle) return;
    const parts = new Map<string, Visible>();

    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          const ancre = e.target.id;
          parts.set(ancre, {
            ancre,
            // Hauteur visible en pixels, pas intersectionRatio : le ratio est
            // la fraction de LA SECTION visible, donc une section courte
            // entierement a l'ecran (1) battrait une longue qui couvre trois
            // fois plus d'ecran (0,3).
            part: e.intersectionRect.height,
            // offsetTop et non getBoundingClientRect().top : seul l'ORDRE
            // compte pour l'egalite, et toutes les sections partagent le meme
            // parent de positionnement. Le rect est relatif a la fenetre, il
            // changerait a chaque defilement et rendrait l'egalite
            // non deterministe, ce que la spec interdit.
            haut: (e.target as HTMLElement).offsetTop,
          });
        }
        setCourante(sectionCourante([...parts.values()]));
      },
      // Les seuils s'expriment en ratio : une section plus haute que la
      // fenetre n'atteint jamais les hauts et ne declencherait rien pendant
      // la traversee, laissant la valeur stockee perimee. Une liste dense
      // (pas de 0,05) garantit des notifications tout au long du defilement.
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );

    for (const ancre of cle.split(",")) {
      const el = document.getElementById(ancre);
      if (el) observateur.observe(el);
    }
    return () => observateur.disconnect();
  }, [cle]);

  return courante;
}
