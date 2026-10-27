"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Le sentier du parcours, a la place du trait droit de la frise : un chemin
 * en pointilles qui serpente d'une experience a l'autre, trace a la main, et
 * une pierre a chaque etape.
 *
 * Chaque experience porte son troncon. Il part du milieu de la colonne en
 * haut et y revient en bas : les troncons se raccordent d'une ligne a la
 * suivante. Il repasse aussi par le milieu a hauteur de la pierre, qui reste
 * en face de la date.
 *
 * Comme le bord imparfait, le trace est calcule en pixels sur la taille
 * mesuree, deterministe par sa graine, et statique.
 */

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

/** Ecart lateral maximal du sentier, en pixels, de part et d'autre du milieu. */
export const AMPLITUDE_SENTIER = 6;

/**
 * Le troncon d'une colonne `largeur` x `hauteur`. Une ondulation lente, nulle
 * en haut, en bas et a hauteur de l'etape `yEtape`, plus un tremble d'un
 * demi-pixel : jamais deux troncons pareils, jamais hors de la colonne.
 */
export function tracerSentier(largeur: number, hauteur: number, yEtape: number, graine: string): string {
  const hasard = generateur(graine);
  const milieu = largeur / 2;
  const periode = 120 + hasard() * 80;
  const sens = hasard() < 0.5 ? -1 : 1;
  const pas = 12;
  const n = Math.max(2, Math.round(hauteur / pas));
  const points: string[] = [];
  for (let i = 0; i <= n; i++) {
    const y = (i / n) * hauteur;
    const enveloppe = Math.sin((Math.PI * y) / hauteur);
    const vague = Math.sin((2 * Math.PI * (y - yEtape)) / periode);
    // Le tremble s'eteint aux raccords et pres de l'etape.
    const calme = Math.min(1, Math.abs(y - yEtape) / 16) * enveloppe;
    const tremble = (hasard() - 0.5) * calme;
    points.push(`${arrondi(milieu + sens * AMPLITUDE_SENTIER * enveloppe * vague + tremble)} ${arrondi(y)}`);
  }
  return "M " + points.join(" L ");
}

/** La pierre de l'etape : un caillou irregulier d'environ 10 px. */
export function tracerPierre(cx: number, cy: number, graine: string): string {
  const hasard = generateur(graine + ":pierre");
  const cotes = 7;
  const points: string[] = [];
  for (let i = 0; i < cotes; i++) {
    const a = (2 * Math.PI * i) / cotes;
    const r = 4.2 + hasard() * 1.4;
    points.push(`${arrondi(cx + r * Math.cos(a))} ${arrondi(cy + r * Math.sin(a))}`);
  }
  return "M " + points.join(" L ") + " Z";
}

/** L'avion vu de dessus, nez vers le haut, centre sur l'origine : 20 x 21
 *  unites, pour tenir dans la colonne de 24 px du sentier. */
export const SILHOUETTE_AVION =
  "M 0 -10 C 1.2 -10 1.6 -8 1.6 -6 L 1.6 -2 L 10 3 L 10 5 L 1.6 2.5 L 1.4 7 L 4 9 L 4 10.5 " +
  "L 0 9.5 L -4 10.5 L -4 9 L -1.4 7 L -1.6 2.5 L -10 5 L -10 3 L -1.6 -2 L -1.6 -6 C -1.6 -8 -1.2 -10 0 -10 Z";

/**
 * L'experience en cours : un petit avion qui remonte le sentier vers la
 * suite, feux allumes comme un vrai. Feux de navigation fixes, rouge a
 * gauche et vert a droite ; eclats blancs aux bouts d'aile, deux puis un
 * silence ; balise rouge sur le fuselage, qui clignote en decale.
 */
function Avion({ x, y }: { x: number; y: number }) {
  return (
    <g className="sentier-avion" transform={`translate(${x} ${y})`}>
      <path className="avion-corps" d={SILHOUETTE_AVION} />
      <circle className="avion-feu avion-feu-gauche" cx={-9.6} cy={4} r={1.3} />
      <circle className="avion-feu avion-feu-droit" cx={9.6} cy={4} r={1.3} />
      <circle className="avion-eclat" cx={-9.6} cy={4} r={2.6} />
      <circle className="avion-eclat" cx={9.6} cy={4} r={2.6} />
      <circle className="avion-balise" cx={0} cy={0.5} r={1.4} />
    </g>
  );
}

/**
 * La hauteur de l'etape vient de la feuille (`--sentier-etape`), qui la cale
 * sur la premiere date selon le palier : relue a chaque mesure.
 */
export function Sentier({ graine, enCours = false }: { graine: string; enCours?: boolean }) {
  const svg = useRef<SVGSVGElement>(null);
  const [taille, setTaille] = useState<{ l: number; h: number; etape: number } | null>(null);

  useLayoutEffect(() => {
    const el = svg.current;
    if (!el) return;
    const mesurer = () => {
      const { width, height } = el.getBoundingClientRect();
      const etape = parseFloat(getComputedStyle(el).getPropertyValue("--sentier-etape")) || 30;
      if (width > 0 && height > 0) setTaille({ l: Math.round(width), h: Math.round(height), etape });
    };
    mesurer();
    if (typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!taille) {
    // Avant la mesure : le sentier droit, etire, pour ne pas laisser de vide.
    return (
      <svg ref={svg} className="sentier" viewBox="0 0 24 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path className="sentier-chemin" d="M 12 0 L 12 100" />
      </svg>
    );
  }

  return (
    <svg ref={svg} className="sentier" viewBox={`0 0 ${taille.l} ${taille.h}`} aria-hidden="true" focusable="false">
      <path className="sentier-chemin" d={tracerSentier(taille.l, taille.h, taille.etape, graine)} />
      {enCours ? (
        <Avion x={taille.l / 2} y={taille.etape} />
      ) : (
        <path className="sentier-pierre" d={tracerPierre(taille.l / 2, taille.etape, graine)} />
      )}
    </svg>
  );
}
