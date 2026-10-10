"use client";

import {
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
export const ContexteSectionActive = createContext<string | null>(null);
export function useSectionActive(): string | null {
  return useContext(ContexteSectionActive);
}

/** Origine d'un changement : seules les deux premieres deplacent le focus. */
type Origine = "clic" | "clavier" | "molette" | "tactile" | "historique";

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
  colonne,
}: {
  sections: Section[];
  enfants: Record<string, ReactNode>;
  pied: ReactNode;
  colonne?: ReactNode;
}) {
  const { t } = useTranslation();
  // Rendu serveur et premier rendu client : toujours la premiere section.
  const [index, setIndex] = useState(0);
  // `null` pendant le passage par le fond : aucune section n'est active.
  const [actif, setActif] = useState<number | null>(0);
  const [annonce, setAnnonce] = useState("");

  const conteneur = useRef<HTMLDivElement>(null);
  const elements = useRef<(HTMLElement | null)[]>([]);
  const indexRef = useRef(0);
  const focusApres = useRef<number | null>(null);
  const tRef = useRef(t);
  const sectionsRef = useRef(sections);
  useEffect(() => {
    tRef.current = t;
    sectionsRef.current = sections;
  });

  // Active toutes les regles de pagination, et seulement elles : sans
  // JavaScript l'attribut est absent et la page defile comme avant.
  useEffect(() => {
    const racine = document.documentElement;
    racine.setAttribute("data-pagination", "active");
    return () => {
      racine.removeAttribute("data-pagination");
      racine.removeAttribute("data-section-active");
    };
  }, []);

  // Crochet documente par la spec, sans consommateur aujourd'hui : ne pas le
  // supprimer comme code mort, ne pas s'appuyer dessus comme s'il portait quoi
  // que ce soit.
  const idActif = sections[index]?.id;
  useEffect(() => {
    if (idActif) document.documentElement.setAttribute("data-section-active", idActif);
  }, [idActif]);

  // Le focus suit l'activation, jamais la molette ni le geste tactile. Il doit
  // attendre que la section ait quitte `visibility: hidden`, donc le commit.
  useEffect(() => {
    if (actif === null || focusApres.current !== actif) return;
    focusApres.current = null;
    elements.current[actif]?.focus({ preventScroll: true });
  }, [actif]);

  useEffect(() => {
    const zone = conteneur.current;
    if (!zone) return;
    const ids = () => sectionsRef.current.map((s) => s.id);
    const accumulateur = creerAccumulateur(() => performance.now());

    // La destination en cours et l'origine du changement, lues par `activer`.
    let enCours: { cible: number; origine: Origine } | null = null;

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
        if (origine === "clic" || origine === "clavier") focusApres.current = cible;
        setIndex(cible);
        setActif(cible);
        const s = sectionsRef.current[cible];
        if (!s) return;
        setAnnonce(tRef.current(s.cleTitre));
        if (origine === "historique") return;
        const url = `#${s.id}`;
        if (origine === "clic") history.pushState(null, "", url);
        else history.replaceState(null, "", url);
      },
      // Le cumul accumule pendant le verrou ne doit pas declencher un second
      // changement des que le verrou se leve.
      surDeverrouillage: () => {
        accumulateur.reinitialiser();
        // Un retour arriere recu pendant le verrou a ete ignore : on rattrape
        // l'adresse, sinon section et fragment resteraient en desaccord.
        const vise = indexDepuisFragment(location.hash, ids());
        if (vise !== indexRef.current) aller(vise, "historique");
      },
    });

    const aller = (cible: number, origine: Origine) => {
      if (cible === indexRef.current || sequenceur.verrouille) return;
      enCours = { cible, origine };
      sequenceur.aller(cible);
    };

    const butee = (direction: Direction) => {
      const el = elements.current[indexRef.current];
      return el ? estEnButee(el, direction) : true;
    };

    const surMolette = (e: WheelEvent) =>
      traiterMolette(e, normaliserDelta(e.deltaY, e.deltaMode, window.innerHeight), {
        enButee: butee,
        verrouille: () => sequenceur.verrouille,
        pousser: (delta) => accumulateur.pousser(delta),
        aller: (sens) =>
          aller(prochainIndex(indexRef.current, ids().length, sens, true), "molette"),
      });

    let depart: { x: number; y: number } | null = null;
    let butees: Record<Direction, boolean> = { 1: true, [-1]: true };
    const surDebutTactile = (e: TouchEvent) => {
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
      const doigt = e.changedTouches[0];
      if (!depart || !doigt) return;
      const direction = directionTactile(depart.x - doigt.clientX, depart.y - doigt.clientY);
      depart = null;
      if (direction === null) return;
      aller(
        prochainIndex(indexRef.current, ids().length, direction, butees[direction]),
        "tactile",
      );
    };

    const surTouche = (e: KeyboardEvent) => {
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
      if (e.defaultPrevented || e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const ancre = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const href = ancre?.getAttribute("href");
      if (!href) return;
      const i = ids().indexOf(href.slice(1));
      if (i === -1) return;
      e.preventDefault();
      aller(i, "clic");
    };

    const surRetour = () => aller(indexDepuisFragment(location.hash, ids()), "historique");

    // Le fragment se lit apres l'hydratation. Inconnu, vide ou eteint : 0.
    // Saut INITIAL : chemin direct, hors des trois etats. Il n'y a rien a
    // faire disparaitre, la section 0 n'etant que le rendu serveur ; passer par
    // le fond ne vaut qu'entre deux sections visibles. Mais la section 0 est
    // deja peinte et active : sans suspendre les transitions le temps du
    // basculement, elle se fondrait en croise avec la cible. Ne pas uniformiser
    // avec `aller`.
    const cibleInitiale = indexDepuisFragment(location.hash, ids());
    let finSaut: ReturnType<typeof setTimeout> | undefined;
    if (cibleInitiale !== 0) {
      indexRef.current = cibleInitiale;
      // Directement sur le DOM : la suspension ne concerne que ce basculement.
      suspendreTransitions(elements.current, true);
      setIndex(cibleInitiale);
      setActif(cibleInitiale);
      finSaut = setTimeout(() => {
        suspendreTransitions(elements.current, false);
      }, 50);
    }

    zone.addEventListener("wheel", surMolette, { passive: false });
    zone.addEventListener("touchstart", surDebutTactile, { passive: true });
    zone.addEventListener("touchend", surFinTactile, { passive: true });
    zone.addEventListener("touchcancel", surAnnulationTactile, { passive: true });
    window.addEventListener("keydown", surTouche);
    document.addEventListener("click", surClic);
    window.addEventListener("popstate", surRetour);
    return () => {
      sequenceur.annuler();
      clearTimeout(finSaut);
      zone.removeEventListener("wheel", surMolette);
      zone.removeEventListener("touchstart", surDebutTactile);
      zone.removeEventListener("touchend", surFinTactile);
      zone.removeEventListener("touchcancel", surAnnulationTactile);
      window.removeEventListener("keydown", surTouche);
      document.removeEventListener("click", surClic);
      window.removeEventListener("popstate", surRetour);
    };
  }, []);

  const derniere = sections.length - 1;

  return (
    <ContexteSectionActive.Provider value={sections[index]?.id ?? null}>
      {colonne}
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
            tabIndex={-1}
          >
            {enfants[s.id]}
            {i === derniere && pied}
          </div>
        ))}
        {sections.length === 0 && pied}
      </div>
      <div className="sr-only" aria-live="polite">
        {annonce}
      </div>
    </ContexteSectionActive.Provider>
  );
}
