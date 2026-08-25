"use client";

import { useBeamTarget } from "@/lib/lamp/lamp-context";
import { useReveal } from "@/lib/use-reveal";

/**
 * Coquille commune a toutes les sections : place le bloc dans la grille selon
 * la parite de `index`, declare sa zone eclairable, et rend le titre en deux
 * couches — celle du dessus n'apparait que dans le faisceau.
 */
export function SectionShell({
  id,
  titre,
  index,
  children,
}: {
  id: string;
  titre: string;
  index: number;
  children: React.ReactNode;
}) {
  const cible = useBeamTarget();
  const reveal = useReveal();
  const aGauche = index % 2 === 1;

  return (
    <section
      id={id}
      className="grid grid-cols-12 px-8 lg:px-16"
      style={{ paddingTop: "var(--espace-section)", paddingBottom: 0 }}
    >
      <div
        ref={(el) => {
          cible(el);
          reveal(el);
        }}
        className="col-span-12 mesure zigzag"
        // L'amplitude vient du reglage `zigzagAmplitude`, normalise entre 0 et 1
        // par app/layout.tsx. A 0 les deux cotes se confondent : colonne unique.
        data-cote={aGauche ? "gauche" : "droite"}
      >
        <p className="meta" style={{ marginBottom: "var(--espace-1)" }} aria-hidden="true">
          {String(index).padStart(2, "0")}
        </p>

        <h2 className="titre-double" style={{ marginBottom: "var(--espace-4)" }}>
          <span className="titre-retrait">{titre}</span>
          <span className="titre-eclaire" aria-hidden="true">
            {titre}
          </span>
        </h2>

        {children}
      </div>
    </section>
  );
}
