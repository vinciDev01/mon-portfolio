"use client";

import type { PersonalInfoDto, PresentationDto } from "@portfolio/shared-types";
import { Medaillon, aUnPortrait } from "@/components/parcours/medaillon";

interface PresentationSectionProps {
  presentations: PresentationDto[];
  infos: PersonalInfoDto;
}

function PresentationCard({ item, index }: { item: PresentationDto; index: number }) {
  return (
    <div className="mesure" style={index > 0 ? { marginTop: "var(--espace-5)" } : undefined}>
      <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-4">
        {item.title}
      </h3>
      {item.subtitle && (
        <p className="mesure text-lg md:text-xl text-muted-foreground font-medium mb-6">
          {item.subtitle}
        </p>
      )}
      {item.description && (
        <p className="mesure text-base md:text-lg text-muted-foreground leading-relaxed">
          {item.description}
        </p>
      )}
    </div>
  );
}

export function PresentationSection({ presentations, infos }: PresentationSectionProps) {
  // Deux cas distincts : showPresentations a faux cache l'ouverture
  // deliberement (page.tsx n'appelle alors pas ce composant) ; une liste vide
  // avec la section active ne doit pas replier le portrait avec elle.
  if (!presentations.length && !aUnPortrait(infos)) return null;

  return (
    <>
      <Medaillon infos={infos} />
      {presentations.map((item, index) => (
        <PresentationCard key={item.id} item={item} index={index} />
      ))}
    </>
  );
}
