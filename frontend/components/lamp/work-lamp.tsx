"use client";

import { useEffect, useState, type RefObject } from "react";
import { useLampe } from "@/lib/lamp/lamp-context";

const CORPS = "#16191D"; // noir mat
const PIVOT_CORPS = "#1E2126"; // bouton molette
const INTERIEUR = "#EDEAE3"; // blanc poli mat du diffuseur
const BISEAU = "#3A3F45"; // fin liseré clair du bord

export function WorkLamp({ tete }: { tete: RefObject<SVGGElement | null> }) {
  const { activee, allumee } = useLampe();

  // SVG n'accepte pas calc() dans les attributs de geometrie (x, y, cx, cy,
  // les coordonnees de path). On mesure donc la fenetre en JS et on calcule
  // les coordonnees en pixels, portees par un viewBox pixel sur le <svg>.
  const [taille, setTaille] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const maj = () => setTaille({ w: window.innerWidth, h: window.innerHeight });
    maj();
    window.addEventListener("resize", maj);
    return () => window.removeEventListener("resize", maj);
  }, []);

  if (!activee) return null;
  // Rien a mesurer cote serveur : on rend null tant que la taille reelle
  // n'est pas connue, pour eviter toute erreur d'hydratation liee a `window`.
  if (!taille.w) return null;

  // Centre du pivot (bouton molette / axe de rotation de la tete). Doit
  // correspondre exactement a `pivot()` dans use-lamp-engine.ts :
  // { x: innerWidth - RAIL / 2, y: innerHeight / 2 } avec RAIL = 48.
  const px = taille.w - 24;
  const py = taille.h / 2;

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      viewBox={`0 0 ${taille.w} ${taille.h}`}
      aria-hidden="true"
      focusable="false"
    >
      {/* --- Groupe fixe : le bras est un axe de reference, il ne pivote pas --- */}
      <g>
        {/* Bras tubulaire, colle au bord droit, sortant du cadre en bas */}
        <rect x={px - 6} y={0} width="12" height={taille.h} fill={CORPS} />
        {/* Levier de verrouillage */}
        <rect x={px - 16} y={py - 4} width="10" height="8" rx="2" fill={PIVOT_CORPS} />
        {/* Bouton molette : le pivot visuel, 14 crans */}
        <g>
          <circle cx={px} cy={py} r="11" fill={PIVOT_CORPS} stroke={BISEAU} strokeWidth="1" />
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={px + Math.cos(a) * 7}
                y1={py + Math.sin(a) * 7}
                x2={px + Math.cos(a) * 10}
                y2={py + Math.sin(a) * 10}
                stroke={BISEAU}
                strokeWidth="1"
              />
            );
          })}
        </g>
        {/* Anneau guide-cable : le seul point colore de l'objet */}
        <circle cx={px} cy={py - 28} r="7" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      </g>

      {/* --- Groupe tete : pivote autour du bouton molette --- */}
      {/*
        Le moteur ecrit `transform="rotate(angle px py)"` sur ce groupe a
        chaque image, ou `angle` est l'angle absolu (convention atan2 de
        geometry.ts : 0 = droite, +90 = bas) vise par la tete — sans aucun
        offset. Pour que la rotation composee avec cette geometrie de repos
        produise bien cette direction visuelle, la geometrie de repos doit
        elle-meme pointer a l'angle 0, donc vers la DROITE (l'ouverture est
        du cote +x, vers l'interieur de l'ecran), et non vers la gauche.
        Au repos reel (cible confondue avec le pivot), le moteur ecrit
        rotate(180, px, py) : applique a cette geometrie, l'ouverture se
        retrouve du cote -x, donc visuellement a gauche — c'est bien
        l'apparence de repos attendue, obtenue par composition et non en
        dessinant directement vers la gauche.
      */}
      <g ref={tete}>
        {/* Corps du projecteur */}
        <path
          d={`M ${px} ${py - 14} L ${px + 44} ${py - 26} L ${px + 44} ${py + 26} L ${px} ${py + 14} Z`}
          fill={CORPS}
        />
        {/* Interieur du diffuseur : visible seulement lampe allumee */}
        <line
          x1={px + 44}
          y1={py - 26}
          x2={px + 44}
          y2={py + 26}
          stroke={allumee ? INTERIEUR : BISEAU}
          strokeWidth={allumee ? 4 : 2}
        />
        {/* Biseau du bord */}
        <line x1={px + 45} y1={py - 27} x2={px + 45} y2={py + 27} stroke={BISEAU} strokeWidth="1" />
      </g>
    </svg>
  );
}
