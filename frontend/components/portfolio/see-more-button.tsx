"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

interface SeeMoreListProps<T> {
  items: T[];
  initialCount: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}

export function SeeMoreList<T>({
  items,
  initialCount,
  renderItem,
  className,
}: SeeMoreListProps<T>) {
  const [showAll, setShowAll] = useState(false);
  const [animating, setAnimating] = useState(false);
  const firstNewRef = useRef<HTMLDivElement>(null);
  const remaining = items.length - initialCount;

  const visible = showAll ? items : items.slice(0, initialCount);

  useEffect(() => {
    if (!animating) return;
    const timer = setTimeout(() => setAnimating(false), 800);
    return () => clearTimeout(timer);
  }, [animating]);

  function handleExpand() {
    setAnimating(true);
    setShowAll(true);
    // Scroll to first new item after render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        firstNewRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    });
  }

  function handleCollapse() {
    setShowAll(false);
  }

  return (
    <>
      <div className={className}>
        {visible.map((item, i) => {
          const isNew = showAll && i >= initialCount;
          return (
            <div
              key={i}
              ref={isNew && i === initialCount ? firstNewRef : undefined}
              className={isNew && animating ? "see-more-item-enter" : ""}
              style={
                isNew && animating
                  ? { animationDelay: `${(i - initialCount) * 70}ms` }
                  : undefined
              }
            >
              {renderItem(item, i)}
            </div>
          );
        })}
      </div>
      {items.length > initialCount && (
        <div className="flex justify-center mt-8">
          <button
            onClick={showAll ? handleCollapse : handleExpand}
            className="group relative flex items-center gap-3 px-6 py-3 rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-border hover:border-foreground/20 transition-all duration-300 hover:shadow-lg cursor-pointer"
          >
            {showAll ? (
              <>
                <svg
                  className="size-4 text-muted-foreground group-hover:text-foreground transition-all duration-300 rotate-180 group-hover:-translate-y-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  Reduire
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center justify-center size-8 rounded-full bg-foreground text-background text-xs font-bold group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  +{remaining}
                </span>
                <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  Voir tout
                </span>
                <svg
                  className="size-4 text-muted-foreground group-hover:text-foreground transition-all duration-300 group-hover:translate-y-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
