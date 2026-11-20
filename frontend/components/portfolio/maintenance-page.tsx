"use client";

import { useTranslation } from "@/lib/i18n/i18n-context";
import { IllustrationMaintenance } from "@/components/portfolio/illustration-maintenance";

export function MaintenancePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <IllustrationMaintenance className="w-full max-w-xs sm:max-w-sm h-auto" />

      <div className="flex flex-col gap-2 max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">{t("maintenance.title")}</h1>
        <p className="text-muted-foreground">{t("maintenance.message")}</p>
      </div>
    </div>
  );
}
