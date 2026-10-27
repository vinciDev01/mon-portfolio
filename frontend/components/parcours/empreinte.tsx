"use client";

import { useEffect, useState, type MouseEvent } from "react";

/**
 * L'empreinte : un clic sur une entree de la colonne y laisse la trace d'un
 * doigt, au point exact du clic, comme sur une page qu'on feuillette. Elle
 * reste jusqu'au clic suivant, qui la deplace. Statique : aucun mouvement ne
 * s'ajoute a ceux du site.
 *
 * Seul un clic de pointeur la pose : une activation au clavier (`detail` nul)
 * n'a pas de point, elle n'en laisse donc pas. L'empreinte est decorative,
 * masquee aux technologies d'assistance et transparente aux clics.
 */

function generateur(graine: number): () => number {
  let h = (graine * 2654435761) >>> 0;
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const arrondi = (n: number) => Math.round(n * 100) / 100;

/**
 * Les sillons d'une empreinte, boite 20 x 24 centree en (10, 12) : des
 * ellipses concentriques, plus hautes que larges comme une pulpe de doigt,
 * chacune ouverte d'une breche a un angle different. Deterministe par sa
 * graine.
 */
export function tracerEmpreinte(graine: number): string {
  const hasard = generateur(graine);
  const sillons: string[] = [];
  for (let k = 1; k <= 6; k++) {
    const rx = 1.4 * k;
    const ry = 1.75 * k;
    // La breche : un arc manquant de 40 a 80 degres, place au hasard.
    const breche = (40 + hasard() * 40) * (Math.PI / 180);
    const debut = hasard() * Math.PI * 2;
    const fin = debut + Math.PI * 2 - breche;
    const point = (a: number) => `${arrondi(10 + rx * Math.cos(a))} ${arrondi(12 + ry * Math.sin(a))}`;
    // Deux arcs : un seul arc SVG ne peut depasser un demi-tour sans ambiguite.
    const milieu = (debut + fin) / 2;
    sillons.push(`M ${point(debut)} A ${rx} ${ry} 0 0 1 ${point(milieu)} A ${rx} ${ry} 0 0 1 ${point(fin)}`);
  }
  return sillons.join(" ");
}

export type Empreinte = { x: number; y: number; graine: number; angle: number };

/**
 * L'empreinte d'un clic dans la colonne, en coordonnees de la colonne
 * (defilement compris : elle suit son entree quand la colonne defile), ou
 * null si le clic ne la merite pas.
 */
export function empreinteDuClic(
  e: { clientX: number; clientY: number; detail: number; target: EventTarget | null },
  colonne: HTMLElement,
  hasard: () => number = Math.random,
): Empreinte | null {
  if (e.detail === 0) return null;
  if (!(e.target instanceof Element) || !e.target.closest(".entree-parcours")) return null;
  const boite = colonne.getBoundingClientRect();
  return {
    x: e.clientX - boite.left + colonne.scrollLeft,
    y: e.clientY - boite.top + colonne.scrollTop,
    graine: Math.floor(hasard() * 1_000_000),
    // Un doigt pose de biais, jamais a l'envers : de -35 a +35 degres.
    angle: Math.round(hasard() * 70 - 35),
  };
}

/** L'etat de l'empreinte et le gestionnaire a poser sur la colonne. */
export function useEmpreinte() {
  const [empreinte, setEmpreinte] = useState<Empreinte | null>(null);

  // Au changement de taille, les entrees changent de place : l'empreinte,
  // posee en coordonnees de la colonne, tomberait a cote. Elle s'en va.
  useEffect(() => {
    if (!empreinte) return;
    const effacer = () => setEmpreinte(null);
    window.addEventListener("resize", effacer);
    return () => window.removeEventListener("resize", effacer);
  }, [empreinte]);

  const surClic = (e: MouseEvent<HTMLElement>) => {
    const nouvelle = empreinteDuClic(e, e.currentTarget);
    if (nouvelle) setEmpreinte(nouvelle);
  };

  return { empreinte, surClic };
}

export function MarqueEmpreinte({ empreinte }: { empreinte: Empreinte | null }) {
  if (!empreinte) return null;
  return (
    <svg
      className="empreinte"
      viewBox="0 0 20 24"
      aria-hidden="true"
      focusable="false"
      style={{ left: empreinte.x, top: empreinte.y, rotate: `${empreinte.angle}deg` }}
    >
      <path d={tracerEmpreinte(empreinte.graine)} />
    </svg>
  );
}
