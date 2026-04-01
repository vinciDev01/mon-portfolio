"use client";

import { useEffect, useRef } from "react";

interface ScrollAnimateProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function ScrollAnimate({ children, delay = 0, className }: ScrollAnimateProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => {
                el.classList.remove("scroll-hidden");
                el.classList.add("scroll-visible");
              }, delay);
            } else {
              el.classList.remove("scroll-hidden");
              el.classList.add("scroll-visible");
            }
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [delay]);

  return (
    <div ref={ref} className={`scroll-hidden ${className ?? ""}`}>
      {children}
    </div>
  );
}
