"use client";

import type { ExperienceDto, ProjectDto } from "@portfolio/shared-types";
import { SeeMoreList } from "./see-more-button";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { projetsParExperience } from "@/lib/portfolio/experience-projets";

interface ExperienceSectionProps {
  experiences: ExperienceDto[];
  /** Tous les projets : chaque carte ne garde que ceux de son experience. */
  projets: ProjectDto[];
}

const localeMap: Record<string, string> = { fr: "fr-FR", en: "en-US", de: "de-DE" };

function ExperienceCard({
  experience,
  projets,
}: {
  experience: ExperienceDto;
  projets: ProjectDto[];
}) {
  const { t, locale } = useTranslation();

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(localeMap[locale] || "fr-FR", { month: "long", year: "numeric" });
  }

  return (
    <div className="relative pl-8 pb-10 last:pb-0">
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
      <div className="absolute left-[-4px] top-1.5 size-2 rounded-full bg-foreground border-2 border-background" />

      <div className="animated-card bg-card rounded-xl p-6 transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-semibold text-base">{experience.role}</h3>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">{experience.company}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {experience.isCurrent && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-foreground text-background">
                {t("experience.ongoing")}
              </span>
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(experience.startDate)} &mdash;{" "}
              {experience.endDate ? formatDate(experience.endDate) : t("experience.today")}
            </span>
          </div>
        </div>
        {experience.description && (
          <p className="mesure text-sm text-muted-foreground leading-relaxed">{experience.description}</p>
        )}
        {projets.length > 0 && (
          <div style={{ marginTop: "var(--espace-2)" }}>
            <p className="meta" id={`projets-${experience.id}`}>{t("experience.projects")}</p>
            <ul
              aria-labelledby={`projets-${experience.id}`}
              className="text-sm space-y-1"
              style={{ marginTop: "var(--espace-1)" }}
            >
              {projets.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function ExperienceSection({
  experiences,
  projets,
}: ExperienceSectionProps) {
  if (!experiences.length) return null;
  const parExperience = projetsParExperience(projets);

  return (
    <SeeMoreList
      items={experiences}
      initialCount={3}
      renderItem={(experience) => (
        <ExperienceCard
          key={experience.id}
          experience={experience}
          projets={parExperience.get(experience.id) ?? []}
        />
      )}
      className="flex flex-col"
    />
  );
}
