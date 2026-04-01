"use client";

import { useEffect, useRef, useState } from "react";
import type { StatsDto } from "@portfolio/shared-types";
import { useTranslation } from "@/lib/i18n/i18n-context";

interface StatCounterProps {
  target: number;
  label: string;
  isVisible: boolean;
  delay?: number;
}

function StatCounter({ target, label, isVisible, delay = 0 }: StatCounterProps) {
  const [count, setCount] = useState(0);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!isVisible || animatedRef.current) return;
    animatedRef.current = true;

    const duration = 1200;
    const startTime = performance.now() + delay;

    const step = (currentTime: number) => {
      if (currentTime < startTime) {
        requestAnimationFrame(step);
        return;
      }
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [isVisible, target, delay]);

  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4">
      <span className="text-4xl font-bold tabular-nums leading-none">
        {count}
        <span className="text-2xl">+</span>
      </span>
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">
        {label}
      </span>
    </div>
  );
}

interface StatsSectionProps {
  stats: StatsDto;
}

export function StatsSection({ stats }: StatsSectionProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const items = [
    { value: stats.projects, labelKey: "stats.projects" },
    { value: stats.certifications, labelKey: "stats.certifications" },
    { value: stats.technologies, labelKey: "stats.technologies" },
    { value: stats.experiences, labelKey: "stats.experiences" },
  ] as const;

  return (
    <div ref={ref} className="w-full">
      <div className="mx-auto px-8 md:px-20 lg:px-40 xl:px-52 py-8">
        <div className="bg-foreground/5 backdrop-blur-sm border border-border/50 rounded-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/40">
            {items.map((item, index) => (
              <StatCounter
                key={item.labelKey}
                target={item.value}
                label={t(item.labelKey)}
                isVisible={isVisible}
                delay={index * 150}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
