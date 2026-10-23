"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { removeToken } from "@/lib/auth";

type Item = { href: string; label: string };

const avantSections: Item[] = [
  { href: "/", label: "Tableau de bord" },
  { href: "/site-settings", label: "Paramètres du site" },
  { href: "/personal-info", label: "Informations personnelles" },
];

/** Les pages qui remplissent une section du portfolio, regroupees sous un
 *  seul titre deroulable. */
const sections: Item[] = [
  { href: "/presentations", label: "Présentations" },
  { href: "/skills", label: "Compétences" },
  { href: "/experiences", label: "Expériences" },
  { href: "/certifications", label: "Certifications" },
  { href: "/projects", label: "Projets" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "À propos" },
  { href: "/testimonials", label: "Témoignages" },
];

const apresSections: Item[] = [
  { href: "/technologies", label: "Technologies" },
  { href: "/organizations", label: "Organisations" },
  { href: "/contact-messages", label: "Messages de contact" },
  { href: "/cv-sections", label: "Sections du CV" },
  { href: "/blog", label: "Blog" },
];

function estActif(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Lien({ item, pathname, retrait = false }: { item: Item; pathname: string; retrait?: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={estActif(item.href, pathname) ? "page" : undefined}
      className={cn(
        "px-3 py-2 rounded-md text-sm transition-colors",
        retrait && "pl-6",
        estActif(item.href, pathname)
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-accent"
      )}
    >
      {item.label}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  // Ferme par defaut, sauf si la page ouverte en fait partie : l'entree active
  // doit rester visible.
  const [sectionsOuvertes, setSectionsOuvertes] = useState(() =>
    sections.some((s) => estActif(s.href, pathname)),
  );

  function handleLogout() {
    removeToken();
    router.replace("/login");
  }

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-card p-4 flex flex-col gap-1">
      <div className="px-3 py-4 mb-4">
        <h1 className="text-lg font-bold">Portfolio Admin</h1>
        <p className="text-xs text-muted-foreground">Backoffice</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {avantSections.map((item) => (
          <Lien key={item.href} item={item} pathname={pathname} />
        ))}
        <button
          type="button"
          onClick={() => setSectionsOuvertes((o) => !o)}
          aria-expanded={sectionsOuvertes}
          aria-controls="nav-sections"
          className="px-3 py-2 rounded-md text-sm text-left text-foreground hover:bg-accent transition-colors flex items-center justify-between cursor-pointer"
        >
          Sections
          <svg
            className={cn("size-4 transition-transform", sectionsOuvertes && "rotate-90")}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div id="nav-sections" hidden={!sectionsOuvertes} className="flex flex-col gap-1">
          {sections.map((item) => (
            <Lien key={item.href} item={item} pathname={pathname} retrait />
          ))}
        </div>
        {apresSections.map((item) => (
          <Lien key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="mt-4 pt-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 rounded-md text-sm text-left text-destructive hover:bg-destructive/10 transition-colors"
        >
          Deconnexion
        </button>
      </div>
    </aside>
  );
}
