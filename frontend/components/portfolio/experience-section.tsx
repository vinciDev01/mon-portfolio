"use client";

import type { ExperienceDto } from "@portfolio/shared-types";
import { SectionWrapper } from "./section-wrapper";
import { SeeMoreList } from "./see-more-button";

interface ExperienceSectionProps {
  experiences: ExperienceDto[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function ExperienceCard({ experience }: { experience: ExperienceDto }) {
  return (
    <div className="relative pl-8 pb-10 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
      {/* Timeline dot */}
      <div className="absolute left-[-4px] top-1.5 size-2 rounded-full bg-foreground border-2 border-background" />

      <div className="animated-card bg-card rounded-xl p-6 transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-semibold text-base">{experience.role}</h3>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">
              {experience.company}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {experience.isCurrent && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-foreground text-background">
                En cours
              </span>
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(experience.startDate)} &mdash;{" "}
              {experience.endDate ? formatDate(experience.endDate) : "Aujourd'hui"}
            </span>
          </div>
        </div>
        {experience.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {experience.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  if (!experiences.length) return null;

  return (
    <SectionWrapper id="experience" title="Expérience">
      <SeeMoreList
        items={experiences}
        initialCount={3}
        renderItem={(experience) => (
          <ExperienceCard key={experience.id} experience={experience} />
        )}
        className="flex flex-col"
      />
    </SectionWrapper>
  );
}
