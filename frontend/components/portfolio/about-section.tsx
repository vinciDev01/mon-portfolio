"use client";

import type { AboutDto } from "@portfolio/shared-types";
import { SectionWrapper } from "./section-wrapper";
import { useTranslation } from "@/lib/i18n/i18n-context";

interface AboutSectionProps {
  about: AboutDto[];
}

export function AboutSection({ about }: AboutSectionProps) {
  const { t } = useTranslation();
  if (!about.length) return null;

  return (
    <SectionWrapper id="about" title={t("section.about")}>
      <div className="max-w-3xl space-y-5">
        {about.map((item) => (
          <p key={item.id} className="text-base text-muted-foreground leading-relaxed">
            {item.content}
          </p>
        ))}
      </div>
    </SectionWrapper>
  );
}
