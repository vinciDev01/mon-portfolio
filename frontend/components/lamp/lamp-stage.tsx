"use client";

import { useRef } from "react";
import { useLampEngine } from "@/lib/lamp/use-lamp-engine";
import { BeamLayer } from "./beam-layer";
import { WorkLamp } from "./work-lamp";

/**
 * Seul proprietaire des refs de la lampe et seul appelant du moteur.
 * Monte la couche lumineuse sous l'objet : le faisceau part de la tete.
 */
export function LampStage() {
  const trou = useRef<SVGPolygonElement | null>(null);
  const voile = useRef<SVGPolygonElement | null>(null);
  const tete = useRef<SVGGElement | null>(null);

  useLampEngine({ trou, voile, tete });

  return (
    <>
      <BeamLayer trou={trou} voile={voile} />
      <WorkLamp tete={tete} />
    </>
  );
}
