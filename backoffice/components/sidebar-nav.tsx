"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Tableau de bord" },
  { href: "/site-settings", label: "Paramètres du site" },
  { href: "/personal-info", label: "Informations personnelles" },
  { href: "/technologies", label: "Technologies" },
  { href: "/organizations", label: "Organisations" },
  { href: "/presentations", label: "Présentations" },
  { href: "/skills", label: "Compétences" },
  { href: "/experiences", label: "Expériences" },
  { href: "/certifications", label: "Certifications" },
  { href: "/projects", label: "Projets" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "À propos" },
  { href: "/contact-messages", label: "Messages de contact" },
  { href: "/testimonials", label: "Témoignages" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-card p-4 flex flex-col gap-1">
      <div className="px-3 py-4 mb-4">
        <h1 className="text-lg font-bold">Portfolio Admin</h1>
        <p className="text-xs text-muted-foreground">Backoffice</p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
