import type { Metadata } from "next";
import { Literata, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { scriptInitial } from "@/lib/theme/script-initial";
import type { Strategie } from "@/lib/theme/regle-horaire";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";
import { getSiteSettings } from "@/lib/api";
import { urlDuSite } from "@/lib/seo/seo";
import { ECHELLE_TYPO } from "@/lib/design/tokens";

/**
 * Literata porte le texte. Son axe optique remplace une seconde famille :
 * les titres en `opsz 48` ont des empattements plus francs et un contraste
 * plus marque que le corps en `opsz 12`, ce qui donne la hierarchie sans
 * charger une police de plus.
 *
 * Aucun tableau `weight` : on laisse Next.js servir la police VARIABLE.
 * Specifier des graisses explicites force des instances statiques, ce qui
 * multipliait les fichiers dans la version precedente du site.
 */
const literata = Literata({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

const POLICE_PAR_DEFAUT = "Literata";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    const site = urlDuSite(settings);
    const title = settings.seoTitle ?? "Portfolio";
    const description = settings.seoDescription ?? "Mon portfolio professionnel";
    // L'image choisie au backoffice, sinon celle que le site genere (nom et
    // poste) : un lien partage n'est jamais sans apercu.
    const image = settings.seoImagePath ? `${API_URL}/uploads/${settings.seoImagePath}` : `${site}/og`;

    return {
      metadataBase: new URL(site),
      title: { default: title, template: `%s | ${title}` },
      description,
      alternates: { canonical: "/" },
      // En maintenance, le site ne se fait pas indexer.
      robots: settings.maintenanceMode ? { index: false, follow: false } : { index: true, follow: true },
      openGraph: {
        type: "website",
        url: "/",
        siteName: title,
        title,
        description,
        locale: "fr_FR",
        alternateLocale: ["en_US", "de_DE"],
        images: [{ url: image, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
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
        literata.variable,
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
