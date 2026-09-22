import { useId } from "react";

import { BORD_Y, CENTRE_X, idSymboleMaille } from "@/lib/ampoule/geometrie";
import { SILHOUETTE_FERMEE } from "./maille";

/**
 * Les six couches de lumiere de l'annexe (§3), du plus proche de la source
 * au plus lointain : L2 la lueur a travers le tressage, L1 le filament
 * (taches 7/8), puis L4 le faisceau, L5 le halo de fond et L6 la moucheture
 * (tache 9). Ordre de peinture impose (annexe §3, addendum tache 9) :
 * `L5 -> L6 -> L4 -> [groupe isole : L2 -> maille -> L1]`. C'est `Ampoule`
 * qui les positionne toutes : L2/maille/L1 dans le groupe `.lampe-isolee`
 * (`isolation: isolate`), L6 et L4 juste avant ce groupe, dans l'ordre. L5
 * n'a pas de composant ici : c'est un `radial-gradient` sur `body::before`
 * (globals.css), hors de tout SVG.
 *
 * `CoucheLueur`, `CoucheFilament` et `CoucheFaisceau` ne prennent pas de
 * props : chaque `<defs>` derive son identifiant de `useId()`, jamais d'une
 * chaine litterale, pour que deux instances (tache 13, le commutateur)
 * coexistent sans collision d'identifiant.
 *
 * `CoucheMoucheture` deroge a cette regle par necessite : L6 est la
 * projection de la maille elle-meme (`<use href="#maille-symbole-...">`),
 * donc elle a besoin de savoir QUEL identifiant d'ampoule reutiliser — la
 * meme valeur `id` que celle passee a `<Maille id={id}>` dans `Ampoule`.
 * C'est le seul lien entre les deux fichiers ; `idSymboleMaille` (exporte
 * par `lib/ampoule/geometrie.ts`, pas par `maille.tsx` — ce dernier porte
 * `"use client"`, et un export de fonction d'un module client ne peut pas
 * etre appele depuis un composant serveur) garantit que les deux cotes
 * calculent le meme identifiant sans jamais l'ecrire en dur.
 *
 * L'opacite de chaque couche est portee par sa propre variable CSS
 * (`--lueur-opacite`, `--filament-opacite`, `--faisceau-opacite`,
 * `--moucheture-opacite` dans globals.css), toutes deriveees de
 * `--lampe-t` pour l'instant a l'identique — la tache 10 leur donnera des
 * courbes et des delais distincts. A `--lampe-t: 0` (theme sombre), toutes
 * les couches sont invisibles : la « braise residuelle nulle » de l'annexe
 * §4.4.
 */

/** L2 — lueur a travers le tressage, ecretee au contour du dome. */
export function CoucheLueur() {
  const id = useId();
  const idClip = `lueur-clip-${id}`;
  const idDegrade = `lueur-degrade-${id}`;
  const idFlou = `lueur-flou-${id}`;

  return (
    <g className="couche-lueur" clipPath={`url(#${idClip})`}>
      <defs>
        <clipPath id={idClip}>
          <path d={SILHOUETTE_FERMEE} />
        </clipPath>
        {/* Centre (88, 236) : 3 px sous le filament (88, 233), parce que le
            flux remonte moins qu'il ne descend (annexe §3.2). Rayon 96 px,
            en unites utilisateur — coordonnees absolues du repere du dome,
            jamais relatives a une boite englobante. */}
        <radialGradient
          id={idDegrade}
          gradientUnits="userSpaceOnUse"
          cx={CENTRE_X}
          cy={236}
          r={96}
        >
          <stop offset="0%" stopColor="#FFDFAD" stopOpacity={0.58} />
          <stop offset="30%" stopColor="#F6C176" stopOpacity={0.42} />
          <stop offset="58%" stopColor="#E7A257" stopOpacity={0.24} />
          <stop offset="82%" stopColor="#D08337" stopOpacity={0.09} />
          <stop offset="100%" stopColor="hsl(25 65% 48%)" stopOpacity={0} />
        </radialGradient>
        <filter id={idFlou} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {/* Le rectangle couvre largement le dome ; c'est le clip-path qui
          ecrete au contour reel, pas la geometrie du rectangle. */}
      <rect
        x={4}
        y={178}
        width={168}
        height={78}
        fill={`url(#${idDegrade})`}
        filter={`url(#${idFlou})`}
      />
    </g>
  );
}

/** L1 — filament, par-dessus la maille. Quatre sous-couches, du plus large
 *  au plus concentre : globe eclaire, halo serre, boucle, coeur. */
export function CoucheFilament() {
  const id = useId();
  const idHalo = `filament-halo-${id}`;
  const idFlouCoeur = `filament-flou-coeur-${id}`;
  const idFlouBoucle = `filament-flou-boucle-${id}`;
  const idFlouHalo = `filament-flou-halo-${id}`;
  const idFlouGlobe = `filament-flou-globe-${id}`;

  return (
    <g className="couche-filament">
      <defs>
        {/* Degrade radial du halo serre (annexe §3.1) : centre 50/50, r
            100% — pris tel quel, verbatim. */}
        <radialGradient id={idHalo} cx="50%" cy="50%" r="100%">
          <stop offset="0%" stopColor="hsl(44 100% 96%)" stopOpacity={1} />
          <stop offset="22%" stopColor="hsl(40 100% 88%)" stopOpacity={0.86} />
          <stop offset="50%" stopColor="hsl(35 97% 76%)" stopOpacity={0.48} />
          <stop offset="78%" stopColor="hsl(30 90% 66%)" stopOpacity={0.17} />
          <stop offset="100%" stopColor="hsl(28 85% 60%)" stopOpacity={0} />
        </radialGradient>
        <filter id={idFlouCoeur} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={0.5} />
        </filter>
        <filter id={idFlouBoucle} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={1.2} />
        </filter>
        <filter id={idFlouHalo} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
        <filter id={idFlouGlobe} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={4} />
        </filter>
      </defs>

      {/* Globe eclaire : le plus large, le plus doux — peint en premier. */}
      <circle
        cx={CENTRE_X}
        cy={232}
        r={21}
        fill="#FFE6B0"
        fillOpacity={0.42}
        filter={`url(#${idFlouGlobe})`}
      />

      {/* Halo serre : seule sous-couche de L1 en mix-blend-mode: screen
          (addendum du controleur, point C — avec L2, cela fait deux
          couches melees sur les quatre autorisees ; il en reste deux pour
          la tache 9, qui ajoute L4/L5/L6). */}
      <circle
        cx={CENTRE_X}
        cy={233}
        r={20}
        className="halo-serre"
        fill={`url(#${idHalo})`}
        filter={`url(#${idFlouHalo})`}
      />

      {/* Boucle */}
      <ellipse
        cx={CENTRE_X}
        cy={233}
        rx={6}
        ry={3.5}
        fill="none"
        stroke="#FFF3D6"
        strokeWidth={1.4}
        strokeOpacity={0.95}
        filter={`url(#${idFlouBoucle})`}
      />

      {/* Coeur, la sous-couche la plus concentree — tout au-dessus. */}
      <ellipse
        cx={CENTRE_X}
        cy={233}
        rx={2.2}
        ry={1.4}
        fill="#FFFDF6"
        filter={`url(#${idFlouCoeur})`}
      />
    </g>
  );
}

/**
 * L4 — le faisceau direct sous l'abat-jour (annexe §3.3). Cone du bord du
 * dome (y = 256, 168 px de large) jusqu'a y = 560 (300 px de large),
 * portee 304 px, demi-angle 12,25°.
 *
 * **Les stops ci-dessous sont recopies de la table de l'annexe au
 * caractere pres — ce ne sont pas les valeurs de la loi `I(d) = 0,36 /
 * (1 + d/120)²` enoncee dans le texte.** L'addendum du controleur (point
 * A, tache 9) constate que la loi ne reproduit la table sur aucune des
 * trois couches degradees (L1, L2, L4) : la table est normative, la loi
 * n'en est que la description qualitative (decroissance monotone et
 * convexe). Ne pas « corriger » ces stops vers la formule.
 *
 * Deux `<defs>` distincts assurent l'effet : un degrade lineaire vertical
 * pour la couleur/intensite, et un masque horizontal (penombre de 18 px de
 * chaque cote) pour la « transition tres douce vers l'ombre ». Le masque
 * est en unites `objectBoundingBox` par defaut (aucune precisee ici) :
 * l'attenuation est donc proportionnelle a la largeur locale du rectangle
 * englobant, plus marquee en bas (ou le cone est large) qu'en haut (ou il
 * epouse deja le bord etroit du dome) — un effet plausible et bien moins
 * couteux qu'un recalcul par rangee.
 *
 * Flou 26 px : c'est le seul flou reel de forme de tout l'effet (les
 * autres flous du fichier sont des flous de detail, celui-ci flou une
 * forme entiere). `mix-blend-mode: screen`, hors du groupe `.lampe-isolee`
 * — c'est pour cela qu'`Ampoule` la place avant ce groupe, jamais dedans.
 */
export function CoucheFaisceau() {
  const id = useId();
  const idDegrade = `faisceau-degrade-${id}`;
  const idMasqueDegrade = `faisceau-masque-degrade-${id}`;
  const idMasque = `faisceau-masque-${id}`;
  const idFlou = `faisceau-flou-${id}`;

  return (
    <g className="couche-faisceau">
      <defs>
        <linearGradient
          id={idDegrade}
          gradientUnits="userSpaceOnUse"
          x1={CENTRE_X}
          y1={BORD_Y}
          x2={CENTRE_X}
          y2={560}
        >
          <stop offset="0%" stopColor="#FDD599" stopOpacity={0.36} />
          <stop offset="15%" stopColor="hsl(35 94% 73%)" stopOpacity={0.26} />
          <stop offset="45%" stopColor="hsl(33 90% 70%)" stopOpacity={0.13} />
          <stop offset="75%" stopColor="hsl(31 85% 66%)" stopOpacity={0.05} />
          <stop offset="100%" stopColor="hsl(30 82% 62%)" stopOpacity={0} />
        </linearGradient>
        {/* Penombre laterale de 18 px : 0 % opaque 0, 12 % opaque 1, 88 %
            opaque 1, 100 % opaque 0 — repris verbatim de l'annexe §3.3. */}
        <linearGradient id={idMasqueDegrade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" />
          <stop offset="12%" stopColor="#fff" />
          <stop offset="88%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </linearGradient>
        {/* Region de masque elargie (au-dela des -10 %/+110 % par defaut) :
            le flou de 26 px etale la geometrie source d'environ 78 px
            (3 sigma) au-dela de sa boite englobante stricte (300 x 304),
            sur laquelle `objectBoundingBox` calcule par defaut le rayon
            d'action du masque — sans cette marge, la queue du flou serait
            rognee a l'arrete du masque plutot que de s'estomper. */}
        <mask id={idMasque} maskUnits="objectBoundingBox" x="-30%" y="-30%" width="160%" height="160%">
          <rect x={-152} y={166} width={480} height={484} fill={`url(#${idMasqueDegrade})`} />
        </mask>
        <filter id={idFlou} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={26} />
        </filter>
      </defs>
      {/* Polygone a 4 sommets + arc superieur de rayon 12 epousant
          l'ouverture (meme ellipse que le bord du dome, demi-arc inferieur
          — sweep = 0, verifie sur le HTML rendu : il passe par (88 ; 268),
          au ras de l'ourlet, jamais par l'interieur du dome). */}
      <path
        d={`M 4 ${BORD_Y} A 84 12 0 0 0 172 ${BORD_Y} L 238 560 L -62 560 Z`}
        fill={`url(#${idDegrade})`}
        mask={`url(#${idMasque})`}
        filter={`url(#${idFlou})`}
      />
    </g>
  );
}

/**
 * L6 — la moucheture : l'ombre de la maille projetee sur le fond (annexe
 * §3.5). Ce n'est jamais un second `feTurbulence` : `idMaille` est
 * l'identifiant de l'instance d'`Ampoule` qui a deja rendu sa maille (le
 * meme `id` que `<Maille id={id}>`), et le `<use>` ci-dessous reference le
 * `<symbol>` deja filtre que `maille.tsx` rasterise pour son propre rendu
 * — voir `idSymboleMaille`. Aucun filtre de bruit n'est declare ici.
 *
 * Recoloration : la maille source porte les couleurs de l'objet (allumee
 * ou eteinte), pas celles de la moucheture. Comme un `<use>` ne peut pas
 * remplacer un `fill`/`stroke` deja pose explicitement sur les descendants
 * qu'il instancie, la recoloration passe par un filtre SVG qui seuille le
 * canal alpha de la source : au-dessus de 0,5 (les brins, dont le trait
 * est pose a une opacite de 0,82) elle peint `hsl(28 55% 38%)` a 0,16 ;
 * entre 0 exclu et 0,5 (l'interstice, rempli a 0,38 ou 0,30 selon le
 * maillage) elle peint `hsl(36 82% 68%)` a 0,20 — sans jamais teinter le
 * fond totalement transparent hors du dome.
 *
 * Simplification assumee et documentee dans le rapport de tache : l'annexe
 * decrit un degrade de nettete en deux copies masquees (nette a 2 px pres
 * du centre, floue a 9 px au-dela de 200 px). Cette implementation retient
 * la valeur de flou unique donnee en tete de la meme table (5 px, « nette
 * pres de la source, floue au loin ») plutot que les deux copies : le
 * rendu exact des deux masques radiaux imbriques ne peut pas etre verifie
 * sans navigateur pilotable, alors que le flou de synthese, lui, degrade
 * la nettete de facon deja coherente avec la loi de decroissance lineaire
 * ci-dessous (qui, elle, est implementee integralement).
 */
export function CoucheMoucheture({ idMaille }: { idMaille: string }) {
  const id = useId();
  const idRecolor = `moucheture-recolor-${id}`;
  const idDegradeChute = `moucheture-degrade-chute-${id}`;
  const idMasqueChute = `moucheture-masque-chute-${id}`;
  const symbole = idSymboleMaille(idMaille);

  return (
    <g className="couche-moucheture" mask={`url(#${idMasqueChute})`}>
      <defs>
        <filter id={idRecolor} x="-20%" y="-20%" width="140%" height="140%">
          {/* Bande des brins : alpha source >= 0,5 -> 1, sinon 0. */}
          <feComponentTransfer in="SourceGraphic" result="alpha-brins">
            <feFuncA type="discrete" tableValues="0 1" />
          </feComponentTransfer>
          <feFlood floodColor="hsl(28 55% 38%)" floodOpacity={0.16} result="teinte-brins" />
          <feComposite in="teinte-brins" in2="alpha-brins" operator="in" result="brins" />

          {/* Bande de l'interstice : alpha source < 0,5 (bas), intersectee
              avec alpha source > 0 (non-nul) pour exclure le fond du dome,
              totalement transparent, de la teinte claire. */}
          <feComponentTransfer in="SourceGraphic" result="alpha-bas">
            <feFuncA type="discrete" tableValues="1 0" />
          </feComponentTransfer>
          <feComponentTransfer in="SourceGraphic" result="alpha-non-nul">
            <feFuncA type="linear" slope={1000} intercept={0} />
          </feComponentTransfer>
          <feComposite in="alpha-bas" in2="alpha-non-nul" operator="in" result="alpha-interstice" />
          <feFlood floodColor="hsl(36 82% 68%)" floodOpacity={0.2} result="teinte-interstice" />
          <feComposite
            in="teinte-interstice"
            in2="alpha-interstice"
            operator="in"
            result="interstice"
          />

          <feMerge result="recolore">
            <feMergeNode in="interstice" />
            <feMergeNode in="brins" />
          </feMerge>
          {/* Flou de synthese, voir la note de simplification ci-dessus. */}
          <feGaussianBlur in="recolore" stdDeviation={5} />
        </filter>

        {/* Loi de decroissance LINEAIRE (pas quadratique) sur 230 px depuis
            (88 ; 250) — annexe §3.5 : c'est une modulation de texture, pas
            une source lumineuse, une loi quadratique la ferait disparaitre
            trop vite. Un degrade radial a deux arrets, interpole
            lineairement par position, produit exactement cette loi. */}
        <radialGradient
          id={idDegradeChute}
          gradientUnits="userSpaceOnUse"
          cx={CENTRE_X}
          cy={250}
          r={230}
        >
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        {/* Le masque vit sur le groupe EXTERIEUR (non transforme) : son
            centre (88 ; 250) doit rester celui de la specification, dans
            le repere d'origine du dome — pas celui, redimensionne par
            scale(2,35), du `<use>` transforme ci-dessous. */}
        <mask id={idMasqueChute} maskContentUnits="userSpaceOnUse">
          <rect x={-150} y={40} width={600} height={320} fill={`url(#${idDegradeChute})`} />
        </mask>
      </defs>
      {/* Transformation verbatim de l'annexe §3.5 : mise a l'echelle 2,35
          autour du point fixe (88 ; 250) (translate/scale/translate),
          puis cisaillement de 4° — dans cet ordre de composition, donc
          `skewY` en tete de la liste (le plus a gauche s'applique en
          dernier). Etendue resultante ~395 x 183 px. */}
      <use
        href={`#${symbole}`}
        transform="skewY(4) translate(88,250) scale(2.35) translate(-88,-250)"
        filter={`url(#${idRecolor})`}
      />
    </g>
  );
}
