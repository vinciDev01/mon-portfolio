import Image from "next/image";
import Link from "next/link";
import type { SiteSettingsDto, PersonalInfoDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  siteSettings: SiteSettingsDto;
  personalInfo: PersonalInfoDto;
}

const navLinks = [
  { href: "#presentation", label: "Présentation" },
  { href: "#skills", label: "Compétences" },
  { href: "#experience", label: "Expérience" },
  { href: "#certifications", label: "Certifications" },
  { href: "#projects", label: "Projets" },
  { href: "#services", label: "Services" },
  { href: "#about", label: "À propos" },
];

export function Header({ siteSettings, personalInfo }: HeaderProps) {
  const logoUrl = getFileUrl(siteSettings.logoPath);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 flex items-center justify-between h-16 gap-4">
        {/* Logo / Name */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Accueil"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${personalInfo.name} logo`}
              width={36}
              height={36}
              className="rounded-md object-contain"
            />
          ) : null}
          <span className="font-semibold text-base tracking-tight">
            {personalInfo.name} {personalInfo.surname}
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          className="hidden lg:flex items-center gap-1"
          aria-label="Navigation principale"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          {siteSettings.cvFilePath && (
            <Button asChild size="sm">
              <a href="/api/download-cv" download="CV.pdf">
                Telecharger CV
              </a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
