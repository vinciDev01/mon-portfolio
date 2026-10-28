"use client";

import type { ExperienceDto } from "@portfolio/shared-types";
import { SeeMoreList } from "./see-more-button";
import { Sentier } from "./sentier";
import { BordImparfait } from "./bord-imparfait";
import { useTranslation } from "@/lib/i18n/i18n-context";

interface ExperienceSectionProps {
  experiences: ExperienceDto[];
}

const localeMap: Record<string, string> = { fr: "fr-FR", en: "en-US", de: "de-DE" };

function ExperienceCard({ experience }: { experience: ExperienceDto }) {
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
    // Trois colonnes : la date a gauche, hors du cadre ; le sentier ; le cadre.
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
        <Sentier graine={experience.id} enCours={experience.isCurrent} />
      </div>

      {/* Le cadre : une feuille au bord imparfait, posee sur une autre un peu
          decalee, comme une pile de fiches. */}
      <div className="experience-carte cadre-imparfait">
        <BordImparfait graine={`${experience.id}:dessous`} className="feuille-dessous" />
        <BordImparfait graine={experience.id} anime={experience.isCurrent} />
        <div className="mb-3">
          <h3 className="font-semibold text-base">{experience.role}</h3>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">{experience.company}</p>
        </div>
        {experience.description && (
          <p className="mesure text-sm text-muted-foreground leading-relaxed">{experience.description}</p>
        )}
      </div>
    </div>
  );
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  if (!experiences.length) return null;

  return (
    <SeeMoreList
      items={experiences}
      initialCount={3}
      renderItem={(experience) => <ExperienceCard key={experience.id} experience={experience} />}
      className="liste-experiences flex flex-col"
    />
  );
}
