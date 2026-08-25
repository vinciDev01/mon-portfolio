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

  /*
    La lampe est un objet de bureau : elle suppose une marge droite ou se
    loger. Sous 900 px cette marge n'existe pas, et sa tete recouvrirait le
    texte. On la neutralise donc entierement plutot que de la reduire — le
    moteur ne tourne pas, l'objet n'est pas rendu, l'interrupteur disparait.
    Initialise a `true` pour que le rendu serveur et le premier rendu client
    coincident : rien de visible n'en depend avant le premier effet.
  */
  const [assezLarge, setAssezLarge] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const maj = () => setAssezLarge(mq.matches);
    maj();
    mq.addEventListener("change", maj);
    return () => mq.removeEventListener("change", maj);
  }, []);

  const activee = reglages.activee && assezLarge;
  const cibleRef = useRef<HTMLElement | null>(null);
  const cibles = useRef<Set<HTMLElement>>(new Set());
  const biaisRef = useRef<BiaisLampe>({ ...BIAIS_NEUTRE });

  const basculer = useCallback(() => setAllumee((v) => !v), []);

  // --- Cible visible ---
  // Une seule instance d'observateur pour toutes les sections. On retient
  // l'element dont le centre est le plus proche du centre du viewport.
  useEffect(() => {
    if (!activee) return;

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
    // Reveil dedie (voir EVENEMENT_REVEIL_LAMPE) : quand `relacher` remet
    // `cibleRef` a null en quittant une zone de survol, ce recalcul retrouve
    // la section la plus proche du centre de l'ecran, sans attendre un
    // veritable defilement.
    window.addEventListener(EVENEMENT_REVEIL_LAMPE, choisir);
    return () => {
      window.removeEventListener("scroll", choisir);
      window.removeEventListener("resize", choisir);
      window.removeEventListener(EVENEMENT_REVEIL_LAMPE, choisir);
    };
  }, [activee]);

  // --- Cible focalisee ---
  // En navigation au clavier, le faisceau doit suivre le focus. Sans cela, la
  // lampe eclaire une section pendant que le focus est ailleurs, et le mode
  // devient inutilisable au Tab.
  //
  // Cas particulier : les liens de la marge (`data-lampe-marge`) doivent
  // produire, au clavier, exactement la meme reponse qu'au survol souris
  // (`survolMarge`) — le bras glisse, la tete ne pivote jamais vers eux.
  // Sans ce test, ce meme focus retargetterait `cibleRef` comme n'importe
  // quel autre element et ferait pivoter la tete, contredisant la souris.
  useEffect(() => {
    if (!activee) return;
    let dansMarge = false;
    const surFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || typeof el.getBoundingClientRect !== "function") return;
      if (el.closest("[data-lampe-marge]")) {
        dansMarge = true;
        biaisRef.current = { ...BIAIS_NEUTRE, brasX: 6 };
        return;
      }
      if (dansMarge) {
        dansMarge = false;
        biaisRef.current = { ...BIAIS_NEUTRE };
      }
      cibleRef.current = el;
    };
    document.addEventListener("focusin", surFocus);
    return () => document.removeEventListener("focusin", surFocus);
  }, [activee]);

  const valeur = useMemo<ValeurContexte>(
    () => ({
      activee,
      allumee,
      basculer,
      cibleRef,
      cibles,
      biaisRef,
      reglages,
    }),
    [reglages, activee, allumee, basculer],
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
      /**
       * Retour au neutre : le biais redevient nul ET la cible de precision
       * posee par `survolTitre`/`survolCta` est relachee. Sans ce second
       * point, le faisceau restait verrouille sur le dernier titre ou
       * bouton survole jusqu'au prochain defilement — la lampe cessait de
       * suivre la lecture. En remettant `cibleRef` a null, `cible()` dans le
       * moteur retombe immediatement sur le centre de l'ecran (voir son
       * garde-fou), puis l'effet "Cible visible", reveille par le meme
       * evenement, retrouve la section la plus proche du centre.
       */
      relacher: () => {
        cibleRef.current = null;
        appliquer({});
      },
    }),
    [appliquer, cibleRef],
  );
}
