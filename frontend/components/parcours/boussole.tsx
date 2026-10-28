"use client";

import { useState } from "react";
import { capSuivant } from "@/lib/parcours/cap";

/**
 * La boussole a clapet du sommet de la colonne, a la place des initiales : le
 * site est un parcours, elle l'oriente.
 *
 * Le boitier porte une lunette, quatre reperes cardinaux et une aiguille dont
 * la moitie nord prend l'accent. L'aiguille prend un cap par section
 * (`capSuivant`) et y tourne avec un leger depassement. Le clapet, articule en
 * haut, couleur cafe, est ouvert au repos et se rabat sur le cadran au survol
 * du lien d'identite. Au chargement de la page, l'aiguille s'affole un instant
 * avant de trouver son cap, comme une boussole deboussolee. Tout le mouvement
 * est porte par la feuille, qui le coupe pour qui demande moins d'animation.
 *
 * Deux SVG superposes plutot qu'un : la bascule du clapet est une rotation en
 * trois dimensions, que la feuille applique a un element HTML entier.
 */
export function Boussole({ index, total }: { index: number; total: number }) {
  // L'angle est cumule, donc il depend du precedent : il se recalcule pendant
  // le rendu quand la section change, sans effet ni second rendu.
  const [cap, setCap] = useState(() => ({ index, angle: capSuivant(0, index, total) }));
  if (cap.index !== index) setCap({ index, angle: capSuivant(cap.angle, index, total) });

  return (
    <span className="identite-boussole" aria-hidden="true">
      <svg className="boussole-boitier" viewBox="0 0 36 36" focusable="false">
        <rect className="boussole-charniere" x="15" y="0.5" width="6" height="3" rx="1" />
        <circle className="boussole-lunette" cx="18" cy="18" r="16.5" />
        <circle className="boussole-cadran" cx="18" cy="18" r="12.5" />
        <path className="boussole-repere" d="M 18 3.5 V 6.5" />
        <path className="boussole-repere" d="M 32.5 18 H 29.5" />
        <path className="boussole-repere" d="M 18 32.5 V 29.5" />
        <path className="boussole-repere" d="M 3.5 18 H 6.5" />
        {/* Deux rotations imbriquees : le cap de la section dehors, l'affolement
            du chargement dedans. L'affolement revient a zero : l'aiguille finit
            toujours sur le cap, meme s'il change pendant qu'elle cherche. */}
        <g className="boussole-aiguille" style={{ transform: `rotate(${cap.angle}deg)` }}>
          <g className="boussole-affolement">
            <path className="boussole-nord" d="M 18 7.5 L 21 18 L 15 18 Z" />
            <path className="boussole-sud" d="M 18 28.5 L 21 18 L 15 18 Z" />
          </g>
        </g>
        <circle className="boussole-pivot" cx="18" cy="18" r="1.6" />
      </svg>
      <svg className="boussole-clapet" viewBox="0 0 36 36" focusable="false">
        <circle className="boussole-couvercle" cx="18" cy="18" r="16.5" />
        <circle className="boussole-gravure" cx="18" cy="18" r="12" />
        {/* La devise gravee sur le pourtour : un cercle parti du haut, dans le
            sens des aiguilles, le texte centre en bas. Il laisse libre le haut,
            ou s'attache la charniere. Une seule boussole par page : l'id est fixe. */}
        <path id="boussole-pourtour" className="boussole-pourtour" d="M 18 3.8 A 14.2 14.2 0 1 1 17.99 3.8" />
        <text className="boussole-devise">
          <textPath href="#boussole-pourtour" startOffset="50%" textAnchor="middle" textLength="74" lengthAdjust="spacing">
            God is good all the time
          </textPath>
        </text>
        <path className="boussole-rose" d="M 18 10 L 19.6 16.4 L 26 18 L 19.6 19.6 L 18 26 L 16.4 19.6 L 10 18 L 16.4 16.4 Z" />
      </svg>
    </span>
  );
}
