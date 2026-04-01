"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation, type Locale } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";

const languages: { code: Locale; label: string; short: string }[] = [
  { code: "fr", label: "Francais", short: "FR" },
  { code: "en", label: "English", short: "EN" },
  { code: "de", label: "Deutsch", short: "DE" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = languages.find((l) => l.code === locale) ?? languages[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
        aria-label="Language"
      >
        {/* Globe icon */}
        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{current!.short}</span>
        <svg className={cn("size-3 transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-border bg-card shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLocale(lang.code); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors cursor-pointer",
                locale === lang.code
                  ? "bg-foreground/5 font-medium"
                  : "hover:bg-muted",
              )}
            >
              <span className="text-xs font-bold text-muted-foreground w-5">{lang.short}</span>
              <span>{lang.label}</span>
              {locale === lang.code && (
                <svg className="size-3.5 ml-auto text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
