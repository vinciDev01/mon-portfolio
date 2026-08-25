"use client";

import { useTranslation } from "@/lib/i18n/i18n-context";

interface AvailabilityBadgeProps {
  status: string;
  label: string | null;
}

// Seul l'etat "disponible" recoit la couleur d'accent : les autres etats
// (occupe, indisponible) restent neutres — le texte du badge les distingue,
// pas une couleur d'alerte hors palette (pas d'orange, pas de rouge).
const statusConfig = {
  available: {
    dot: "bg-accent",
    text: "text-accent",
    bg: "bg-accent/10 border-accent/20",
    translationKey: "availability.available",
  },
  busy: {
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    bg: "bg-muted-foreground/10 border-muted-foreground/20",
    translationKey: "availability.busy",
  },
  unavailable: {
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    bg: "bg-muted-foreground/10 border-muted-foreground/20",
    translationKey: "availability.unavailable",
  },
} as const;

type StatusKey = keyof typeof statusConfig;

export function AvailabilityBadge({ status, label }: AvailabilityBadgeProps) {
  const { t } = useTranslation();

  const key: StatusKey = (status as StatusKey) in statusConfig ? (status as StatusKey) : "unavailable";
  const config = statusConfig[key];
  const displayLabel = label ?? t(config.translationKey);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dot}`} />
      </span>
      {displayLabel}
    </span>
  );
}
