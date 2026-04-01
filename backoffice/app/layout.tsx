import "./globals.css";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app-shell";

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
        <AppShell>{children}</AppShell>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
