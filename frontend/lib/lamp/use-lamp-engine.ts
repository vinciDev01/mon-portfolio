"use client";

import { useEffect, type RefObject } from "react";
import { EVENEMENT_REVEIL_LAMPE, useLampe } from "./lamp-context";
import {
  angleVers,
  bandesRetombee,
  couchesPenombre,
  formaterSommets,
} from "./geometry";
import { differenceAngulaire, estImmobile, pasRessort } from "./spring";

export type RefsLampe = {
  /** Le trou du scrim : polygone unique et net, il porte la revelation. */
  trou: RefObject<SVGPolygonElement | null>;
  /** Groupe des polygones du voile lumineux, dans l'ordre couche puis bande. */
  voiles: RefObject<SVGGElement | null>;
  tete: RefObject<SVGGElement | null>;
  bras: RefObject<SVGGElement | null>;
};

const OMEGA_TETE = 9;
const OMEGA_MENEUR = 12;
const OMEGA_SUIVEUR = 7;
const ZETA = 0.9;

/** Distance du pivot a l'ouverture de la tete, en pixels. */
const LONGUEUR_TETE = 70;
/** Demi-hauteur de l'ouverture, en pixels. */
const RAYON_OUVERTURE = 42;
/**
 * Emprise horizontale de la lampe, en pixels. Le pivot est place au milieu :
 * a 70 px du bord droit. Les sections reservent cette marge a droite
 * (voir la regle .zigzag de globals.css).
 */
const RAIL = 140;

/**
 * Imperfections de la lumiere. Une source reelle n'est pas ponctuelle : ses
 * bords portent une penombre, et son intensite retombe avec la distance.
 * On les rend par empilement d'aplats plutot que par un degrade, que la
 * charte du projet interdit.
 */
const COUCHES_PENOMBRE = 3;
const ECART_PENOMBRE = (0.4 * Math.PI) / 180;
const BANDES_RETOMBEE = 3;
/** Attenuation de chaque bande en s'eloignant de la tete. */
const FACTEURS_BANDE = [1, 0.66, 0.4] as const;
/** Opacite de reference du voile, avant reglage d'intensite. */
const OPACITE_VOILE = 0.12;

export function useLampEngine(refs: RefsLampe) {
  const { activee, allumee, cibleRef, biaisRef, reglages } = useLampe();

  useEffect(() => {
    if (!activee || !allumee) return;

    const mouvementReduit = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const phi = ((reglages.ouverture / 2) * Math.PI) / 180;

    let tete = { valeur: Math.PI, vitesse: 0 };
    let meneur = { valeur: Math.PI - phi, vitesse: 0 };
    let suiveur = { valeur: Math.PI + phi, vitesse: 0 };

    let image = 0;
    let dernierTemps = 0;
    let enCours = true;

    const pivot = () => ({
      x: window.innerWidth - RAIL / 2,
      y: window.innerHeight / 2,
    });

    const cible = () => {
      const el = cibleRef.current;
      if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    // Les polygones du voile sont fixes en nombre : on les resout une fois.
    let polygones: SVGPolygonElement[] | null = null;
    // L'opacite ne depend que du reglage et du survol, jamais de l'image.
    // On la reecrit donc seulement quand le glow a bouge.
    let dernierGlow = Number.NaN;
    const voiles = () => {
      if (!polygones && refs.voiles.current) {
        polygones = Array.from(
          refs.voiles.current.querySelectorAll("polygon"),
        ) as SVGPolygonElement[];
      }
      return polygones;
    };

    const peindre = () => {
      const p = pivot();
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const couches = couchesPenombre(
        p, tete.valeur, meneur.valeur, suiveur.valeur,
        LONGUEUR_TETE, RAYON_OUVERTURE, viewport,
        COUCHES_PENOMBRE, ECART_PENOMBRE,
      );

      // Le trou du scrim ne prend que le coeur : bord franc, revelation nette.
      refs.trou.current?.setAttribute("points", formaterSommets(couches[0]));

      const cibles = voiles();
      if (cibles) {
        for (let k = 0; k < couches.length; k++) {
          const bandes = bandesRetombee(couches[k], BANDES_RETOMBEE);
          for (let j = 0; j < bandes.length; j++) {
            cibles[k * BANDES_RETOMBEE + j]?.setAttribute(
              "points",
              formaterSommets(bandes[j]),
            );
          }
        }
      }

      refs.tete.current?.setAttribute(
        "transform",
        `rotate(${(tete.valeur * 180) / Math.PI} ${p.x} ${p.y})`,
      );
      // Le bras glisse horizontalement, il ne pivote jamais.
      refs.bras.current?.setAttribute(
        "transform",
        `translate(${biaisRef.current.brasX} 0)`,
      );
      const glow = biaisRef.current.glow;
      if (cibles && glow !== dernierGlow) {
        dernierGlow = glow;
        const base =
          ((reglages.intensite / 100) * OPACITE_VOILE * glow) / COUCHES_PENOMBRE;
        for (let k = 0; k < COUCHES_PENOMBRE; k++) {
          for (let j = 0; j < BANDES_RETOMBEE; j++) {
            cibles[k * BANDES_RETOMBEE + j]?.setAttribute(
              "opacity",
              String(base * FACTEURS_BANDE[j]),
            );
          }
        }
      }
    };

    const boucle = (temps: number) => {
      if (!enCours) return;
      const dt = dernierTemps ? (temps - dernierTemps) / 1000 : 1 / 60;
      dernierTemps = temps;

      const p = pivot();
      const biais = biaisRef.current;
      const brut = angleVers(p, cible()) + biais.angle;
      // On vise par le chemin angulaire le plus court, sinon la tete peut
      // faire un tour complet au passage de +/-pi.
      const viseeTete = tete.valeur + differenceAngulaire(tete.valeur, brut);

      tete = pasRessort(tete, viseeTete, OMEGA_TETE, ZETA, dt);
      meneur = pasRessort(meneur, viseeTete - phi, OMEGA_MENEUR, ZETA, dt);
      suiveur = pasRessort(suiveur, viseeTete + phi, OMEGA_SUIVEUR, ZETA, dt);

      peindre();

      const arrive =
        estImmobile(tete, viseeTete) &&
        estImmobile(meneur, viseeTete - phi) &&
        estImmobile(suiveur, viseeTete + phi);

      if (arrive) {
        image = 0;
        dernierTemps = 0;
        return; // la boucle s'arrete : rien ne bouge, rien ne consomme
      }
      image = requestAnimationFrame(boucle);
    };

    const relancer = () => {
      if (!enCours) return;
      if (mouvementReduit) {
        // Pas d'animation, mais on coalesce quand meme : un defilement emet des
        // dizaines d'evenements par seconde, et peindre a chaque fois forcerait
        // autant de recalculs de mise en page.
        if (image) return;
        image = requestAnimationFrame(() => {
          image = 0;
          const brut = angleVers(pivot(), cible());
          tete = { valeur: brut, vitesse: 0 };
          meneur = { valeur: brut - phi, vitesse: 0 };
          suiveur = { valeur: brut + phi, vitesse: 0 };
          peindre();
        });
        return;
      }
      if (!image) {
        dernierTemps = 0;
        image = requestAnimationFrame(boucle);
      }
    };

    const surVisibilite = () => {
      if (document.hidden) {
        cancelAnimationFrame(image);
        image = 0;
      } else {
        relancer();
      }
    };

    relancer();
    window.addEventListener("scroll", relancer, { passive: true });
    window.addEventListener("resize", relancer);
    // Reveil dedie aux micro-interactions de survol (lamp-context.tsx) :
    // volontairement distinct de "scroll" pour ne pas se declencher en
    // meme temps que l'effet "Cible visible" du provider.
    window.addEventListener(EVENEMENT_REVEIL_LAMPE, relancer);
    document.addEventListener("focusin", relancer);
    document.addEventListener("visibilitychange", surVisibilite);

    return () => {
      enCours = false;
      cancelAnimationFrame(image);
      window.removeEventListener("scroll", relancer);
      window.removeEventListener("resize", relancer);
      window.removeEventListener(EVENEMENT_REVEIL_LAMPE, relancer);
      document.removeEventListener("focusin", relancer);
      document.removeEventListener("visibilitychange", surVisibilite);
    };
  }, [
    activee,
    allumee,
    reglages.ouverture,
    reglages.intensite,
    cibleRef,
    biaisRef,
    refs.trou,
    refs.voiles,
    refs.tete,
    refs.bras,
  ]);
}
