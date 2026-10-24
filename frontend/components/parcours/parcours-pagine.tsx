"use client";

import {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "@/lib/i18n/i18n-context";
import type { Section } from "@/lib/parcours/sections";
import {
  creerAccumulateur,
  estEnButee,
  indexDepuisFragment,
  normaliserDelta,
  prochainIndex,
  type Direction,
} from "@/lib/parcours/pagination";
import { actionClavier, directionTactile, traiterMolette } from "@/lib/parcours/gestes";
import {
  analyserDuree,
  creerSequenceur,
  SORTIE_REPLI_MS,
} from "@/lib/parcours/sequence";

/** Identifiant de la section active, ou `null` s'il n'y en a aucune. La colonne
 *  est un composant client rendu par `page.tsx` : elle lit ce contexte au lieu
 *  de recevoir une fonction, qui ne traverserait pas la frontiere serveur. */
const ContexteSectionActive = createContext<string | null>(null);
const ContexteChangerSection = createContext<(id: string | null) => void>(() => {});
export function useSectionActive(): string | null {
  return useContext(ContexteSectionActive);
}

/** Vrai tant qu'une surcouche (le parchemin) est ouverte : la pagination se
 *  suspend alors entierement. */
const ContexteSurcouche = createContext(false);
const ContexteChangerSurcouche = createContext<(ouverte: boolean) => void>(() => {});

export function useSurcoucheOuverte(): boolean {
  return useContext(ContexteSurcouche);
}
export function useChangerSurcouche(): (ouverte: boolean) => void {
  return useContext(ContexteChangerSurcouche);
}

/** Duree du signal, en millisecondes : trois battements de 500 ms, que la
 *  feuille declare aussi sur `.entree-parcours[data-signal]`. */
export const DUREE_SIGNAL_MS = 1500;

/** Identifiant de la section que la colonne fait clignoter, ou `null`. Arrive
 *  en butee, la molette ou le balayage ne changent plus de section : ils
 *  designent la suivante, et c'est le visiteur qui decide d'y aller. */
const ContexteSignal = createContext<string | null>(null);
const ContexteSignaler = createContext<(id: string) => void>(() => {});
export function useSectionSignalee(): string | null {
  return useContext(ContexteSignal);
}

/**
 * Pose le contexte AU-DESSUS de la colonne et de `<main>`, que `page.tsx`
 * garde freres : la colonne est la navigation du site, elle ne doit pas
 * s'imbriquer dans le repere `main`. `initial` fixe le rendu serveur.
 */
export function FournisseurSectionActive({
  initial,
  children,
}: {
  initial: string | null;
  children: ReactNode;
}) {
  const [id, setId] = useState<string | null>(initial);
  const [surcouche, setSurcouche] = useState(false);
  const [signal, setSignal] = useState<string | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Le setter est stable : le conteneur l'installe une fois avec ses ecouteurs.
  const [signaler] = useState(() => (cible: string) => {
    // Un signal en cours sur la meme cible n'est pas relance : une rafale de
    // molette en butee ferait sinon repartir l'animation a chaque cran, et
    // le clignotement paraitrait fige.
    setSignal((courant) => {
      if (courant === cible) return courant;
      clearTimeout(minuterie.current);
      minuterie.current = setTimeout(() => setSignal(null), DUREE_SIGNAL_MS);
      return cible;
    });
  });
  useEffect(() => () => clearTimeout(minuterie.current), []);
  return (
    <ContexteChangerSection.Provider value={setId}>
      <ContexteSectionActive.Provider value={id}>
        <ContexteChangerSurcouche.Provider value={setSurcouche}>
          <ContexteSurcouche.Provider value={surcouche}>
            <ContexteSignaler.Provider value={signaler}>
              <ContexteSignal.Provider value={signal}>{children}</ContexteSignal.Provider>
            </ContexteSignaler.Provider>
          </ContexteSurcouche.Provider>
        </ContexteChangerSurcouche.Provider>
      </ContexteSectionActive.Provider>
    </ContexteChangerSection.Provider>
  );
}

/** Origine d'un changement. La molette et le balayage n'en sont plus : ils
 *  signalent la section suivante sans y aller. */
type Origine = "clic" | "clavier" | "historique";

/**
 * Duree de la sortie, lue sur la feuille et non recopiee. On interroge un
 * element sonde portant `.section-paginee`, hors `data-active` : sa
 * `transition-duration` EFFECTIVE (premiere valeur, celle de l'opacite) suit
 * le reglage de vitesse du backoffice, tombe a zero sous `prefers-reduced-motion`
 * et honore `data-mouvement="force"`, puisque la feuille s'en charge. Ne PAS
 * lire `--duree` : la feuille n'y touche pas en mouvement reduit, et l'attente
 * laisserait le fond nu visible. Le repli ne sert que si la lecture echoue.
 */
function lireDureeSortie(conteneur: HTMLElement): number {
  const sonde = document.createElement("div");
  sonde.className = "section-paginee";
  sonde.setAttribute("aria-hidden", "true");
  conteneur.appendChild(sonde);
  const duree = analyserDuree(getComputedStyle(sonde).transitionDuration);
  sonde.remove();
  return duree ?? SORTIE_REPLI_MS;
}

function estSaisie(cible: EventTarget | null): boolean {
  if (!(cible instanceof HTMLElement)) return false;
  return (
    cible.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(cible.tagName)
  );
}

function suspendreTransitions(els: (HTMLElement | null)[], suspendre: boolean) {
  for (const el of els) if (el) el.style.transition = suspendre ? "none" : "";
}

/** L'espace actionne un bouton ou un lien : on ne le detourne pas. */
function estCommande(cible: EventTarget | null, touche: string): boolean {
  if (touche !== " " || !(cible instanceof HTMLElement)) return false;
  return !!cible.closest("button, a[href], summary, [role='button']");
}

export function ParcoursPagine({
  sections,
  enfants,
  pied,
}: {
  sections: Section[];
  enfants: Record<string, ReactNode>;
  pied: ReactNode;
}) {
  const { t } = useTranslation();
  const changerSection = useContext(ContexteChangerSection);
  const changerSectionRef = useRef(changerSection);
  const signaler = useContext(ContexteSignaler);
  const signalerRef = useRef(signaler);
  const surcoucheOuverte = useSurcoucheOuverte();
  // Les gestionnaires sont installes une fois : ils lisent le drapeau par une
  // ref, sans quoi ils garderaient la valeur du premier rendu.
  const surcoucheRef = useRef(surcoucheOuverte);
  // `null` pendant le passage par le fond : aucune section n'est active.
  const [actif, setActif] = useState<number | null>(0);
  // Les sections deja vues pendant la visite. Une section y entre a sa
  // premiere activation et n'en sort plus : son attribut `data-decouverte`
  // pose une seule fois, l'animation d'arrivee ne joue qu'une fois. La
  // section 0 est la section d'arrivee du rendu serveur.
  const [vues, setVues] = useState<ReadonlySet<number>>(() => new Set([0]));
  const decouvrir = (i: number) =>
    setVues((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  const [annonce, setAnnonce] = useState("");

  const conteneur = useRef<HTMLDivElement>(null);
  const elements = useRef<(HTMLElement | null)[]>([]);
  const indexRef = useRef(0);
  const focusApres = useRef<number | null>(null);
  const tRef = useRef(t);
  const sectionsRef = useRef(sections);
  useEffect(() => {
    tRef.current = t;
    changerSectionRef.current = changerSection;
    signalerRef.current = signaler;
    surcoucheRef.current = surcoucheOuverte;
    sectionsRef.current = sections;
  });

  // Active toutes les regles de pagination, et seulement elles : sans
  // JavaScript l'attribut est absent et la page defile comme avant.
  useEffect(() => {
    const racine = document.documentElement;
    racine.setAttribute("data-pagination", "active");
    return () => {
      racine.removeAttribute("data-pagination");
    };
  }, []);

  // Le focus suit l'activation, quelle qu'en soit l'origine : la section qui
  // part devient `visibility: hidden` et un element invisible ne garde pas le
  // focus, qui retomberait sur `body` et ferait repartir Tab du haut du
  // document. Il doit attendre que l'arrivante ait quitte `visibility: hidden`,
  // donc le commit.
  useEffect(() => {
    if (actif === null || focusApres.current !== actif) return;
    focusApres.current = null;
    elements.current[actif]?.focus({ preventScroll: true });
  }, [actif]);

  useEffect(() => {
    const zone = conteneur.current;
    if (!zone) return;
    // Le tableau est rempli en place : sa reference reste valable au nettoyage.
    const els = elements.current;
    const ids = () => sectionsRef.current.map((s) => s.id);
    const accumulateur = creerAccumulateur(() => performance.now());

    // La destination en cours et l'origine du changement, lues par `activer`.
    let enCours: { cible: number; origine: Origine } | null = null;

    // Vrai si un `popstate` est arrive pendant le verrou et a ete ignore.
    let retourIgnore = false;

    const sequenceur = creerSequenceur({
      dureeSortie: () => lireDureeSortie(zone),
      desactiver: () => setActif(null),
      activer: (cible) => {
        const origine = enCours?.origine ?? "historique";
        enCours = null;
        indexRef.current = cible;
        // Retour en haut : une section masquee garde sa position interne, et la
        // rouvrir au milieu desorienterait. Choix assume, simple et previsible.
        elements.current[cible]?.scrollTo({ top: 0 });
        focusApres.current = cible;
        setActif(cible);
        decouvrir(cible);
        const s = sectionsRef.current[cible];
        changerSectionRef.current(s?.id ?? null);
        if (!s) return;
        setAnnonce(tRef.current(s.cleTitre));
        if (origine === "historique") return;
        const url = `#${s.id}`;
        try {
          if (origine === "clic") history.pushState(null, "", url);
          else history.replaceState(null, "", url);
        } catch {
          // Safari plafonne les appels a l'historique (environ 100 par 30 s) et
          // leve `SecurityError` au-dela : l'adresse cesse de suivre, ce qui
          // est un desagrement, la navigation doit rester vivante.
        }
      },
      // Le cumul accumule pendant le verrou ne doit pas declencher un second
      // changement des que le verrou se leve.
      surDeverrouillage: () => {
        accumulateur.reinitialiser();
        // Un retour arriere recu pendant le verrou a ete ignore : on rattrape
        // l'adresse, sinon section et fragment resteraient en desaccord. Pas
        // sans cela : si l'historique a refuse notre ecriture (quota de
        // Safari), l'adresse est en retard par construction et la lire nous
        // ramenerait en arriere.
        if (!retourIgnore) return;
        retourIgnore = false;
        const vise = indexDepuisFragment(location.hash, ids());
        if (vise !== indexRef.current) aller(vise, "historique");
      },
    });

    const aller = (cible: number, origine: Origine) => {
      if (cible === indexRef.current || sequenceur.verrouille) return;
      enCours = { cible, origine };
      sequenceur.aller(cible);
    };

    // En butee, la molette et le balayage designent la section voisine au lieu
    // d'y aller. Aux extremites il n'y a pas de voisine : rien ne clignote.
    const designer = (direction: Direction) => {
      const cible = prochainIndex(indexRef.current, ids().length, direction, true);
      const s = sectionsRef.current[cible];
      if (cible !== indexRef.current && s) signalerRef.current(s.id);
    };

    const butee = (direction: Direction) => {
      const el = elements.current[indexRef.current];
      return el ? estEnButee(el, direction) : true;
    };

    // Tout element qui se declare proprietaire de son defilement garde ses
    // evenements, a condition de pouvoir reellement defiler dans ce sens. Sans
    // cette condition, une bande pleine hauteur deviendrait morte, la ou le
    // pointeur se trouve justement apres un clic. `direction` nul : le geste
    // n'a pas encore de sens, on regarde les deux.
    // La regle est GENERIQUE par precaution, mais elle n'a aujourd'hui qu'UN
    // client : la colonne de passage. Le parchemin, lui, est couvert plus tot :
    // les quatre gestionnaires lisent `surcoucheRef` AVANT d'appeler cette
    // fonction, et le drapeau est leve pendant toute la vie du parchemin.
    // MESURE : en excluant explicitement le parchemin d'ici, aucun test ne
    // tombe. L'attribut que le parchemin pose sur son corps est donc une
    // ceinture, le drapeau etant la bretelle : il sert si un parchemin est
    // rendu hors du fournisseur, ou si le drapeau tombe.
    const proprietaireDefile = (cible: EventTarget | null, direction: Direction | 0) => {
      const el = cible instanceof Element ? cible.closest("[data-defilement-propre]") : null;
      if (!el) return false;
      if (direction === 0) return !estEnButee(el, 1) || !estEnButee(el, -1);
      return !estEnButee(el, direction);
    };

    // Filet : un onglet masque voit ses minuteries ralenties, et la page
    // resterait au fond nu, verrou pose. Au retour, on active la cible tout de
    // suite.
    const surVisibilite = () => {
      if (document.visibilityState === "visible") sequenceur.rattraper();
    };

    const surMolette = (e: WheelEvent) => {
      if (surcoucheRef.current) return;
      const delta = normaliserDelta(e.deltaY, e.deltaMode, window.innerHeight);
      if (proprietaireDefile(e.target, delta === 0 ? 0 : delta > 0 ? 1 : -1)) return;
      traiterMolette(e, delta, {
        enButee: butee,
        verrouille: () => sequenceur.verrouille,
        pousser: (delta) => accumulateur.pousser(delta),
        aller: designer,
      });
    };

    let depart: { x: number; y: number } | null = null;
    let butees: Record<Direction, boolean> = { 1: true, [-1]: true };
    const surDebutTactile = (e: TouchEvent) => {
      if (surcoucheRef.current) {
        depart = null;
        return;
      }
      if (proprietaireDefile(e.target, 0)) {
        depart = null;
        return;
      }
      const doigt = e.touches[0];
      depart = doigt ? { x: doigt.clientX, y: doigt.clientY } : null;
      // Butees relevees au DEPART : un geste qui fait defiler la section
      // jusqu'au bout ne doit pas, du meme geste, la quitter.
      butees = { 1: butee(1), [-1]: butee(-1) };
    };
    // Un geste interrompu par le systeme ne doit laisser aucun depart perime.
    const surAnnulationTactile = () => {
      depart = null;
    };
    const surFinTactile = (e: TouchEvent) => {
      if (surcoucheRef.current) {
        depart = null;
        return;
      }
      const doigt = e.changedTouches[0];
      if (!depart || !doigt) return;
      const direction = directionTactile(depart.x - doigt.clientX, depart.y - doigt.clientY);
      depart = null;
      if (direction === null || !butees[direction]) return;
      designer(direction);
    };

    const surTouche = (e: KeyboardEvent) => {
      if (surcoucheRef.current) return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.shiftKey && e.key !== " ") return;
      if (estSaisie(e.target) || estCommande(e.target, e.key)) return;
      const el = elements.current[indexRef.current];
      const action = actionClavier(
        e.key,
        e.shiftKey,
        indexRef.current,
        ids().length,
        butee,
        el?.clientHeight ?? window.innerHeight,
      );
      if (!action) return;
      e.preventDefault();
      if (action.type === "defiler") el?.scrollBy({ top: action.dy });
      else aller(action.cible, "clavier");
    };

    // Les entrees de la colonne sont des ancres `#id` : sans JavaScript elles
    // restent des ancres, avec lui elles paginent.
    const surClic = (e: MouseEvent) => {
      if (surcoucheRef.current) return;
      if (e.defaultPrevented || e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const ancre = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const href = ancre?.getAttribute("href");
      if (!href) return;
      const i = ids().indexOf(href.slice(1));
      if (i === -1) return;
      e.preventDefault();
      aller(i, "clic");
    };

    const surRetour = () => {
      // Deux consommateurs du meme evenement, et celui de la surcouche prime :
      // c'est le parchemin qui se ferme, par son propre ecouteur. Sans cette
      // sortie, un Retour fermerait le parchemin ET reculerait d'une section.
      if (surcoucheRef.current) return;
      if (sequenceur.verrouille) retourIgnore = true;
      aller(indexDepuisFragment(location.hash, ids()), "historique");
    };

    // Le fragment se lit apres l'hydratation. Inconnu, vide ou eteint : 0.
    // Saut INITIAL : chemin direct, hors des trois etats. Il n'y a rien a
    // faire disparaitre, la section 0 n'etant que le rendu serveur ; passer par
    // le fond ne vaut qu'entre deux sections visibles. Mais la section 0 est
    // deja peinte et active : sans suspendre les transitions le temps du
    // basculement, elle se fondrait en croise avec la cible. Ne pas uniformiser
    // avec `aller`.
    const cibleInitiale = indexDepuisFragment(location.hash, ids());
    let trame = 0;
    if (cibleInitiale !== 0) {
      indexRef.current = cibleInitiale;
      // Directement sur le DOM : la suspension ne concerne que ce basculement.
      suspendreTransitions(els, true);
      setActif(cibleInitiale);
      decouvrir(cibleInitiale);
      changerSectionRef.current(sectionsRef.current[cibleInitiale]?.id ?? null);
      // La suspension dure jusqu'au commit qui active la cible, pas un delai
      // devine : React commit apres ce passage, le premier rafraichissement
      // peint l'etat valide, le second est certain de l'avoir vu. On ne
      // restaure qu'ensuite.
      trame = requestAnimationFrame(() => {
        trame = requestAnimationFrame(() => {
          suspendreTransitions(els, false);
        });
      });
    }

    // Sur `window` et non sur le conteneur : la colonne et l'interrupteur de
    // la lampe sont fixes par-dessus la page, et `html`/`body` ne defilant
    // plus, une molette au-dessus d'eux ne ferait rien.
    window.addEventListener("wheel", surMolette, { passive: false });
    window.addEventListener("touchstart", surDebutTactile, { passive: true });
    window.addEventListener("touchend", surFinTactile, { passive: true });
    window.addEventListener("touchcancel", surAnnulationTactile, { passive: true });
    document.addEventListener("visibilitychange", surVisibilite);
    window.addEventListener("keydown", surTouche);
    document.addEventListener("click", surClic);
    window.addEventListener("popstate", surRetour);
    return () => {
      sequenceur.annuler();
      cancelAnimationFrame(trame);
      suspendreTransitions(els, false);
      window.removeEventListener("wheel", surMolette);
      window.removeEventListener("touchstart", surDebutTactile);
      window.removeEventListener("touchend", surFinTactile);
      window.removeEventListener("touchcancel", surAnnulationTactile);
      document.removeEventListener("visibilitychange", surVisibilite);
      window.removeEventListener("keydown", surTouche);
      document.removeEventListener("click", surClic);
      window.removeEventListener("popstate", surRetour);
    };
  }, []);

  const derniere = sections.length - 1;

  return (
    <>
      <div className="parcours-pagine" ref={conteneur}>
        {sections.map((s, i) => (
          <div
            key={s.id}
            id={s.id}
            ref={(el) => {
              elements.current[i] = el;
            }}
            className="section-paginee"
            data-active={actif === i ? "true" : undefined}
            data-decouverte={vues.has(i) ? "true" : undefined}
            tabIndex={-1}
          >
            {/* Le contenu et le pied viennent du composant serveur `Page`.
                Cote a cote, ils forment une liste de deux enfants, que React
                valide a la reconciliation : sans cle, il avertit (« Each
                child in a list should have a unique key »). Chacun a donc la
                sienne. */}
            <Fragment key="contenu">{enfants[s.id]}</Fragment>
            {i === derniere && <Fragment key="pied">{pied}</Fragment>}
          </div>
        ))}
        {sections.length === 0 && pied}
      </div>
      <div className="sr-only" aria-live="polite">
        {annonce}
      </div>
    </>
  );
}
