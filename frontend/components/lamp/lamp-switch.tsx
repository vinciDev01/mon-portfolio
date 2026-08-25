"use client";

import { useLampe } from "@/lib/lamp/lamp-context";

export function LampSwitch() {
  const { activee, allumee, basculer } = useLampe();
  if (!activee) return null;

  return (
    <button
      type="button"
      onClick={basculer}
      aria-pressed={allumee}
      className="meta fixed bottom-8 right-16 z-[60] rounded border px-4 py-2
                 transition-colors focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        borderColor: allumee ? "var(--accent)" : "var(--bordure)",
        color: allumee ? "var(--accent)" : "var(--texte-secondaire)",
        background: "var(--surface)",
      }}
    >
      {allumee ? "Éteindre la lampe" : "Allumer la lampe"}
    </button>
  );
}
