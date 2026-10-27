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

  // En UTC, comme les autres dates du site : une date saisie au 1er juillet,
  // enregistree a minuit UTC, ne doit pas devenir « juin » a l'ouest de
  // Greenwich.
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(localeMap[locale] || "fr-FR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  const mois = (dateStr: string) => dateStr.slice(0, 7);

  return (
    // Trois colonnes : la date a gauche, hors du cadre ; la frise ; le cadre.
    <div className="experience-ligne">
      <div className="experience-dates">
        {/* La periode sur une ligne, insecable : « mars 2026 a aujourd'hui ». */}
        <span className="experience-periode">
          <time dateTime={mois(experience.startDate)}>{formatDate(experience.startDate)}</time>
          {` ${t("experience.until")} `}
          {experience.endDate ? (
            <time dateTime={mois(experience.endDate)}>{formatDate(experience.endDate)}</time>
          ) : (
            <span>{t("experience.today")}</span>
          )}
        </span>
        {experience.isCurrent && <span className="experience-en-cours">{t("experience.ongoing")}</span>}
      </div>

      <div className="experience-frise" aria-hidden="true">
        <span className="experience-point" />
      </div>

      <div className="animated-card bg-card rounded-xl p-6 transition-colors">
        <div className="mb-3">
          <h3 className="font-semibold text-base">{experience.role}</h3>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">{experience.company}</p>
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
