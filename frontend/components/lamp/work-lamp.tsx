"use client";

import { useEffect, useState, type RefObject } from "react";
import { useLampe } from "@/lib/lamp/lamp-context";

const CORPS = "#16191D"; // noir mat
const PIVOT_CORPS = "#1E2126"; // bouton molette
const INTERIEUR = "#EDEAE3"; // blanc poli mat du diffuseur
const BISEAU = "#3A3F45"; // fin liseré clair du bord

/**
 * Cotes de l'objet, en pixels. Les trois premieres doivent correspondre
 * exactement a LONGUEUR_TETE, RAYON_OUVERTURE et RAIL dans use-lamp-engine.ts,
 * sans quoi le faisceau ne partirait plus de l'ouverture de la tete.
 */
const LONGUEUR_TETE = 70;
const RAYON_OUVERTURE = 42;
const DEMI_RAIL = 70; // RAIL / 2 : distance du pivot au bord droit
const RAYON_BASE_TETE = 22;
const RAYON_MOLETTE = 15;
const CRANS_MOLETTE = 16;

export function WorkLamp({
  tete,
  bras,
}: {
  tete: RefObject<SVGGElement | null>;
  bras: RefObject<SVGGElement | null>;
}) {
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
  // { x: innerWidth - RAIL / 2, y: innerHeight / 2 }.
  const px = taille.w - DEMI_RAIL;
  const py = taille.h / 2;

  // Le pied repose sur le bas de l'ecran, legerement a droite du pivot : la
  // tige se courbe donc vers l'exterieur en montant, puis revient sur l'axe.
  const pieX = taille.w - 46;
  const pieY = taille.h - 14;

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      viewBox={`0 0 ${taille.w} ${taille.h}`}
      aria-hidden="true"
      focusable="false"
    >
      {/* --- Groupe fixe : pied, tige et pivot. Il glisse, il ne pivote pas. --- */}
      <g ref={bras} className="lampe-bras">
        {/* Pied : trapeze plat, vu de trois quarts. */}
        <path
          d={`M ${pieX - 66} ${pieY + 12}
              L ${pieX - 44} ${pieY - 4}
              L ${pieX + 44} ${pieY - 4}
              L ${pieX + 66} ${pieY + 12} Z`}
          fill={CORPS}
        />
        {/* Arete superieure du pied : le seul reflet de l'objet. */}
        <line
          x1={pieX - 44}
          y1={pieY - 4}
          x2={pieX + 44}
          y2={pieY - 4}
          stroke={BISEAU}
          strokeWidth="1.5"
        />
        {/* Collerette d'ancrage de la tige. */}
        <rect x={pieX - 13} y={pieY - 14} width="26" height="12" rx="3" fill={PIVOT_CORPS} />

        {/*
          Tige courbee. Elle monte verticalement depuis le pied, s'ecarte vers
          l'exterieur a mi-hauteur, puis revient s'ancrer sur le pivot : le col
          de cygne d'une lampe d'atelier, qui porte le poids de la tete en
          decalant sa masse.
        */}
        <path
          d={`M ${pieX} ${pieY - 12}
              C ${pieX} ${py + (pieY - py) * 0.45},
                ${taille.w - 14} ${py + 78},
                ${px} ${py}`}
          fill="none"
          stroke={CORPS}
          strokeWidth="13"
          strokeLinecap="round"
        />
        {/* Filet clair le long de la tige : le tube accroche la lumiere. */}
        <path
          d={`M ${pieX} ${pieY - 12}
              C ${pieX} ${py + (pieY - py) * 0.45},
                ${taille.w - 14} ${py + 78},
                ${px} ${py}`}
          fill="none"
          stroke={BISEAU}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
          transform="translate(-4 0)"
        />

        {/* Levier de verrouillage */}
        <rect x={px - 22} y={py - 5} width="13" height="10" rx="2" fill={PIVOT_CORPS} />

        {/* Bouton molete : le pivot visuel */}
        <g>
          <circle cx={px} cy={py} r={RAYON_MOLETTE} fill={PIVOT_CORPS} stroke={BISEAU} strokeWidth="1" />
          {Array.from({ length: CRANS_MOLETTE }, (_, i) => {
            const a = (i / CRANS_MOLETTE) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={px + Math.cos(a) * (RAYON_MOLETTE - 5)}
                y1={py + Math.sin(a) * (RAYON_MOLETTE - 5)}
                x2={px + Math.cos(a) * (RAYON_MOLETTE - 1)}
                y2={py + Math.sin(a) * (RAYON_MOLETTE - 1)}
                stroke={BISEAU}
                strokeWidth="1"
              />
            );
          })}
        </g>

        {/* Anneau guide-cable : le seul point colore de l'objet */}
        <circle cx={px} cy={py - 44} r="10" fill="none" stroke="var(--accent)" strokeWidth="3" />
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
          d={`M ${px} ${py - RAYON_BASE_TETE}
              L ${px + LONGUEUR_TETE} ${py - RAYON_OUVERTURE}
              L ${px + LONGUEUR_TETE} ${py + RAYON_OUVERTURE}
              L ${px} ${py + RAYON_BASE_TETE} Z`}
          fill={CORPS}
        />
        {/* Interieur du diffuseur : visible seulement lampe allumee */}
        <line
          x1={px + LONGUEUR_TETE}
          y1={py - RAYON_OUVERTURE}
          x2={px + LONGUEUR_TETE}
          y2={py + RAYON_OUVERTURE}
          stroke={allumee ? INTERIEUR : BISEAU}
          strokeWidth={allumee ? 6 : 2}
        />
        {/* Biseau du bord */}
        <line
          x1={px + LONGUEUR_TETE + 2}
          y1={py - RAYON_OUVERTURE - 1}
          x2={px + LONGUEUR_TETE + 2}
          y2={py + RAYON_OUVERTURE + 1}
          stroke={BISEAU}
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}
