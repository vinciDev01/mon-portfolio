"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import fr from "./fr.json";
import en from "./en.json";
import de from "./de.json";

export type Locale = "fr" | "en" | "de";

const dictionaries: Record<Locale, Record<string, string>> = { fr, en, de };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(defaultLocale: Locale): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = localStorage.getItem("portfolio-locale") as Locale | null;
  if (stored && dictionaries[stored]) return stored;
  return defaultLocale;
}

export function I18nProvider({
  defaultLocale = "fr",
  children,
}: {
  defaultLocale?: string;
  children: ReactNode;
}) {
  const safeDefault = (dictionaries[defaultLocale as Locale] ? defaultLocale : "fr") as Locale;
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale(safeDefault));

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("portfolio-locale", newLocale);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return dictionaries[locale][key] ?? dictionaries.fr[key] ?? key;
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
