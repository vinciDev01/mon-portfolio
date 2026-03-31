import type { PresentationDto } from "@portfolio/shared-types";
import { SeeMoreList } from "./see-more-button";

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
      className="min-h-[60vh] flex items-center py-20 px-6 md:px-12 lg:px-24"
    >
      {presentations.length === 1 ? (
        <PresentationCard item={presentations[0]!} />
      ) : (
        <div className="w-full">
          <SeeMoreList
            items={presentations}
            initialCount={1}
            renderItem={(item) => (
              <div key={item.id} className="mb-12">
                <PresentationCard item={item} />
              </div>
            )}
          />
        </div>
      )}
    </section>
  );
}
