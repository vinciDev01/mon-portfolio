"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

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
  const visible = showAll ? items : items.slice(0, initialCount);

  return (
    <>
      <div className={className}>
        {visible.map((item, i) => renderItem(item, i))}
      </div>
      {items.length > initialCount && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="px-8"
          >
            {showAll ? "Voir moins" : "Voir plus..."}
          </Button>
        </div>
      )}
    </>
  );
}
