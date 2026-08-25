"use client";

import type { RefObject } from "react";
import { useLampe } from "@/lib/lamp/lamp-context";
import { PALETTE } from "@/lib/design/tokens";

export function BeamLayer({
  trou,
  voile,
}: {
  trou: RefObject<SVGPolygonElement | null>;
  voile: RefObject<SVGPolygonElement | null>;
}) {
  const { activee, allumee, reglages } = useLampe();

  if (!activee || !allumee) return null;

  return (
    <svg className="beam-layer" aria-hidden="true" focusable="false">
      <defs>
        <mask id="faisceau">
          <rect width="100%" height="100%" fill="white" />
          {/* Noir = perce le scrim. Bords parfaitement nets, aucun flou. */}
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

      {/* La lumiere chaude, posee a l'interieur du faisceau */}
      <polygon
        ref={voile}
        points="0,0 0,0 0,0 0,0"
        fill={PALETTE.lumiere}
        opacity={(reglages.intensite / 100) * 0.12}
        style={{ mixBlendMode: "plus-lighter" }}
      />
    </svg>
  );
}
