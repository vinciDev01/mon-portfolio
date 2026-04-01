"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { removeToken } from "@/lib/auth";

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
  { href: "/blog", label: "Blog" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

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
