"use client";

import type { PersonalInfoDto } from "@portfolio/shared-types";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { LiensReseaux } from "@/components/portfolio/liens-reseaux";

interface FooterProps {
  personalInfo: PersonalInfoDto;
}

export function Footer({ personalInfo }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="py-5 gouttiere-parcours border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* En version compacte : le pied tient avec Contact sur un ecran. */}
        <LiensReseaux infos={personalInfo} className="liens-reseaux-compacts" />

        <p className="text-xs text-muted-foreground">
          &copy; {currentYear}{" "}
          {personalInfo.name} {personalInfo.surname}. {t("footer.allRights")}
        </p>
      </div>
    </footer>
  );
}
