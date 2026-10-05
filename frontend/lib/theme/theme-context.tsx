"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { basculerAnimation, creerAnimation, DUREE_ALLUMAGE } from "@/lib/ampoule/animation";
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
  // L'initialiseur lit la classe deja posee par le script initial : a
  // l'hydratation il est reevalue et retrouve la meme classe, aucun effet
  // d'alignement n'est donc necessaire.
  const [theme, setTheme] = useState<Theme>(() => themeCourant(strategie));

  /**
   * L'unique objet `Animation` qui pilote les huit variables
   * `--t-filament`, `--t-lueur`, `--t-faisceau`, `--t-halo`,
   * `--t-moucheture`, `--t-brins`, `--t-page` et `--filament-couleur` (lib/ampoule/
   * animation.ts) pour toute la duree de vie du fournisseur. Cree une
   * seule fois, cible sur `document.documentElement` : `body::before`
   * (L5, le halo de fond) n'est pas un descendant de `.ampoule`, il ne
   * suivrait donc pas une animation posee sur cet element (addendum du
   * controleur, tache 10, point A).
   */
  const animationRef = useRef<Animation | null>(null);

  useEffect(() => {
    const animation = creerAnimation(document.documentElement);
    // Positionne l'etat initial sans mise en scene : le script en ligne
    // (script-initial.ts) a deja pose la bonne classe avant le premier
    // trace, et le repli CSS de :root/.clair applique deja la bonne
    // valeur statique. On aligne seulement l'objet Animation dessus,
    // pour que le premier clic reparte de la bonne position au lieu de
    // rejouer tout l'allumage depuis 0.
    animation.currentTime = theme === "clair" ? DUREE_ALLUMAGE : 0;
    animationRef.current = animation;
    return () => {
      animation.cancel();
      animationRef.current = null;
    };
    // Volontairement [] : on ne veut creer/positionner cet objet qu'une
    // fois au montage, jamais a chaque changement de `theme` — c'est
    // l'effet sur `theme` ci-dessous qui fait ensuite evoluer sa position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effets de bord de la bascule (classe sur <html>, stockage, animation),
  // dans un effet dependant de `theme` et non dans l'updater de `setTheme` :
  // React rejoue les updaters en StrictMode, ce qui dupliquerait les
  // effets. Le garde-fou de `basculerAnimation` rend l'appel idempotent.
  // Le premier passage est saute : le script initial a deja pose la classe
  // et l'objet Animation est positionne au montage.
  const premierPassage = useRef(true);
  useEffect(() => {
    if (premierPassage.current) {
      premierPassage.current = false;
      return;
    }
    const e = document.documentElement;
    e.classList.remove("clair", "sombre");
    e.classList.add(theme);
    e.style.colorScheme = theme === "clair" ? "light" : "dark";
    if (animationRef.current) {
      basculerAnimation(animationRef.current, theme === "clair");
    }
    try {
      localStorage.setItem(CLE_STOCKAGE, theme);
    } catch {
      // Navigation privee ou stockage refuse : le choix ne survit pas au
      // rechargement, mais la bascule fonctionne pour la session.
    }
  }, [theme]);

  const basculer = useCallback(() => {
    setTheme((actuel) => (actuel === "clair" ? "sombre" : "clair"));
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
