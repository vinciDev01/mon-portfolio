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

const SEUIL_TACTILE = 48;

/** Origine d'un changement : seules les deux premieres deplacent le focus. */
type Origine = "clic" | "clavier" | "molette" | "tactile" | "historique";

/**
 * Duree de la sortie, lue sur la feuille et non recopiee : le reglage de
 * vitesse du backoffice reste maitre. On interroge un element sonde portant
 * `.section-paginee`, hors `data-active` : son `transition-delay` EST la
 * duree de sortie (45 % de `--duree`), et la regle de mouvement reduit le met
 * a zero. L'attente devient alors nulle sans aucune branche ici.
 */
function lireDureeSortie(conteneur: HTMLElement): number {
  const sonde = document.createElement("div");
  sonde.className = "section-paginee";
  sonde.setAttribute("aria-hidden", "true");
  conteneur.appendChild(sonde);
  const retard = analyserDuree(getComputedStyle(sonde).transitionDelay);
  sonde.remove();
  if (retard !== null) return retard;
  const duree = analyserDuree(
    getComputedStyle(document.documentElement).getPropertyValue("--duree"),
  );
  return duree !== null ? duree * 0.45 : SORTIE_REPLI_MS;
}

function estSaisie(cible: EventTarget | null): boolean {
  if (!(cible instanceof HTMLElement)) return false;
  return (
    cible.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(cible.tagName)
  );
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
      surDeverrouillage: () => accumulateur.reinitialiser(),
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

    const surMolette = (e: WheelEvent) => {
      const delta = normaliserDelta(e.deltaY, e.deltaMode, window.innerHeight);
      if (delta === 0) return;
      const direction: Direction = delta > 0 ? 1 : -1;
      // Hors butee, la section defile a l'interieur : on laisse faire.
      if (!butee(direction)) return;
      e.preventDefault();
      if (sequenceur.verrouille) return;
      const sens = accumulateur.pousser(delta);
      if (sens === null) return;
      aller(prochainIndex(indexRef.current, ids().length, sens, true), "molette");
    };

    let departY: number | null = null;
    let butees: Record<Direction, boolean> = { 1: true, [-1]: true };
    const surDebutTactile = (e: TouchEvent) => {
      departY = e.touches[0]?.clientY ?? null;
      // Butees relevees au DEPART : un geste qui fait defiler la section
      // jusqu'au bout ne doit pas, du meme geste, la quitter.
      butees = { 1: butee(1), [-1]: butee(-1) };
    };
    const surFinTactile = (e: TouchEvent) => {
      if (departY === null) return;
      const arrivee = e.changedTouches[0]?.clientY ?? departY;
      const ecart = departY - arrivee;
      departY = null;
      if (Math.abs(ecart) < SEUIL_TACTILE) return;
      const direction: Direction = ecart > 0 ? 1 : -1;
      aller(
        prochainIndex(indexRef.current, ids().length, direction, butees[direction]),
        "tactile",
      );
    };

    const surTouche = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (estSaisie(e.target)) return;
      const n = ids().length;
      let cible: number | null = null;
      switch (e.key) {
        case "PageDown":
          cible = prochainIndex(indexRef.current, n, 1, true);
          break;
        case "PageUp":
          cible = prochainIndex(indexRef.current, n, -1, true);
          break;
        case "End":
          cible = n - 1;
          break;
        case "Home":
          cible = 0;
          break;
        case "ArrowDown":
          if (!butee(1)) return;
          cible = prochainIndex(indexRef.current, n, 1, true);
          break;
        case "ArrowUp":
          if (!butee(-1)) return;
          cible = prochainIndex(indexRef.current, n, -1, true);
          break;
        default:
          return;
      }
      e.preventDefault();
      aller(cible, "clavier");
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
    const depart = indexDepuisFragment(location.hash, ids());
    if (depart !== 0) {
      indexRef.current = depart;
      setIndex(depart);
      setActif(depart);
    }

    zone.addEventListener("wheel", surMolette, { passive: false });
    zone.addEventListener("touchstart", surDebutTactile, { passive: true });
    zone.addEventListener("touchend", surFinTactile, { passive: true });
    window.addEventListener("keydown", surTouche);
    document.addEventListener("click", surClic);
    window.addEventListener("popstate", surRetour);
    return () => {
      sequenceur.annuler();
      zone.removeEventListener("wheel", surMolette);
      zone.removeEventListener("touchstart", surDebutTactile);
      zone.removeEventListener("touchend", surFinTactile);
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
