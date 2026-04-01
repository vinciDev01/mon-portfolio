"use client";

import type { PresentationDto } from "@portfolio/shared-types";

interface PresentationSectionProps {
  presentations: PresentationDto[];
}

function PresentationCard({ item }: { item: PresentationDto }) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-4">
        {item.title}
      </h1>
      {item.subtitle && (
        <p className="text-xl md:text-2xl text-muted-foreground font-medium mb-6">
          {item.subtitle}
        </p>
      )}
      {item.description && (
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          {item.description}
        </p>
      )}
    </div>
  );
}

export function PresentationSection({ presentations }: PresentationSectionProps) {
  if (!presentations.length) return null;

  return (
    <section
      id="presentation"
      className="min-h-[60vh] flex items-center py-20 px-8 md:px-20 lg:px-40 xl:px-52"
    >
      <div className="w-full space-y-12">
        {presentations.map((item) => (
          <PresentationCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
