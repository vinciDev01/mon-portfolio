import type { Metadata } from "next";
import { Geist_Mono, Figtree } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";
import { getSiteSettings } from "@/lib/api";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const DEFAULT_FONT = "Figtree";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    const title = settings.seoTitle ?? "Portfolio";
    const description = settings.seoDescription ?? "Mon portfolio professionnel";
    const imageUrl = settings.seoImagePath
      ? `${API_URL}/uploads/${settings.seoImagePath}`
      : undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        ...(imageUrl && {
          images: [{ url: imageUrl }],
        }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(imageUrl && { images: [imageUrl] }),
      },
    };
  } catch {
    return {
      title: "Portfolio",
      description: "Mon portfolio professionnel",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let dynamicStyle: React.CSSProperties = {};
  let googleFontUrl: string | null = null;
  let defaultLanguage = "fr";

  try {
    const settings = await getSiteSettings();
    defaultLanguage = settings.defaultLanguage || "fr";

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
    if (settings.fontFamily && settings.fontFamily !== DEFAULT_FONT) {
      styleVars["--portfolio-font-family"] = `'${settings.fontFamily}', sans-serif`;
      const encodedFamily = settings.fontFamily.replace(/ /g, "+");
      googleFontUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@300;400;500;600;700&display=swap`;
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
        figtree.variable,
      )}
    >
      <head>
        {googleFontUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontUrl} />
          </>
        )}
      </head>
      <body style={dynamicStyle}>
        <ThemeProvider>
          <I18nProvider defaultLocale={defaultLanguage}>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
