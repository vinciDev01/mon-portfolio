import type { Metadata } from "next";
import { Geist_Mono, Figtree } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { getSiteSettings } from "@/lib/api";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Mon portfolio professionnel",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let dynamicStyle: React.CSSProperties = {};

  try {
    const settings = await getSiteSettings();

    const styleVars: Record<string, string> = {};
    if (settings.bgColor) {
      styleVars["--portfolio-bg"] = settings.bgColor;
    }
    if (settings.textColor) {
      styleVars["--portfolio-text"] = settings.textColor;
    }
    if (settings.fontSize) {
      styleVars["--portfolio-font-size"] = `${settings.fontSize}px`;
    }
    if (settings.fontFamily) {
      styleVars["--portfolio-font-family"] = settings.fontFamily;
    }

    dynamicStyle = styleVars as React.CSSProperties;
  } catch {
    // Fall back to CSS defaults if API is unavailable
  }

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        figtree.variable,
      )}
    >
      <body style={dynamicStyle}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
