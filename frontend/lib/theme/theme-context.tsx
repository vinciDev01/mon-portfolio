"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CLE_STOCKAGE, themeSelonHeure, type Strategie, type Theme } from "./regle-horaire";

type ValeurContexte = {
  theme: Theme;
  /** Vrai quand l'ampoule est allumee, c'est-a-dire en theme clair. */
  allumee: boolean;
  basculer: () => void;
};

const Contexte = createContext<ValeurContexte | null>(null);

/** Lit le theme deja pose sur <html> par le script initial. */
function themeCourant(strategie: Strategie): Theme {
  if (typeof document === "undefined") {
    // Rendu serveur : on ne connait ni l'heure locale ni le stockage.
    // Le script initial corrigera avant le premier trace.
    return strategie === "clair" ? "clair" : "sombre";
  }
  return document.documentElement.classList.contains("clair") ? "clair" : "sombre";
}

export function ThemeProvider({
  strategie,
  children,
}: {
  strategie: Strategie;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>(() => themeCourant(strategie));

  // Aligne l'etat React sur ce que le script initial a reellement pose.
  useEffect(() => {
    setTheme(themeCourant(strategie));
  }, [strategie]);

  const basculer = useCallback(() => {
    setTheme((actuel) => {
      const suivant: Theme = actuel === "clair" ? "sombre" : "clair";
      const e = document.documentElement;
      e.classList.remove("clair", "sombre");
      e.classList.add(suivant);
      e.style.colorScheme = suivant === "clair" ? "light" : "dark";
      try {
        localStorage.setItem(CLE_STOCKAGE, suivant);
      } catch {
        // Navigation privee ou stockage refuse : le choix ne survit pas au
        // rechargement, mais la bascule fonctionne pour la session.
      }
      return suivant;
    });
  }, []);

  const valeur = useMemo<ValeurContexte>(
    () => ({ theme, allumee: theme === "clair", basculer }),
    [theme, basculer],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useTheme(): ValeurContexte {
  const v = useContext(Contexte);
  if (!v) throw new Error("useTheme doit etre utilise dans un ThemeProvider");
  return v;
}

export { themeSelonHeure };
export type { Theme, Strategie };
