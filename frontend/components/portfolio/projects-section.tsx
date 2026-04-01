"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { ProjectDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { SectionWrapper } from "./section-wrapper";
import { SeeMoreList } from "./see-more-button";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/i18n-context";

interface ProjectsSectionProps {
  projects: ProjectDto[];
}

function formatDate(dateStr: string | null, locale: string) {
  if (!dateStr) return null;
  const localeMap: Record<string, string> = { fr: "fr-FR", en: "en-US", de: "de-DE" };
  return new Date(dateStr).toLocaleDateString(localeMap[locale] || "fr-FR", {
    month: "short",
    year: "numeric",
  });
}

function ProjectCard({
  project,
  onSelect,
}: {
  project: ProjectDto;
  onSelect: () => void;
}) {
  const photo1Url = getFileUrl(project.photo1Path);
  const photo2Url = getFileUrl(project.photo2Path);
  const photos = [photo1Url, photo2Url].filter(Boolean) as string[];
  const { t } = useTranslation();

  return (
    <div
      className="animated-card bg-card rounded-xl overflow-hidden transition-colors flex flex-col cursor-pointer hover:shadow-lg"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
    >
      {photos.length > 0 && (
        <div
          className={`grid gap-px bg-border ${photos.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {photos.map((url, idx) => (
            <div key={idx} className="relative h-44 bg-muted">
              <Image
                src={url}
                alt={`${project.name} - photo ${idx + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        <h3 className="font-semibold text-base leading-snug">{project.name}</h3>

        {project.description && (
          <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">
            {project.description}
          </p>
        )}

        {project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {project.technologies.map((tech) => (
              <span
                key={tech.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground border border-border"
              >
                {tech.logoPath && (
                  <Image
                    src={getFileUrl(tech.logoPath)!}
                    alt={tech.label}
                    width={12}
                    height={12}
                    className="object-contain"
                  />
                )}
                {tech.label}
              </span>
            ))}
          </div>
        )}

        <span className="text-xs text-muted-foreground mt-auto">
          {t("projects.clickForDetails")}
        </span>
      </div>
    </div>
  );
}

function ProjectDetailModal({
  project,
  onClose,
}: {
  project: ProjectDto;
  onClose: () => void;
}) {
  const photo1Url = getFileUrl(project.photo1Path);
  const photo2Url = getFileUrl(project.photo2Path);
  const photos = [photo1Url, photo2Url].filter(Boolean) as string[];
  const audiences = project.targetAudience
    ?.split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  const { t, locale } = useTranslation();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 size-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors cursor-pointer"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {photos.length > 0 && (
          <div
            className={`grid gap-px bg-border ${photos.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {photos.map((url, idx) => (
              <div key={idx} className="relative h-56 bg-muted">
                <Image
                  src={url}
                  alt={`${project.name} - photo ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="p-6 flex flex-col gap-5">
          <h2 className="text-xl font-bold">{project.name}</h2>

          {(project.startDate || project.endDate) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {formatDate(project.startDate, locale) ?? "..."} — {formatDate(project.endDate, locale) ?? t("projects.ongoing")}
              </span>
            </div>
          )}

          {project.description && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          )}

          {audiences && audiences.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">{t("projects.targetAudience")}</h4>
              <div className="flex flex-wrap gap-2">
                {audiences.map((a, i) => (
                  <span key={i} className="px-3 py-1 text-xs rounded-full bg-foreground text-background">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.technologies.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">{t("projects.technologies")}</h4>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-muted text-muted-foreground border border-border"
                  >
                    {tech.logoPath && (
                      <Image
                        src={getFileUrl(tech.logoPath)!}
                        alt={tech.label}
                        width={14}
                        height={14}
                        className="object-contain"
                      />
                    )}
                    {tech.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.collaborators.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">{t("projects.collaborators")}</h4>
              <div className="space-y-2">
                {project.collaborators.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 text-sm">
                    <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {c.firstName[0]}{c.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{c.firstName} {c.lastName}</span>
                      {c.email && <span className="text-muted-foreground ml-2">{c.email}</span>}
                    </div>
                    {c.linkedinUrl && (
                      <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => e.stopPropagation()}>
                        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.demoUrl && (
            <Button asChild variant="outline" size="sm" className="w-fit">
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                {t("projects.viewDemo")}
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const [selected, setSelected] = useState<ProjectDto | null>(null);
  const { t } = useTranslation();

  if (!projects.length) return null;

  return (
    <SectionWrapper id="projects" title={t("section.projects")}>
      <SeeMoreList
        items={projects}
        initialCount={4}
        renderItem={(project) => (
          <ProjectCard key={project.id} project={project} onSelect={() => setSelected(project)} />
        )}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      />
      {selected && (
        <ProjectDetailModal project={selected} onClose={() => setSelected(null)} />
      )}
    </SectionWrapper>
  );
}
