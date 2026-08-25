"use client";

import { useEffect, type RefObject } from "react";
import { EVENEMENT_REVEIL_LAMPE, useLampe } from "./lamp-context";
import { angleVers, formaterSommets, sommetsFaisceau } from "./geometry";
import { differenceAngulaire, estImmobile, pasRessort } from "./spring";

export type RefsLampe = {
  trou: RefObject<SVGPolygonElement | null>;
  voile: RefObject<SVGPolygonElement | null>;
  tete: RefObject<SVGGElement | null>;
  bras: RefObject<SVGGElement | null>;
};

const OMEGA_TETE = 9;
const OMEGA_MENEUR = 12;
const OMEGA_SUIVEUR = 7;
const ZETA = 0.9;

/** Distance du pivot a l'ouverture de la tete, en pixels. */
const LONGUEUR_TETE = 44;
/** Demi-hauteur de l'ouverture, en pixels. */
const RAYON_OUVERTURE = 26;
/** Largeur du rail occupe par le bras, en pixels. */
const RAIL = 48;

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

    const peindre = () => {
      const p = pivot();
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const sommets = sommetsFaisceau(
        p, tete.valeur, meneur.valeur, suiveur.valeur,
        LONGUEUR_TETE, RAYON_OUVERTURE, viewport,
      );
      const points = formaterSommets(sommets);
      refs.trou.current?.setAttribute("points", points);
      refs.voile.current?.setAttribute("points", points);
      refs.tete.current?.setAttribute(
        "transform",
        `rotate(${(tete.valeur * 180) / Math.PI} ${p.x} ${p.y})`,
      );
      // Le bras glisse horizontalement, il ne pivote jamais.
      refs.bras.current?.setAttribute(
        "transform",
        `translate(${biaisRef.current.brasX} 0)`,
      );
      refs.voile.current?.setAttribute(
        "opacity",
        String((reglages.intensite / 100) * 0.12 * biaisRef.current.glow),
      );
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
    refs.voile,
    refs.tete,
    refs.bras,
  ]);
}
