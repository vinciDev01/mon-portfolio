import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
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

  try {
    const settings = await getSiteSettings();
    defaultLanguage = settings.defaultLanguage || "fr";
    respecterMouvementReduit = settings.respectReducedMotion;

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

    // Accent, borne par le DTO a 30% de saturation
    styleVars["--accent"] = `hsl(${settings.accentHue} ${settings.accentSaturation}% 54%)`;

    dynamicStyle = styleVars as React.CSSProperties;
  } catch {
    // Fall back to CSS defaults if API is unavailable
  }

  return (
    <html
      lang="fr"
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
        {googleFontUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontUrl} />
          </>
        )}
      </head>
      <body>
        <ThemeProvider forcedTheme="dark">
          <I18nProvider defaultLocale={defaultLanguage}>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
