"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Le bord imparfait : le contour d'un bloc trace a la main, qui ondule d'un
 * pixel ou deux, comme une feuille decoupee aux ciseaux. Pose en fond d'un
 * element `.cadre-imparfait`, il remplace sa bordure et son fond.
 *
 * Le trace est calcule en PIXELS sur la taille mesuree du bloc : l'ecart reste
 * le meme sur une carte de 150 px et sur une fenetre de 900 px, ce qu'un
 * viewBox etire ne permettrait pas. Avant la mesure (rendu serveur), un trace
 * etire en tient lieu, pour que le bloc ait deja un bord.
 *
 * Deterministe : une meme `graine` donne toujours le meme trace, d'un rendu a
 * l'autre et entre serveur et client. Statique : aucun mouvement.
 */

/** Hachage d'une chaine en entier 32 bits, puis suite pseudo-aleatoire. */
function generateur(graine: string): () => number {
  let h = 2166136261;
  for (const c of graine) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const arrondi = (n: number) => Math.round(n * 10) / 10;

/**
 * Le contour d'un rectangle `largeur` x `hauteur`, un point tous les `pas`
 * pixels environ, chacun decale vers l'interieur de 0 a 2 x `amplitude` :
 * le trace ne deborde jamais de la boite.
 */
export function tracerBord(
  largeur: number,
  hauteur: number,
  graine: string,
  amplitude = 1.5,
  pas = 40,
): string {
  const hasard = generateur(graine);
  const ecart = () => amplitude + (hasard() * 2 - 1) * amplitude;
  const points: [number, number][] = [];
  const cote = (n: number, point: (t: number, e: number) => [number, number]) => {
    const segments = Math.max(2, Math.round(n / pas));
    for (let i = 0; i < segments; i++) points.push(point(i / segments, ecart()));
  };
  cote(largeur, (t, e) => [t * largeur, e]);
  cote(hauteur, (t, e) => [largeur - e, t * hauteur]);
  cote(largeur, (t, e) => [largeur - t * largeur, hauteur - e]);
  cote(hauteur, (t, e) => [e, hauteur - t * hauteur]);
  // Les coins : rentres eux aussi, pour qu'aucun ne soit parfaitement droit.
  points[0] = [ecart(), ecart()];
  return "M " + points.map(([x, y]) => `${arrondi(x)} ${arrondi(y)}`).join(" L ") + " Z";
}

/** Le trace de repli, avant la mesure : boite 100 x 100, etiree. */
const REPLI = "M 0.6 0.9 L 50 0.3 L 99.4 0.8 L 99.7 50 L 99.2 99.3 L 50 99.8 L 0.4 99.1 L 0.9 50 Z";

/**
 * `etire` : pas de mesure, un trace 100 x 100 etire sur le bloc. Pour les
 * petites pieces nombreuses (les etiquettes), ou l'etirement ne se voit pas
 * et ou cent observateurs de taille ne vaudraient pas leur cout.
 */
export function BordImparfait({
  graine,
  amplitude,
  pas,
  etire = false,
  className,
}: {
  graine: string;
  amplitude?: number;
  pas?: number;
  etire?: boolean;
  /** Classe ajoutee au SVG, par exemple pour une feuille posee dessous. */
  className?: string;
}) {
  const classes = className ? `bord-imparfait ${className}` : "bord-imparfait";
  const svg = useRef<SVGSVGElement>(null);
  const [taille, setTaille] = useState<{ l: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = svg.current;
    if (!el || etire) return;
    const mesurer = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setTaille({ l: Math.round(width), h: Math.round(height) });
    };
    mesurer();
    if (typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    return () => obs.disconnect();
  }, [etire]);

  if (etire) {
    return (
      <svg className={classes} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={tracerBord(100, 100, graine, 2.5, 25)} />
      </svg>
    );
  }

  return (
    <svg
      ref={svg}
      className={classes}
      viewBox={taille ? `0 0 ${taille.l} ${taille.h}` : "0 0 100 100"}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={taille ? tracerBord(taille.l, taille.h, graine, amplitude, pas) : REPLI} />
    </svg>
  );
}
