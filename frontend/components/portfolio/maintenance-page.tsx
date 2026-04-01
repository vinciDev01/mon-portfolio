"use client";

import { useTranslation } from "@/lib/i18n/i18n-context";

export function MaintenancePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-foreground/5 border border-border">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
          aria-hidden="true"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </div>

      <div className="flex flex-col gap-2 max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">{t("maintenance.title")}</h1>
        <p className="text-muted-foreground">{t("maintenance.message")}</p>
      </div>
    </div>
  );
}
