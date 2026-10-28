"use client";

import { createContext, useContext, useCallback, useEffect, useSyncExternalStore, type ReactNode } from "react";
import fr from "./fr.json";
import en from "./en.json";
import de from "./de.json";

export type Locale = "fr" | "en" | "de";

const dictionaries: Record<Locale, Record<string, string>> = { fr, en, de };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const CLE_LANGUE = "portfolio-locale";
/** Prevenir les abonnes de cet onglet : `storage` ne part que vers les autres. */
const EVENEMENT_LANGUE = "portfolio-locale";

/** Le dernier choix de la page, pour un navigateur qui refuse le stockage :
 *  la langue change quand meme, sans etre retenue d'une visite a l'autre. */
let choixEnMemoire: Locale | null = null;

/** La langue choisie, lue dans le navigateur ; null si aucune n'est valide. */
function langueEnregistree(): Locale | null {
  try {
    const l = localStorage.getItem(CLE_LANGUE) as Locale | null;
    return l && dictionaries[l] ? l : null;
  } catch {
    return choixEnMemoire;
  }
}

function abonnerLangue(prevenir: () => void) {
  window.addEventListener("storage", prevenir);
  window.addEventListener(EVENEMENT_LANGUE, prevenir);
  return () => {
    window.removeEventListener("storage", prevenir);
    window.removeEventListener(EVENEMENT_LANGUE, prevenir);
  };
}

export function I18nProvider({
  defaultLocale = "fr",
  children,
}: {
  defaultLocale?: string;
  children: ReactNode;
}) {
  const safeDefault = (dictionaries[defaultLocale as Locale] ? defaultLocale : "fr") as Locale;
  // La langue enregistree, lue par React dans le navigateur ; au rendu
  // serveur, et donc a l'hydratation, la langue par defaut : aucune
  // divergence. Un choix fait dans un autre onglet suit aussi.
  const enregistree = useSyncExternalStore(abonnerLangue, langueEnregistree, () => null);
  const locale = enregistree ?? safeDefault;

  // Garde `lang` sur `<html>` synchronise avec la locale courante (assainie,
  // jamais la valeur brute) a chaque changement, WCAG 3.1.2. S'execute apres
  // le montage, donc le rendu serveur et le premier rendu client restent
  // identiques : aucune divergence d'hydratation.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    choixEnMemoire = newLocale;
    try {
      localStorage.setItem(CLE_LANGUE, newLocale);
    } catch {
      // Stockage refuse (navigation privee stricte) : la langue ne suit pas.
    }
    window.dispatchEvent(new Event(EVENEMENT_LANGUE));
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const brut = dictionaries[locale][key] ?? dictionaries.fr[key] ?? key;
      if (!params) return brut;
      return brut.replace(/\{(\w+)\}/g, (_, nom: string) => params[nom] ?? `{${nom}}`);
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
