"use client";

import type { PresentationDto } from "@portfolio/shared-types";

interface PresentationSectionProps {
  presentations: PresentationDto[];
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
