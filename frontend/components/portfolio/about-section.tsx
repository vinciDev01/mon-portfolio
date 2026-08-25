"use client";

import type { AboutDto } from "@portfolio/shared-types";

interface AboutSectionProps {
  about: AboutDto[];
}

export function AboutSection({ about }: AboutSectionProps) {
  if (!about.length) return null;

  return (
    <>
      <div className="mesure space-y-5">
        {about.map((item) => (
          <p key={item.id} className="text-base text-muted-foreground leading-relaxed">
            {item.content}
          </p>
        ))}
      </div>
    </>
  );
}
