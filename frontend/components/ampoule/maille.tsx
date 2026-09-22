"use client";

import { useEffect, useState } from "react";

import {
  APEX_Y,
  BORD_Y,
  CENTRE_X,
  EPAISSEUR_BRIN,
  PAS_ANGULAIRE_DEG,
  R,
  cercles,
  idSymboleMaille,
  limiteFusion,
  meridiens,
  ordonnee,
} from "@/lib/ampoule/geometrie";
import { LUMIERE } from "@/lib/design/tokens";

/**
 * Demi-profil droit du dome : le chemin de reference de la specification.
 * Le demi-profil gauche n'est JAMAIS redessine a la main — chaque meridien
 * ci-dessous n'est que ce meme chemin, mis a l'echelle par le sinus de son
 * angle (negatif a gauche de l'axe x = CENTRE_X), voir `<use>` plus bas.
 */
const PROFIL_DROIT =
  "M 88 178 C 117.40 178.00, 122.77 179.32, 137.29 186.17 " +
  "C 148.72 191.57, 157.39 199.62, 163.20 210.24 " +
  "C 170.53 223.61, 172.00 228.80, 172.00 256.00";

/**
 * Silhouette fermee du dome, pour le voile de fond (l'interstice) et pour
 * l'ecretage de l'occlusion sous le bord (`Ampoule`, qui l'importe). C'est
 * exactement PROFIL_DROIT, reflechi autour de x = 88 (x' = 176 - x) et
 * parcouru en sens inverse pour refermer le contour — jamais redessine a la
 * main, seulement reflechi et inverse.
 */
export const SILHOUETTE_FERMEE =
  "M 88 178 C 117.40 178.00, 122.77 179.32, 137.29 186.17 " +
  "C 148.72 191.57, 157.39 199.62, 163.20 210.24 " +
  "C 170.53 223.61, 172.00 228.80, 172.00 256.00 " +
  "L 4 256 " +
  "C 4.00 228.80, 5.47 223.61, 12.80 210.24 " +
  "C 18.61 199.62, 27.28 191.57, 38.71 186.17 " +
  "C 53.23 179.32, 58.60 178.00, 88 178 Z";

/** Rayon horizontal de la calotte pleine : au-dela, les cercles cessent de
 *  se chevaucher et se dessinent individuellement (regle de l'addendum). */
const RAYON_CALOTTE = 30;

const PAS_DEGRADE = 10;
const NOMBRE_CERCLES_PLEIN = 18;
const NOMBRE_CERCLES_DEGRADE = 11;
const EPAISSEUR_BRIN_DEGRADEE = 1.8;
const OPACITE_INTERSTICE_PLEINE = 0.38;
const OPACITE_INTERSTICE_DEGRADEE = 0.3;

/** Couleurs de l'etat eteint. Les deux dejà presentes dans les jetons
 *  partages sont reprises telles quelles ; les autres sont propres a ce
 *  composant, la tache ne modifiant pas `lib/design/tokens.ts`. */
const COULEUR_MERIDIEN = LUMIERE.brinEteint; // #6E6355
const COULEUR_OURLET = LUMIERE.ourletEteint; // #7C7162
const COULEUR_CERCLE_RENFORCE = LUMIERE.ourletEteint; // #7C7162, memes brins que l'ourlet
const COULEUR_CERCLE_COURANT = "#5F5648";
const COULEUR_CALOTTE = "#4A4239";
const COULEUR_BANDE = "#544B3F";
const COULEUR_INTERIEUR = "#1C1F22";

const REQUETE_MAILLAGE_DEGRADE = "(max-width: 599px)";

/**
 * Lit la largeur d'ecran cote client pour choisir le maillage. Le rendu
 * serveur renvoie toujours `false` (maillage complet) : la version degradee
 * n'apparait qu'apres le montage, ce qui est accepte par la specification
 * (ecart de densite de trait, jamais de mise en page).
 */
function useMaillageDegrade(): boolean {
  const [degrade, setDegrade] = useState(false);

  useEffect(() => {
    const requete = window.matchMedia(REQUETE_MAILLAGE_DEGRADE);
    const appliquer = () => setDegrade(requete.matches);
    appliquer();
    requete.addEventListener("change", appliquer);
    return () => requete.removeEventListener("change", appliquer);
  }, []);

  return degrade;
}

/** Points echantillonnes sur la silhouette exacte (via `ordonnee`, pas via
 *  l'approximation en bezier de PROFIL_DROIT) entre deux abscisses. */
function pointsSilhouette(
  xDebut: number,
  xFin: number,
  pas = 12,
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= pas; i++) {
    const x = xDebut + ((xFin - xDebut) * i) / pas;
    const t = Math.abs(x - CENTRE_X) / R;
    points.push([x, APEX_Y + ordonnee(t)]);
  }
  return points;
}

/**
 * Chemin d'une bande pleine : suit la silhouette reelle du dome sur son
 * bord superieur (pas un rectangle plein cadre, qui deborderait au-dessus
 * du profil pres de l'axe) puis se referme a plat sur BORD_Y.
 */
function cheminBande(xInterieur: number, xExterieur: number): string {
  const points = pointsSilhouette(xInterieur, xExterieur);
  const trace = points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ");
  return `M ${trace} L ${xInterieur.toFixed(2)} ${BORD_Y} Z`;
}

export function Maille({ id }: { id: string }) {
  const degrade = useMaillageDegrade();

  const pasDeg = degrade ? PAS_DEGRADE : PAS_ANGULAIRE_DEG;
  const nombreCercles = degrade ? NOMBRE_CERCLES_DEGRADE : NOMBRE_CERCLES_PLEIN;
  const epaisseurBrin = degrade ? EPAISSEUR_BRIN_DEGRADEE : EPAISSEUR_BRIN;
  const opaciteInterstice = degrade ? OPACITE_INTERSTICE_DEGRADEE : OPACITE_INTERSTICE_PLEINE;
  const filtreActif = !degrade;

  const limite = limiteFusion(pasDeg);
  const largeurBande = R - limite;
  // Regle generale de l'addendum : pas de bande quand sa largeur tombe sous
  // l'epaisseur de brin en vigueur. A 10 deg elle ne ferait que 1,13 px,
  // sous les 1,8 px du brin degrade : les meridiens a +/-90 restent alors
  // de simples brins, la silhouette elle-meme.
  const bandeVisible = largeurBande >= epaisseurBrin;

  const meridiensAffiches = meridiens(pasDeg).filter((m) => !m.fusionne || !bandeVisible);

  // Regle generale de l'addendum : on dessine les cercles dont le rx depasse
  // celui de la calotte, et non un intervalle d'indices fixe.
  const cerclesVisibles = cercles(nombreCercles).filter((c) => c.rx > RAYON_CALOTTE);
  const dernierIndice = nombreCercles;

  // Tous les identifiants de <defs> derivent de `id`, comme le <g>
  // ci-dessous : une seconde instance sur la page (la tache 13 en montera
  // une, pour le commutateur) ne doit jamais partager ces identifiants,
  // sinon le navigateur ne retient que le premier jeu et l'ecretage comme
  // les degrades cessent de fonctionner en silence sur le second.
  const idProfil = `profil-${id}`;
  const idFiltre = `brins-${id}`;
  const idDegradeDroite = `bande-degrade-droite-${id}`;
  const idDegradeGauche = `bande-degrade-gauche-${id}`;
  const idDegradeVertical = `brins-vertical-${id}`;
  const idSymbole = idSymboleMaille(id);

  return (
    <>
      <defs>
        <path id={idProfil} d={PROFIL_DROIT} />
        <filter id={idFiltre} x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85 0.035"
            numOctaves={2}
            seed={7}
            result="bruit"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="bruit"
            scale={0.7}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        {/* Degrade des bandes pleines (annexe 2.1) : 0,55 cote interieur a
            1,0 au bord, pour raccorder la bande aux derniers brins
            individuels sans arete franche. Ce n'est pas l'assombrissement
            du dome (qui vient de la densite des meridiens) : le degrade ne
            fait que fondre une substitution, ses abscisses se deduisent de
            `limiteFusion(pas)`, jamais codees en dur. */}
        <linearGradient
          id={idDegradeDroite}
          gradientUnits="userSpaceOnUse"
          x1={CENTRE_X + limite}
          y1={APEX_Y}
          x2={CENTRE_X + R}
          y2={APEX_Y}
        >
          <stop offset="0%" stopColor={COULEUR_BANDE} stopOpacity={0.55} />
          <stop offset="100%" stopColor={COULEUR_BANDE} stopOpacity={1} />
        </linearGradient>
        <linearGradient
          id={idDegradeGauche}
          gradientUnits="userSpaceOnUse"
          x1={CENTRE_X - limite}
          y1={APEX_Y}
          x2={CENTRE_X - R}
          y2={APEX_Y}
        >
          <stop offset="0%" stopColor={COULEUR_BANDE} stopOpacity={0.55} />
          <stop offset="100%" stopColor={COULEUR_BANDE} stopOpacity={1} />
        </linearGradient>
        {/* Brins retro-eclaires (tache 8, annexe §3.2 L2) : degrade
            vertical du stroke des meridiens, de l'apex au bord. Chaque
            stop melange, via color-mix() pilote par --lampe-t (posee sur
            .ampoule, heritee jusqu'ici), la couleur eteinte plate et la
            teinte chaude de la table de la specification. A --lampe-t: 0
            les quatre stops convergent vers COULEUR_MERIDIEN : le rendu
            est alors visuellement identique a un stroke plat, donc
            strictement conforme a l'etat eteint (annexe §4.2) sans
            condition JS ni doublon de trace. */}
        <linearGradient
          id={idDegradeVertical}
          gradientUnits="userSpaceOnUse"
          x1={CENTRE_X}
          y1={APEX_Y}
          x2={CENTRE_X}
          y2={BORD_Y}
        >
          <stop
            offset="0%"
            style={{
              stopColor: `color-mix(in oklab, ${COULEUR_MERIDIEN}, #8A6B45 calc(var(--lampe-t, 0) * 100%))`,
            }}
          />
          <stop
            offset="41.03%"
            style={{
              stopColor: `color-mix(in oklab, ${COULEUR_MERIDIEN}, #B08A57 calc(var(--lampe-t, 0) * 100%))`,
            }}
          />
          <stop
            offset="70.51%"
            style={{
              stopColor: `color-mix(in oklab, ${COULEUR_MERIDIEN}, #D6A96B calc(var(--lampe-t, 0) * 100%))`,
            }}
          />
          <stop
            offset="100%"
            style={{
              stopColor: `color-mix(in oklab, ${COULEUR_MERIDIEN}, #9C7A4E calc(var(--lampe-t, 0) * 100%))`,
            }}
          />
        </linearGradient>

        {/* Rasterisation unique de la maille filtree (voir `idSymboleMaille`
            plus haut) : `overflow: visible` desamorce le viewport imbrique
            qu'un `<symbol>` etablirait sinon par defaut — sans ca, le
            navigateur ecreterait la maille a sa boite englobante native.
            Le filtre `feTurbulence`/`feDisplacementMap` ci-dessus n'est
            applique qu'ici, une seule fois ; les deux `<use>` qui suivent
            (le rendu du dome plus bas, et L6 la moucheture dans
            couches-lumiere.tsx) instancient ce resultat deja calcule, ils
            ne relancent jamais le filtre. */}
        <symbol id={idSymbole} style={{ overflow: "visible" }}>
          <g filter={filtreActif ? `url(#${idFiltre})` : undefined}>
            {/* Interstice : voile de fond visible entre les brins. Opacite
                plate, jamais un degrade — c'est la densite du tressage
                par-dessus qui assombrit les bords, pas cette couche. */}
            <path
              d={SILHOUETTE_FERMEE}
              fill={COULEUR_INTERIEUR}
              fillOpacity={opaciteInterstice}
            />

            {/* Calotte pleine : remplace C1 a C4, qui se chevauchent au
                sommet. */}
            <ellipse cx={CENTRE_X} cy={180.1} rx={30} ry={4.3} fill={COULEUR_CALOTTE} />

            {/* Meridiens non fusionnes : chacun est le meme demi-profil,
                mis a l'echelle par le sinus de son angle (negatif => reflet
                a gauche). */}
            {meridiensAffiches.map((m) => (
              <use
                key={m.theta}
                href={`#${idProfil}`}
                transform={`translate(${CENTRE_X},0) scale(${m.echelle},1) translate(${-CENTRE_X},0)`}
                stroke={`url(#${idDegradeVertical})`}
                strokeOpacity={0.82}
                strokeWidth={epaisseurBrin}
                fill="none"
              />
            ))}

            {/* Bandes pleines : remplacent les meridiens fusionnes,
                uniquement quand leur largeur reste au-dessus de l'epaisseur
                de brin. */}
            {bandeVisible && (
              <>
                <path
                  d={cheminBande(CENTRE_X + limite, CENTRE_X + R)}
                  fill={`url(#${idDegradeDroite})`}
                />
                <path
                  d={cheminBande(CENTRE_X - limite, CENTRE_X - R)}
                  fill={`url(#${idDegradeGauche})`}
                />
              </>
            )}

            {/* Cercles dont le rx depasse celui de la calotte : en-deca, ils
                se chevauchent et sont deja couverts par la calotte. */}
            {cerclesVisibles.map((c) => {
              const estOurlet = c.indice === dernierIndice;
              const estRenforce = !estOurlet && c.epaisseur > 1.5;
              const couleur = estOurlet
                ? COULEUR_OURLET
                : estRenforce
                  ? COULEUR_CERCLE_RENFORCE
                  : COULEUR_CERCLE_COURANT;
              const opacite = estOurlet ? 1 : estRenforce ? 0.9 : 0.72;
              return (
                <ellipse
                  key={c.indice}
                  cx={CENTRE_X}
                  cy={c.cy}
                  rx={c.rx}
                  ry={c.ry}
                  fill="none"
                  stroke={couleur}
                  strokeOpacity={opacite}
                  strokeWidth={c.epaisseur}
                />
              );
            })}
          </g>
        </symbol>
      </defs>

      <use id={id} href={`#${idSymbole}`} />
    </>
  );
}
