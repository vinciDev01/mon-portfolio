"use client";

import { useEffect, type RefObject } from "react";
import { useLampe } from "./lamp-context";
import { angleVers, formaterSommets, sommetsFaisceau } from "./geometry";
import { differenceAngulaire, estImmobile, pasRessort } from "./spring";

export type RefsLampe = {
  trou: RefObject<SVGPolygonElement | null>;
  voile: RefObject<SVGPolygonElement | null>;
  tete: RefObject<SVGGElement | null>;
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
  const { activee, allumee, cibleRef, reglages } = useLampe();

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
    };

    const boucle = (temps: number) => {
      if (!enCours) return;
      const dt = dernierTemps ? (temps - dernierTemps) / 1000 : 1 / 60;
      dernierTemps = temps;

      const p = pivot();
      const brut = angleVers(p, cible());
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
        // Pas d'animation : on saute directement a la position finale.
        const brut = angleVers(pivot(), cible());
        tete = { valeur: brut, vitesse: 0 };
        meneur = { valeur: brut - phi, vitesse: 0 };
        suiveur = { valeur: brut + phi, vitesse: 0 };
        peindre();
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
    document.addEventListener("focusin", relancer);
    document.addEventListener("visibilitychange", surVisibilite);

    return () => {
      enCours = false;
      cancelAnimationFrame(image);
      window.removeEventListener("scroll", relancer);
      window.removeEventListener("resize", relancer);
      document.removeEventListener("focusin", relancer);
      document.removeEventListener("visibilitychange", surVisibilite);
    };
  }, [activee, allumee, reglages.ouverture, cibleRef, refs]);
}
