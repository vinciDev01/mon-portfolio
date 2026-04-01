"use client";

import { useTranslation, type Locale } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";

const languages: { code: Locale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center rounded-md border border-border overflow-hidden">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={cn(
            "px-2 py-1 text-xs font-medium transition-colors cursor-pointer",
            locale === lang.code
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
