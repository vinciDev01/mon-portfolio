"use client";

import { useTranslation } from "@/lib/i18n/i18n-context";

interface AvailabilityBadgeProps {
  status: string;
  label: string | null;
}

const statusConfig = {
  available: {
    dot: "bg-green-500",
    pulse: "bg-green-500",
    text: "text-green-700 dark:text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    translationKey: "availability.available",
  },
  busy: {
    dot: "bg-orange-500",
    pulse: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    translationKey: "availability.busy",
  },
  unavailable: {
    dot: "bg-gray-400",
    pulse: "bg-gray-400",
    text: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-400/10 border-gray-400/20",
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
        {key !== "unavailable" && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${config.pulse}`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dot}`} />
      </span>
      {displayLabel}
    </span>
  );
}
