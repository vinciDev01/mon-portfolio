"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

export type ReglagesLampe = {
  activee: boolean;
  allumeeParDefaut: boolean;
  /** Ouverture totale du faisceau en degres. */
  ouverture: number;
  /** 0 a 100. */
  intensite: number;
  /** 0 a 100. */
  assombrissement: number;
};

export type BiaisLampe = {
  /** Radians ajoutes a l'angle vise. */
  angle: number;
  /** Pixels de glissement horizontal du bras. */
  brasX: number;
  /** Multiplicateur de l'opacite du voile lumineux. */
  glow: number;
};

const BIAIS_NEUTRE: BiaisLampe = { angle: 0, brasX: 0, glow: 1 };

/**
 * Evenement synthetique qui reveille le moteur (voir use-lamp-engine.ts)
 * sans passer par "scroll" : ce dernier est deja ecoute par l'effet
 * "Cible visible" ci-dessous, qui recalculerait aussitot `cibleRef` a partir
 * de la section la plus proche du centre de l'ecran et effacerait la cible
 * de precision (titre ou bouton) que le survol vient de poser. Un nom
 * d'evenement dedie decouple le reveil du moteur de ce recalcul.
 */
export const EVENEMENT_REVEIL_LAMPE = "lampe:reveil";

type ValeurContexte = {
  activee: boolean;
  allumee: boolean;
  basculer: () => void;
  cibleRef: MutableRefObject<HTMLElement | null>;
  /** Registre des zones eclairables declarees par les sections. */
  cibles: MutableRefObject<Set<HTMLElement>>;
  /** Biais applique par les micro-interactions de survol. */
  biaisRef: MutableRefObject<BiaisLampe>;
  reglages: ReglagesLampe;
};

const Contexte = createContext<ValeurContexte | null>(null);

export function LampProvider({
  reglages,
  children,
}: {
  reglages: ReglagesLampe;
  children: React.ReactNode;
}) {
  const [allumee, setAllumee] = useState(reglages.allumeeParDefaut);
  const cibleRef = useRef<HTMLElement | null>(null);
  const cibles = useRef<Set<HTMLElement>>(new Set());
  const biaisRef = useRef<BiaisLampe>({ ...BIAIS_NEUTRE });

  const basculer = useCallback(() => setAllumee((v) => !v), []);

  // --- Cible visible ---
  // Une seule instance d'observateur pour toutes les sections. On retient
  // l'element dont le centre est le plus proche du centre du viewport.
  useEffect(() => {
    if (!reglages.activee) return;

    const choisir = () => {
      const centreEcran = window.innerHeight / 2;
      let meilleur: HTMLElement | null = null;
      let meilleureDistance = Infinity;
      for (const el of cibles.current) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        const distance = Math.abs(r.top + r.height / 2 - centreEcran);
        if (distance < meilleureDistance) {
          meilleureDistance = distance;
          meilleur = el;
        }
      }
      if (meilleur) cibleRef.current = meilleur;
    };

    choisir();
    window.addEventListener("scroll", choisir, { passive: true });
    window.addEventListener("resize", choisir);
    return () => {
      window.removeEventListener("scroll", choisir);
      window.removeEventListener("resize", choisir);
    };
  }, [reglages.activee]);

  // --- Cible focalisee ---
  // En navigation au clavier, le faisceau doit suivre le focus. Sans cela, la
  // lampe eclaire une section pendant que le focus est ailleurs, et le mode
  // devient inutilisable au Tab.
  useEffect(() => {
    if (!reglages.activee) return;
    const surFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && typeof el.getBoundingClientRect === "function") {
        cibleRef.current = el;
      }
    };
    document.addEventListener("focusin", surFocus);
    return () => document.removeEventListener("focusin", surFocus);
  }, [reglages.activee]);

  const valeur = useMemo<ValeurContexte>(
    () => ({
      activee: reglages.activee,
      allumee,
      basculer,
      cibleRef,
      cibles,
      biaisRef,
      reglages,
    }),
    [reglages, allumee, basculer],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useLampe(): ValeurContexte {
  const v = useContext(Contexte);
  if (!v) throw new Error("useLampe doit etre utilise dans un LampProvider");
  return v;
}

/**
 * Declare la zone eclairable d'une section. A poser en callback ref :
 *   const cible = useBeamTarget();
 *   <div ref={cible}>…</div>
 */
export function useBeamTarget() {
  const { cibleRef, cibles } = useLampe();
  const enregistre = useRef<HTMLElement | null>(null);

  return useCallback(
    (el: HTMLElement | null) => {
      if (enregistre.current) cibles.current.delete(enregistre.current);
      enregistre.current = el;
      if (el) {
        cibles.current.add(el);
        if (!cibleRef.current) cibleRef.current = el;
      }
    },
    [cibleRef, cibles],
  );
}

const DEGRE = Math.PI / 180;

/**
 * Handlers de survol. Ils ecrivent dans une ref lue par le moteur : aucun
 * re-rendu React n'est declenche par un simple deplacement de souris.
 */
export function useBiaisLampe() {
  const { biaisRef, cibleRef } = useLampe();

  const appliquer = useCallback(
    (b: Partial<BiaisLampe>) => {
      biaisRef.current = { ...BIAIS_NEUTRE, ...b };
      // Reveille le moteur, qui s'arrete des qu'il est immobile. Evenement
      // dedie plutot que "scroll" : voir EVENEMENT_REVEIL_LAMPE ci-dessus.
      window.dispatchEvent(new Event(EVENEMENT_REVEIL_LAMPE));
    },
    [biaisRef],
  );

  return useMemo(
    () => ({
      /** La tete recentre son faisceau sur le titre survole. */
      survolTitre: (el: HTMLElement) => {
        cibleRef.current = el;
        appliquer({ angle: 0.6 * DEGRE });
      },
      /** La tete s'incline vers le bouton et le faisceau s'intensifie. */
      survolCta: (el: HTMLElement) => {
        cibleRef.current = el;
        appliquer({ angle: 1.2 * DEGRE, glow: 1.6 });
      },
      /** Le bras glisse, la tete ne tourne pas. */
      survolMarge: () => appliquer({ brasX: 6 }),
      /** Retour au neutre. */
      relacher: () => appliquer({}),
    }),
    [appliquer, cibleRef],
  );
}
