"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation, type Locale } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";

const languages: { code: Locale; label: string; short: string }[] = [
  { code: "fr", label: "Francais", short: "FR" },
  { code: "en", label: "English", short: "EN" },
  { code: "de", label: "Deutsch", short: "DE" },
];

/** Globe : cercle, equateur, meridien. Traits seuls, sur `currentColor`. */
const PICTO_LANGUE =
  "M 14 8 a 6 6 0 1 1 -12 0 a 6 6 0 1 1 12 0 " +
  "M 2 8 h 12 " +
  "M 8 2 c 2.8 3.2 2.8 8.8 0 12 c -2.8 -3.2 -2.8 -8.8 0 -12";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();
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
      {/* WCAG 2.5.3 : le nom accessible contient le texte visible, soit le code
          court. Le libelle vient de `t()` et non d'une chaine anglaise en dur,
          le site etant trilingue. */}
      <button
        onClick={() => setOpen(!open)}
        className="entree-parcours cursor-pointer"
        aria-label={`${t("parcours.langue")} : ${current!.short}`}
        aria-expanded={open}
      >
        <svg
          className="picto-commande"
          viewBox="0 0 16 16"
          aria-hidden="true"
          focusable="false"
        >
          <path d={PICTO_LANGUE} />
        </svg>
        <span className="entree-nom">{current!.short}</span>
      </button>

      {open && (
        <div className="panneau-langue rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLocale(lang.code); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer",
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
