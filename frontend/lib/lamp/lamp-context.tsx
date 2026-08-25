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

type ValeurContexte = {
  activee: boolean;
  allumee: boolean;
  basculer: () => void;
  cibleRef: MutableRefObject<HTMLElement | null>;
  /** Registre des zones eclairables declarees par les sections. */
  cibles: MutableRefObject<Set<HTMLElement>>;
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
    () => ({ activee: reglages.activee, allumee, basculer, cibleRef, cibles, reglages }),
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
