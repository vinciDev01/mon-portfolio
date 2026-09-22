import { useId } from "react";

import { CENTRE_X } from "@/lib/ampoule/geometrie";
import { SILHOUETTE_FERMEE } from "./maille";

/**
 * Les deux couches de lumiere les plus proches de la source (annexe §3.1 et
 * §3.2) : L2 la lueur a travers le tressage, L1 le filament. Empilement
 * impose par la specification : L2 est peinte sous la maille, L1 par-dessus
 * — c'est `Ampoule` qui les positionne l'une et l'autre autour de `<Maille>`.
 *
 * Aucune des deux ne prend de props. Chaque `<defs>` derive son identifiant
 * de `useId()`, jamais d'une chaine litterale : la regle qui protege les
 * `<defs>` de `Ampoule` et `Maille` contre une seconde instance (tache 13,
 * le commutateur) s'applique identiquement ici, et `useId()` l'obtient sans
 * qu'aucun `id` n'ait besoin d'etre transmis en prop.
 *
 * L'opacite de chaque couche est portee par sa propre variable CSS
 * (`--lueur-opacite`, `--filament-opacite` dans globals.css), toutes deux
 * deriveed de `--lampe-t` pour l'instant a l'identique — la tache 10 leur
 * donnera des courbes et des delais distincts. A `--lampe-t: 0` (theme
 * sombre), les deux couches sont invisibles : la « braise residuelle
 * nulle » de l'annexe §4.4.
 */

/** L2 — lueur a travers le tressage, ecretee au contour du dome. */
export function CoucheLueur() {
  const id = useId();
  const idClip = `lueur-clip-${id}`;
  const idDegrade = `lueur-degrade-${id}`;
  const idFlou = `lueur-flou-${id}`;

  return (
    <g className="couche-lueur" clipPath={`url(#${idClip})`}>
      <defs>
        <clipPath id={idClip}>
          <path d={SILHOUETTE_FERMEE} />
        </clipPath>
        {/* Centre (88, 236) : 3 px sous le filament (88, 233), parce que le
            flux remonte moins qu'il ne descend (annexe §3.2). Rayon 96 px,
            en unites utilisateur — coordonnees absolues du repere du dome,
            jamais relatives a une boite englobante. */}
        <radialGradient
          id={idDegrade}
          gradientUnits="userSpaceOnUse"
          cx={CENTRE_X}
          cy={236}
          r={96}
        >
          <stop offset="0%" stopColor="#FFDFAD" stopOpacity={0.58} />
          <stop offset="30%" stopColor="#F6C176" stopOpacity={0.42} />
          <stop offset="58%" stopColor="#E7A257" stopOpacity={0.24} />
          <stop offset="82%" stopColor="#D08337" stopOpacity={0.09} />
          <stop offset="100%" stopColor="hsl(25 65% 48%)" stopOpacity={0} />
        </radialGradient>
        <filter id={idFlou} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {/* Le rectangle couvre largement le dome ; c'est le clip-path qui
          ecrete au contour reel, pas la geometrie du rectangle. */}
      <rect
        x={4}
        y={178}
        width={168}
        height={78}
        fill={`url(#${idDegrade})`}
        filter={`url(#${idFlou})`}
      />
    </g>
  );
}

/** L1 — filament, par-dessus la maille. Quatre sous-couches, du plus large
 *  au plus concentre : globe eclaire, halo serre, boucle, coeur. */
export function CoucheFilament() {
  const id = useId();
  const idHalo = `filament-halo-${id}`;
  const idFlouCoeur = `filament-flou-coeur-${id}`;
  const idFlouBoucle = `filament-flou-boucle-${id}`;
  const idFlouHalo = `filament-flou-halo-${id}`;
  const idFlouGlobe = `filament-flou-globe-${id}`;

  return (
    <g className="couche-filament">
      <defs>
        {/* Degrade radial du halo serre (annexe §3.1) : centre 50/50, r
            100% — pris tel quel, verbatim. */}
        <radialGradient id={idHalo} cx="50%" cy="50%" r="100%">
          <stop offset="0%" stopColor="hsl(44 100% 96%)" stopOpacity={1} />
          <stop offset="22%" stopColor="hsl(40 100% 88%)" stopOpacity={0.86} />
          <stop offset="50%" stopColor="hsl(35 97% 76%)" stopOpacity={0.48} />
          <stop offset="78%" stopColor="hsl(30 90% 66%)" stopOpacity={0.17} />
          <stop offset="100%" stopColor="hsl(28 85% 60%)" stopOpacity={0} />
        </radialGradient>
        <filter id={idFlouCoeur} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={0.5} />
        </filter>
        <filter id={idFlouBoucle} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={1.2} />
        </filter>
        <filter id={idFlouHalo} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
        <filter id={idFlouGlobe} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={4} />
        </filter>
      </defs>

      {/* Globe eclaire : le plus large, le plus doux — peint en premier. */}
      <circle
        cx={CENTRE_X}
        cy={232}
        r={21}
        fill="#FFE6B0"
        fillOpacity={0.42}
        filter={`url(#${idFlouGlobe})`}
      />

      {/* Halo serre : seule sous-couche de L1 en mix-blend-mode: screen
          (addendum du controleur, point C — avec L2, cela fait deux
          couches melees sur les quatre autorisees ; il en reste deux pour
          la tache 9, qui ajoute L4/L5/L6). */}
      <circle
        cx={CENTRE_X}
        cy={233}
        r={20}
        className="halo-serre"
        fill={`url(#${idHalo})`}
        filter={`url(#${idFlouHalo})`}
      />

      {/* Boucle */}
      <ellipse
        cx={CENTRE_X}
        cy={233}
        rx={6}
        ry={3.5}
        fill="none"
        stroke="#FFF3D6"
        strokeWidth={1.4}
        strokeOpacity={0.95}
        filter={`url(#${idFlouBoucle})`}
      />

      {/* Coeur, la sous-couche la plus concentree — tout au-dessus. */}
      <ellipse
        cx={CENTRE_X}
        cy={233}
        rx={2.2}
        ry={1.4}
        fill="#FFFDF6"
        filter={`url(#${idFlouCoeur})`}
      />
    </g>
  );
}
