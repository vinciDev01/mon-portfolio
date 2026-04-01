"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true);
      return;
    }
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [router, pathname, isLoginPage]);

  if (!checked) return null;

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
