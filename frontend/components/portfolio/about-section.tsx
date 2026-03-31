import type { AboutDto } from "@portfolio/shared-types";
import { SectionWrapper } from "./section-wrapper";

interface AboutSectionProps {
  about: AboutDto[];
}

export function AboutSection({ about }: AboutSectionProps) {
  if (!about.length) return null;

  return (
    <SectionWrapper id="about" title="A propos">
      <div className="max-w-3xl space-y-5">
        {about.map((item) => (
          <p
            key={item.id}
            className="text-base text-muted-foreground leading-relaxed"
          >
            {item.content}
          </p>
        ))}
      </div>
    </SectionWrapper>
  );
}
