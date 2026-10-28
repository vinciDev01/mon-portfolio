"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";

/** Le jeton ne change pas sous nos yeux : rien a ecouter. */
const sansAbonnement = () => () => {};

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  // Le jeton est lu dans le navigateur au rendu meme ; `null` au rendu
  // serveur, ou il n'existe pas. Pas d'etat recopie dans un effet.
  const connecte = useSyncExternalStore(sansAbonnement, isAuthenticated, () => null);

  // Seule la redirection est un effet : elle touche le routeur.
  useEffect(() => {
    if (!isLoginPage && connecte === false) router.replace("/login");
  }, [router, isLoginPage, connecte]);

  if (!isLoginPage && connecte !== true) return null;

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
