import Image from "next/image";
import type { SkillDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { SectionWrapper } from "./section-wrapper";
import { SeeMoreList } from "./see-more-button";

interface SkillsSectionProps {
  skills: SkillDto[];
}

function SkillCard({ skill }: { skill: SkillDto }) {
  const logoUrl = getFileUrl(skill.technology.logoPath);

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-muted-foreground/30 transition-colors group">
      <div className="size-12 flex items-center justify-center">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${skill.technology.label} logo`}
            width={48}
            height={48}
            className="object-contain group-hover:scale-110 transition-transform"
          />
        ) : (
          <div className="size-12 rounded-lg bg-muted flex items-center justify-center">
            <span className="text-lg font-bold text-muted-foreground">
              {skill.technology.label.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-center leading-tight">
        {skill.technology.label}
      </span>
      {skill.proficiency !== null && (
        <div className="w-full">
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground/60 transition-all"
              style={{ width: `${skill.proficiency}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  if (!skills.length) return null;

  return (
    <SectionWrapper id="skills" title="Compétences">
      <SeeMoreList
        items={skills}
        initialCount={8}
        renderItem={(skill) => <SkillCard key={skill.id} skill={skill} />}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
      />
    </SectionWrapper>
  );
}
