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

/**
 * Theme que REND LE SERVEUR, et donc que le premier rendu client doit
 * rendre a l'identique : une valeur deterministe, calculee sans la moindre
 * lecture de `document`. Le serveur ignore l'heure locale et le stockage du
 * visiteur ; l'ecart avec l'etat reel est rattrape apres l'hydratation par
 * l'effet d'alignement du fournisseur.
 */
function themeDeterministe(strategie: Strategie): Theme {
  return strategie === "clair" ? "clair" : "sombre";
}

/**
 * Lit le theme REELLEMENT pose sur <html> par le script initial
 * (script-initial.ts), d'apres le stockage local ou, a defaut, l'heure
 * locale. C'est la seule source de verite de ce que le visiteur voit.
 * Reservee au client : elle suppose `document`.
 */
function themeDuDocument(): Theme {
  return document.documentElement.classList.contains("clair") ? "clair" : "sombre";
}

export function ThemeProvider({
  strategie,
  children,
}: {
  strategie: Strategie;
  children: React.ReactNode;
}) {
  // Etat initial DETERMINISTE : exactement ce que le serveur a rendu.
  // L'ancien initialiseur lisait la classe posee sur <html> par le script
  // initial, en supposant que le serveur avait rendu la meme — premisse
  // fausse : le serveur rend toujours `themeDeterministe` (« sombre » en
  // strategie auto), alors que le script pose « clair » des que le
  // stockage ou l'heure le demandent. Le premier rendu client divergeait
  // alors du HTML du serveur, et React laisse tel quel un attribut
  // divergent (« this won't be patched up ») : `aria-checked` restait
  // bloque sur l'etat du serveur, c'est-a-dire l'INVERSE de l'etat reel
  // pour un lecteur d'ecran. L'etat reel est rejoint juste apres
  // l'hydratation, par l'effet d'alignement ci-dessous.
  const [theme, setTheme] = useState<Theme>(() => themeDeterministe(strategie));

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
    // L'etat REEL, et non `theme` : le script en ligne (script-initial.ts)
    // a pose la classe avant le premier trace, tandis que `theme` ne vaut
    // encore que la valeur deterministe du serveur.
    const reel = themeDuDocument();
    // Positionne l'etat initial sans mise en scene : le script en ligne
    // a deja pose la bonne classe avant le premier trace, et le repli CSS
    // de :root/.clair applique deja la bonne valeur statique. On aligne
    // seulement l'objet Animation dessus, pour que le premier clic reparte
    // de la bonne position au lieu de rejouer tout l'allumage depuis 0.
    animation.currentTime = reel === "clair" ? DUREE_ALLUMAGE : 0;
    animationRef.current = animation;
    // L'EFFET D'ALIGNEMENT : l'etat React rejoint l'etat reel maintenant
    // que l'hydratation est faite, donc apres que le premier rendu client
    // a reproduit le HTML du serveur a l'identique. Seul l'etat React (et
    // les attributs qui en derivent, `aria-checked` en tete) change :
    // l'apparence vient de la classe sur <html>, qui n'est pas touchee, et
    // l'objet Animation est deja sur la bonne borne, ci-dessus, sans mise
    // en scene. Appel inconditionnel : React ignore un etat identique.
    //
    // La derogation ci-dessous est le fond du sujet, pas un contournement :
    // le second rendu en cascade est precisement ce qu'on veut ici, et il
    // est unique (au montage). La valeur n'est pas connaissable au rendu,
    // puisque la connaitre voudrait dire lire le DOM pendant le rendu, soit
    // le defaut qu'on corrige. L'alternative sans derogation serait de
    // deriver le theme de la classe sur <html> via `useSyncExternalStore`
    // (`getServerSnapshot` = `themeDeterministe`) ; elle deplacerait les
    // effets de bord de la bascule dans le gestionnaire de clic, ce qui
    // sort du perimetre de cette correction.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(reel);
    return () => {
      animation.cancel();
      animationRef.current = null;
    };
    // Volontairement [] : on ne veut creer/positionner cet objet qu'une
    // fois au montage, jamais a chaque changement de `theme` — c'est
    // l'effet sur `theme` ci-dessous qui fait ensuite evoluer sa position.
    // Depuis que la position se lit sur `themeDuDocument()` et non sur
    // `theme`, ce corps ne depend plus d'aucune valeur de rendu : [] est
    // exhaustif et la derogation a `react-hooks/exhaustive-deps` qui
    // vivait ici n'a plus de raison d'etre.
  }, []);

  // Effets de bord de la bascule (classe sur <html>, stockage, animation),
  // dans un effet dependant de `theme` et non dans l'updater de `setTheme` :
  // React rejoue les updaters en StrictMode, ce qui dupliquerait les
  // effets. Le garde-fou de `basculerAnimation` rend l'appel idempotent.
  //
  // Ce drapeau remplace l'ancien « premier passage saute ». Ce qu'il faut
  // distinguer n'est pas le premier passage, c'est un changement VOULU par
  // le visiteur d'un changement SUBI : ni le montage ni l'alignement
  // d'apres-hydratation n'ont quoi que ce soit a appliquer, la classe sur
  // <html> etant deja celle du script initial. Seul le gestionnaire de clic
  // porte cette information, d'ou le drapeau qu'il arme. Un compteur de
  // passages, lui, se ferait prendre par l'alignement et rejouerait toute
  // l'incandescence au chargement ; il se ferait reprendre aussi par le
  // double montage d'effets de StrictMode, dont les fermetures portent
  // l'etat d'avant l'alignement, donc un clignotement en developpement.
  const basculeDemandee = useRef(false);
  useEffect(() => {
    if (!basculeDemandee.current) return;
    basculeDemandee.current = false;
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
    // Le geste du visiteur, la seule chose qui autorise l'effet ci-dessus
    // a reecrire la classe, enregistrer le choix et jouer l'incandescence.
    basculeDemandee.current = true;
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
