import { useId } from "react";

import { BORD_Y, CENTRE_X, idSymboleMaille } from "@/lib/ampoule/geometrie";
import { SILHOUETTE_FERMEE } from "./maille";

/**
 * Polygone a 4 sommets + arc superieur de L4 (annexe §3.3), partage entre le
 * remplissage du faisceau et son masque de penombre (ronde de correction 1)
 * — c'est le MEME contour qui doit etre flout pour l'un et l'autre, jamais
 * deux traces independants qui pourraient diverger. sweep = 0 : l'arc
 * epouse le bord EXTERIEUR de l'ouverture (passe par (88 ; 268)), pas
 * l'interieur de la coupole (sweep = 1, tache 7, a (88 ; 244)).
 */
const CHEMIN_FAISCEAU = `M 4 ${BORD_Y} A 84 12 0 0 0 172 ${BORD_Y} L 238 560 L -62 560 Z`;

/**
 * Masque de penombre de L4 (ronde de correction 2) : PAS le contour ferme
 * du cone, mais ses seuls flancs, prolonges au-dela du champ visible en
 * haut comme en bas. L'annexe §3.3 ne demande une penombre que « de chaque
 * cote » — or l'arc superieur du cone (`A 84 12 0 0 0`) plonge de y = 256 a
 * ses extremites jusqu'a y = 268 en son centre, ou la tangente est quasi
 * horizontale : flouter ce contour ferme y produisait une transition
 * VERTICALE d'environ 18 px, en plus du flou de forme de 26 px deja voulu,
 * et le faisceau s'estompait a sa naissance sous l'abat-jour — son point
 * le plus visible.
 *
 * Les flancs gardent leur position exacte (penombre laterale de 18 px
 * inchangee) ; seules les transitions haute et basse sortent du champ. Le
 * flou porte sur 3 sigma = 21 px (sigma = 7, voir plus bas) : il faut donc
 * partir au moins 21 px au-dessus de y = 268, soit y <= 247 ; y = 235 est
 * pris pour la marge. Flanc gauche de pente `dx/dy = -66/304 = -0,21711`
 * (passe par (4 ; 256) et (-62 ; 560)), flanc droit symetrique par
 * x = 88 :
 *
 *     y = 235  ->  flanc gauche x =   8,56   flanc droit x = 167,44
 *     y = 620  ->  flanc gauche x = -75,03   flanc droit x = 251,03
 *
 * Le `<path>` du REMPLISSAGE continue d'utiliser `CHEMIN_FAISCEAU` sans
 * changement : c'est lui qui donne la forme, arc superieur compris. Seul
 * le contenu du `<mask>` change.
 */
const CHEMIN_MASQUE_FAISCEAU = "M 8.56 235 L 167.44 235 L 251.03 620 L -75.03 620 Z";

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

/**
 * L1 — filament, par-dessus la maille. Quatre sous-couches, du plus large
 * au plus concentre : globe eclaire, halo serre, boucle, coeur.
 *
 * Tache 10, ronde de correction 2, point 5 : chaque sous-couche multiplie
 * sa PROPRE opacite de regime (annexe §3.1 : coeur 1,00 · boucle 0,95 ·
 * halo serre 1,00 · globe eclaire 0,42) par `--t-filament`, plutot que le
 * groupe `.couche-filament` ne porte une opacite brute (globals.css).
 * Raison : `opacity` en CSS clampe silencieusement toute valeur au-dela
 * de 1, donc le pic de depassement a 1,08 (annexe §5.1, « Depassement »)
 * n'a aucun effet visuel si `--t-filament` alimente directement un seul
 * `opacity` de groupe a regime 1. En multipliant par 0,42 (globe) ou 0,95
 * (boucle), le pic redevient observable : le globe monte reellement a
 * 0,4536 avant de redescendre a 0,42. Sur le coeur et le halo serre, dont
 * le regime vaut deja 1, le clampage a 1 persiste — sans remede, annonce
 * comme tel par le controleur.
 */
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

      {/* Globe eclaire : le plus large, le plus doux — peint en premier.
          Regime 0,42 (annexe §3.1) multiplie par --t-filament (ronde de
          correction 2, point 5) : c'est cette sous-couche qui rend le
          depassement visible, 0,42 * 1,08 = 0,4536 au pic. */}
      <circle
        cx={CENTRE_X}
        cy={232}
        r={21}
        fill="#FFE6B0"
        fillOpacity="calc(var(--t-filament, 0) * 0.42)"
        filter={`url(#${idFlouGlobe})`}
      />

      {/* Halo serre : seule sous-couche de L1 en mix-blend-mode: screen
          (addendum du controleur, point C — avec L2, cela fait deux
          couches melees sur les quatre autorisees ; il en reste deux pour
          la tache 9, qui ajoute L4/L5/L6). Regime 1,00 (annexe §3.1) :
          `var(--t-filament)` seule, le clampage du depassement a 1
          persiste ici sans remede (ronde de correction 2, point 5). */}
      <circle
        cx={CENTRE_X}
        cy={233}
        r={20}
        className="halo-serre"
        fill={`url(#${idHalo})`}
        fillOpacity="var(--t-filament, 0)"
        filter={`url(#${idFlouHalo})`}
      />

      {/* Boucle. `stroke` lit `var(--filament-couleur)` (tache 10, ronde
          de correction 1) : la rampe chromatique de l'annexe §5.1/§5.2
          (oklab, jamais sRGB — @property `--filament-couleur` en
          `syntax: "<color>"`, globals.css) anime cette couleur au fil de
          la transition, sur SIX arrets par sens (ronde de correction 2,
          point 2) — plus les trois du premier jet. Regime d'opacite 0,95
          (annexe §3.1) multiplie par --t-filament (ronde de correction 2,
          point 5). */}
      <ellipse
        cx={CENTRE_X}
        cy={233}
        rx={6}
        ry={3.5}
        fill="none"
        stroke="var(--filament-couleur, #FFF3D6)"
        strokeWidth={1.4}
        strokeOpacity="calc(var(--t-filament, 0) * 0.95)"
        filter={`url(#${idFlouBoucle})`}
      />

      {/* Coeur, la sous-couche la plus concentree — tout au-dessus.
          `fill` lit `var(--filament-couleur)`, meme rampe que la boucle
          ci-dessus. Regime d'opacite 1,00 (annexe §3.1) : `opacity`
          egale `var(--t-filament)` seule ; le clampage du depassement a 1
          persiste ici sans remede (ronde de correction 2, point 5). */}
      <ellipse
        cx={CENTRE_X}
        cy={233}
        rx={2.2}
        ry={1.4}
        fill="var(--filament-couleur, #FFFDF6)"
        opacity="var(--t-filament, 0)"
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
 * pour la couleur/intensite, et un masque qui SUIT LA GEOMETRIE DU CONE
 * (ronde de correction 1) pour la penombre laterale de 18 px.
 *
 * Un degrade horizontal ne peut pas donner une penombre de largeur
 * CONSTANTE sur des bords obliques : 18 px valent 10,7 % de la largeur en
 * haut du cone (168 px) mais seulement 6,0 % en bas (300 px) — aucun couple
 * de pourcentages fixes ne les satisfait tous les deux a la fois. La cote
 * en pixels fait foi ici (a la difference des tables de couleur, ou ce sont
 * les valeurs tabulees qui priment) : c'est une grandeur geometrique
 * explicite, pas une couleur dont le referentiel de pourcentage serait
 * ambigu. Le masque est fait des FLANCS du cone, prolonges au-dela du champ
 * (`CHEMIN_MASQUE_FAISCEAU`, distinct de `CHEMIN_FAISCEAU` — voir sa
 * documentation, ronde de correction 2), rempli en blanc puis floute : un
 * bord net floute par une gaussienne d'ecart-type s donne une transition
 * 10 %-90 % de 2,563 s ; pour 18 px, s = 18 / 2,563 = 7,02, arrondi a 7 —
 * d'ou `2,563 * 7 = 17,94 px`, les 18 px demandes a 0,06 px pres.
 *
 * La region elargie du `<mask>` (bien au-dela de la boite englobante
 * stricte du cone, 300 x 304) reste necessaire pour deux raisons
 * desormais : ne pas rogner la trainee du flou de FORME de 26 px
 * (ci-dessous, qui etale la geometrie source d'environ 78 px / 3 sigma), et
 * contenir le chemin de masque prolonge (y de 235 a 620) plus ses propres
 * 21 px de flou (3 sigma a 7 px) — x de -96 a 272, y de 214 a 641, ce qui
 * tient dans `x=-152 y=166 width=480 height=484`.
 *
 * Flou 26 px : c'est le seul flou reel de forme de tout l'effet (les
 * autres flous du fichier sont des flous de detail, celui-ci flou une
 * forme entiere). `mix-blend-mode: screen`, hors du groupe `.lampe-isolee`
 * — c'est pour cela qu'`Ampoule` la place avant ce groupe, jamais dedans.
 */
export function CoucheFaisceau() {
  const id = useId();
  const idDegrade = `faisceau-degrade-${id}`;
  const idFlouMasque = `faisceau-flou-masque-${id}`;
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
        <filter id={idFlouMasque} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
        {/* Region de masque elargie : marge pour la trainee du flou de
            forme de 26 px ci-dessous ET pour le chemin de masque prolonge
            (voir le commentaire de tete). */}
        <mask id={idMasque} maskUnits="userSpaceOnUse" x={-152} y={166} width={480} height={484}>
          <path d={CHEMIN_MASQUE_FAISCEAU} fill="#fff" filter={`url(#${idFlouMasque})`} />
        </mask>
        <filter id={idFlou} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={26} />
        </filter>
      </defs>
      <path
        d={CHEMIN_FAISCEAU}
        fill={`url(#${idDegrade})`}
        mask={`url(#${idMasque})`}
        filter={`url(#${idFlou})`}
      />
    </g>
  );
}

/**
 * Chaine de recoloration de la maille projetee (L6), partagee par les deux
 * copies du degrade de nettete (ronde de correction 1 : une copie nette a
 * 2 px, une copie floue a 9 px — seul le flou final differe entre les
 * deux, donc toute la chaine en amont est factorisee ici plutot que
 * dupliquee a la main dans les deux `<filter>`). Comme un `<use>` ne peut
 * pas remplacer un `fill`/`stroke` deja pose explicitement sur les
 * descendants qu'il instancie, la recoloration passe par un filtre SVG qui
 * seuille le canal alpha de la source : au-dessus de 0,5 (les brins, dont
 * le trait est pose a une opacite de 0,82) elle peint `hsl(28 55% 38%)` a
 * 0,16 ; entre 0 exclu et 0,5 (l'interstice, rempli a 0,38 ou 0,30 selon le
 * maillage) elle peint `hsl(36 82% 68%)` a 0,20 — sans jamais teinter le
 * fond totalement transparent hors du dome. Le resultat merge est nomme
 * `recolore` ; chaque appelant y ajoute son propre `<feGaussianBlur
 * in="recolore">`.
 */
function primitivesRecolorationMaille() {
  return (
    <>
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
    </>
  );
}

/**
 * L6 — la moucheture : l'ombre de la maille projetee sur le fond (annexe
 * §3.5). Ce n'est jamais un second `feTurbulence` : `idMaille` est
 * l'identifiant de l'instance d'`Ampoule` qui a deja rendu sa maille (le
 * meme `id` que `<Maille id={id}>`), et les deux `<use>` ci-dessous
 * referencent le MEME `<symbol>` deja filtre que `maille.tsx` rasterise
 * pour son propre rendu — voir `idSymboleMaille`. Aucun filtre de bruit
 * n'est declare ici ; la mitigation obligatoire de la spec (annexe §8.1)
 * tient precisement a ce qu'un seul `feTurbulence` existe sur toute la
 * page.
 *
 * **Degrade de nettete** (annexe §3.5, ronde de correction 1) : deux copies
 * superposees du meme `<use>`, masquees l'une par l'autre — une copie
 * nette (flou 2 px) visible pres du centre de projection (88 ; 250),
 * degressive de 120 a 200 px ; une copie floue (flou 9 px) avec le masque
 * exactement inverse. Les deux masques sont des `radialGradient` en
 * `userSpaceOnUse`, centre (88 ; 250), rayon 200 (120/200 = 60 % de
 * l'offset). Seuls le flou final et le masque different entre les deux
 * copies ; tout le reste (recoloration, transformation, symbole source)
 * est strictement partage.
 *
 * Ce degrade de nettete est distinct de la loi de decroissance LINEAIRE de
 * l'intensite globale sur 230 px (`idDegradeChute`/`idMasqueChute`
 * ci-dessous, sur le groupe englobant) : l'un module la NETTETE selon la
 * distance, l'autre module l'OPACITE globale selon la distance — deux
 * masques radiaux centres au meme point mais a des rayons differents
 * (200 px contre 230 px), pour deux raisons differentes.
 */
export function CoucheMoucheture({ idMaille }: { idMaille: string }) {
  const id = useId();
  const idRecolorNet = `moucheture-recolor-net-${id}`;
  const idRecolorFlou = `moucheture-recolor-flou-${id}`;
  const idDegradeNet = `moucheture-degrade-net-${id}`;
  const idDegradeFlou = `moucheture-degrade-flou-${id}`;
  const idMasqueNet = `moucheture-masque-net-${id}`;
  const idMasqueFlou = `moucheture-masque-flou-${id}`;
  const idDegradeChute = `moucheture-degrade-chute-${id}`;
  const idMasqueChute = `moucheture-masque-chute-${id}`;
  const symbole = idSymboleMaille(idMaille);

  /* Transformation verbatim de l'annexe §3.5 : mise a l'echelle 2,35
     autour du point fixe (88 ; 250) (translate/scale/translate), puis
     cisaillement de 4° — dans cet ordre de composition, donc `skewY` en
     tete de la liste (le plus a gauche s'applique en dernier). Etendue
     resultante ~395 x 183 px. Partagee par les deux copies : seuls le
     flou et le masque de nettete different entre elles. */
  const transformationProjection = "skewY(4) translate(88,250) scale(2.35) translate(-88,-250)";

  return (
    <g className="couche-moucheture" mask={`url(#${idMasqueChute})`}>
      <defs>
        <filter id={idRecolorNet} x="-20%" y="-20%" width="140%" height="140%">
          {primitivesRecolorationMaille()}
          <feGaussianBlur in="recolore" stdDeviation={2} />
        </filter>
        <filter id={idRecolorFlou} x="-20%" y="-20%" width="140%" height="140%">
          {primitivesRecolorationMaille()}
          <feGaussianBlur in="recolore" stdDeviation={9} />
        </filter>

        {/* Masque de la copie nette : opaque jusqu'a 120 px (60 % de 200),
            degressif jusqu'a 200 px. */}
        <radialGradient
          id={idDegradeNet}
          gradientUnits="userSpaceOnUse"
          cx={CENTRE_X}
          cy={250}
          r={200}
        >
          <stop offset="0%" stopColor="#fff" />
          <stop offset="60%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        {/* Masque de la copie floue : l'inverse exact du precedent. */}
        <radialGradient
          id={idDegradeFlou}
          gradientUnits="userSpaceOnUse"
          cx={CENTRE_X}
          cy={250}
          r={200}
        >
          <stop offset="0%" stopColor="#000" />
          <stop offset="60%" stopColor="#000" />
          <stop offset="100%" stopColor="#fff" />
        </radialGradient>
        <mask id={idMasqueNet} maskContentUnits="userSpaceOnUse">
          <rect x={-150} y={40} width={600} height={320} fill={`url(#${idDegradeNet})`} />
        </mask>
        <mask id={idMasqueFlou} maskContentUnits="userSpaceOnUse">
          <rect x={-150} y={40} width={600} height={320} fill={`url(#${idDegradeFlou})`} />
        </mask>

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

      {/* Copie nette : lisible pres de la lampe, ou la moucheture doit se
          lire comme un tressage et non comme du bruit. */}
      <g mask={`url(#${idMasqueNet})`}>
        <use
          href={`#${symbole}`}
          transform={transformationProjection}
          filter={`url(#${idRecolorNet})`}
        />
      </g>
      {/* Copie floue : au-dela de 200 px du centre de projection. */}
      <g mask={`url(#${idMasqueFlou})`}>
        <use
          href={`#${symbole}`}
          transform={transformationProjection}
          filter={`url(#${idRecolorFlou})`}
        />
      </g>
    </g>
  );
}
