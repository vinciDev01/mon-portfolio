import "./globals.css";
import { SidebarNav } from "@/components/sidebar-nav";
import { Toaster } from "sonner";

export const metadata = {
  title: "Portfolio Admin",
  description: "Backoffice d'administration du portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <div className="flex min-h-screen">
          <SidebarNav />
          <main className="flex-1 p-8">{children}</main>
        </div>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
