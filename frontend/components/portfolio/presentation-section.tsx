"use client";

import type { PresentationDto } from "@portfolio/shared-types";

interface PresentationSectionProps {
  presentations: PresentationDto[];
}

function PresentationCard({ item, index }: { item: PresentationDto; index: number }) {
  return (
    // Resserrees pour que l'ouverture tienne sur un ecran : 40 px entre deux
    // cartes. Les tailles vivent dans la feuille, qui les adapte a la largeur
    // et a la hauteur de l'ecran.
    <div className="mesure" style={index > 0 ? { marginTop: "var(--espace-4)" } : undefined}>
      <h3 className="presentation-titre">
        {item.title}
      </h3>
      {item.subtitle && (
        <p className="mesure presentation-sous-titre">
          {item.subtitle}
        </p>
      )}
      {item.description && (
        <p className="mesure presentation-texte">
          {item.description}
        </p>
      )}
    </div>
  );
}

/**
 * Les cartes de presentation seules. Le portrait n'est plus d'ici : il appartient
 * a la section d'ouverture, qui est inconditionnelle, alors que ces cartes
 * dependent de `showPresentations`.
 */
export function PresentationSection({ presentations }: PresentationSectionProps) {
  if (!presentations.length) return null;

  return (
    <>
      {presentations.map((item, index) => (
        <PresentationCard key={item.id} item={item} index={index} />
      ))}
    </>
  );
}
