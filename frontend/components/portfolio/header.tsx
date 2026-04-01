"use client";

import Image from "next/image";
import Link from "next/link";
import type { SiteSettingsDto, PersonalInfoDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { AvailabilityBadge } from "./availability-badge";

interface HeaderProps {
  siteSettings: SiteSettingsDto;
  personalInfo: PersonalInfoDto;
}

const allNavLinks = [
  { href: "#skills", tKey: "nav.skills", key: "showSkills" as const },
  { href: "#experience", tKey: "nav.experience", key: "showExperiences" as const },
  { href: "#certifications", tKey: "nav.certifications", key: "showCertifications" as const },
  { href: "#projects", tKey: "nav.projects", key: "showProjects" as const },
  { href: "#services", tKey: "nav.services", key: "showServices" as const },
  { href: "#about", tKey: "nav.about", key: "showAbout" as const },
  { href: "#testimonials", tKey: "nav.testimonials", key: "showTestimonials" as const },
  { href: "#contact", tKey: "nav.contact", key: "showContact" as const },
];

export function Header({ siteSettings, personalInfo }: HeaderProps) {
  const logoUrl = getFileUrl(siteSettings.logoPath);
  const { t } = useTranslation();

  const navLinks = allNavLinks.filter((link) => siteSettings[link.key]);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto px-8 md:px-20 lg:px-40 xl:px-52 flex items-center justify-between h-16 gap-4">
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${personalInfo.name} logo`}
                width={36}
                height={36}
                className="rounded-md object-contain shrink-0"
              />
            ) : null}
            <span className="font-semibold text-base tracking-tight whitespace-nowrap">
              {personalInfo.name} {personalInfo.surname}
            </span>
          </Link>

          {siteSettings.availabilityStatus && (
            <AvailabilityBadge
              status={siteSettings.availabilityStatus}
              label={siteSettings.availabilityLabel}
            />
          )}
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              {t(link.tKey)}
            </Link>
          ))}
          <Link
            href="/blog"
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            {t("nav.blog")}
          </Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />

          {siteSettings.cvFilePath && (
            <Button asChild size="sm">
              <a href="/api/download-cv" download="CV.pdf">
                {t("nav.downloadCv")}
              </a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
