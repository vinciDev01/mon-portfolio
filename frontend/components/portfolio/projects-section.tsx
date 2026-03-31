import Image from "next/image";
import type { ProjectDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { SectionWrapper } from "./section-wrapper";
import { SeeMoreList } from "./see-more-button";
import { Button } from "@/components/ui/button";

interface ProjectsSectionProps {
  projects: ProjectDto[];
}

function ProjectCard({ project }: { project: ProjectDto }) {
  const photo1Url = getFileUrl(project.photo1Path);
  const photo2Url = getFileUrl(project.photo2Path);
  const photos = [photo1Url, photo2Url].filter(Boolean) as string[];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-muted-foreground/30 transition-colors flex flex-col">
      {/* Project photos */}
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
          <p className="text-sm text-muted-foreground leading-relaxed flex-1">
            {project.description}
          </p>
        )}

        {/* Technology badges */}
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

        {project.demoUrl && (
          <Button asChild variant="outline" size="sm" className="w-fit mt-auto">
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir la demo
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  if (!projects.length) return null;

  return (
    <SectionWrapper id="projects" title="Projets">
      <SeeMoreList
        items={projects}
        initialCount={4}
        renderItem={(project) => (
          <ProjectCard key={project.id} project={project} />
        )}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      />
    </SectionWrapper>
  );
}
