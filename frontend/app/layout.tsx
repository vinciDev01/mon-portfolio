import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { scriptInitial } from "@/lib/theme/script-initial";
import type { Strategie } from "@/lib/theme/regle-horaire";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";
import { getSiteSettings } from "@/lib/api";
import { ECHELLE_TYPO } from "@/lib/design/tokens";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const POLICE_PAR_DEFAUT = "IBM Plex Sans";
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
  let respecterMouvementReduit = true;
  let strategie: Strategie = "auto";

  try {
    const settings = await getSiteSettings();
    defaultLanguage = settings.defaultLanguage || "fr";
    respecterMouvementReduit = settings.respectReducedMotion;
    const brut = settings.themeParDefaut;
    strategie = brut === "clair" || brut === "sombre" ? brut : "auto";

    const styleVars: Record<string, string> = {};
    if (settings.fontSize) {
      styleVars["--portfolio-font-size"] = `${settings.fontSize}px`;
    }
    if (settings.fontFamily && settings.fontFamily !== POLICE_PAR_DEFAUT) {
      styleVars["--portfolio-font-family"] = `'${settings.fontFamily}', sans-serif`;
      const encodedFamily = settings.fontFamily.replace(/ /g, "+");
      googleFontUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@300;400;500;600;700&display=swap`;
    }

    // Echelle typographique
    styleVars["--ratio"] = String(ECHELLE_TYPO[settings.typeScale] ?? ECHELLE_TYPO.normal);
    styleVars["--portfolio-line-height"] = String(settings.lineHeight);
    styleVars["--portfolio-section-spacing"] = `${settings.sectionSpacing}px`;
    styleVars["--portfolio-zigzag"] = String(settings.zigzagAmplitude / 100);

    // Mouvement
    styleVars["--portfolio-animation-speed"] = String(
      settings.animationsEnabled ? settings.animationSpeed : 0.001,
    );

    dynamicStyle = styleVars as React.CSSProperties;
  } catch {
    // Fall back to CSS defaults if API is unavailable
  }

  return (
    <html
      lang={defaultLanguage}
      suppressHydrationWarning
      data-mouvement={respecterMouvementReduit ? undefined : "force"}
      style={dynamicStyle}
      className={cn(
        "antialiased",
        plexMono.variable,
        plexSans.variable,
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptInitial(strategie) }} />
        {googleFontUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontUrl} />
          </>
        )}
      </head>
      <body>
        <ThemeProvider strategie={strategie}>
          <I18nProvider defaultLocale={defaultLanguage}>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
