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
      style={
        {
          borderColor: allumee ? "var(--accent)" : "var(--bordure)",
          color: allumee ? "var(--accent)" : "var(--texte-secondaire)",
          background: "var(--surface)",
          // L'anneau de focus retombe sur `currentColor` (donc `color`
          // ci-dessus) : on le rend explicite pour ne pas dependre d'un
          // mecanisme implicite qu'un futur ajout de classe `ring-*`
          // pourrait casser silencieusement.
          "--tw-ring-color": allumee ? "var(--accent)" : "var(--texte-secondaire)",
          // Tailwind decale l'anneau de 2px (ring-offset-2) avec un fond par
          // defaut blanc. Sur ce theme entierement sombre, ca produirait un
          // liseré blanc incoherent : on fixe le decalage sur le fond du
          // site.
          "--tw-ring-offset-color": "var(--fond)",
        } as React.CSSProperties
      }
    >
      {allumee ? "Éteindre la lampe" : "Allumer la lampe"}
    </button>
  );
}
