"use client";

import type { RefObject } from "react";
import { useLampe } from "@/lib/lamp/lamp-context";
import { PALETTE } from "@/lib/design/tokens";

/** Doit correspondre a COUCHES_PENOMBRE x BANDES_RETOMBEE du moteur. */
const NOMBRE_POLYGONES_VOILE = 9;

export function BeamLayer({
  trou,
  voiles,
}: {
  trou: RefObject<SVGPolygonElement | null>;
  voiles: RefObject<SVGGElement | null>;
}) {
  const { activee, allumee, reglages } = useLampe();

  if (!activee || !allumee) return null;

  return (
    <svg className="beam-layer" aria-hidden="true" focusable="false">
      <defs>
        <mask id="faisceau">
          <rect width="100%" height="100%" fill="white" />
          {/*
            Le trou est un polygone UNIQUE et net. C'est lui qui revele le
            texte : sa nettete conditionne la lisibilite et le plancher de
            contraste, il ne participe donc pas aux imperfections de la
            lumiere, qui restent cantonnees au voile ci-dessous.
          */}
          <polygon ref={trou} points="0,0 0,0 0,0 0,0" fill="black" />
        </mask>
      </defs>

      {/* L'ombre */}
      <rect
        width="100%"
        height="100%"
        fill={PALETTE.ombre}
        opacity={reglages.assombrissement / 100}
        mask="url(#faisceau)"
      />

      {/*
        Le voile lumineux, en neuf aplats : trois couches de penombre, chacune
        decoupee en trois bandes qui s'attenuent avec la distance. Empiles, ils
        donnent un coeur plein, un bord qui s'adoucit sur quelques pixels et une
        retombee le long du faisceau — sans un seul degrade.
        Le moteur ecrit leurs `points` et leur `opacity` ; l'ordre des enfants
        est celui qu'il attend : couche, puis bande.
      */}
      <g ref={voiles} style={{ mixBlendMode: "plus-lighter" }}>
        {Array.from({ length: NOMBRE_POLYGONES_VOILE }, (_, i) => (
          <polygon key={i} points="0,0 0,0 0,0 0,0" fill={PALETTE.lumiere} opacity="0" />
        ))}
      </g>
    </svg>
  );
}
