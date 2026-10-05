import { BORD_Y, CENTRE_X } from "@/lib/ampoule/geometrie";
import { LUMIERE } from "@/lib/design/tokens";
import { CoucheFaisceau, CoucheFilament, CoucheLueur, CoucheMoucheture } from "./couches-lumiere";
import { Maille, SILHOUETTE_FERMEE } from "./maille";

/**
 * Le fil de suspension. Jamais parfaitement vertical : la fleche de 3,2 px
 * (91.2 au lieu de 88 a mi-hauteur) supprime l'effet « trait CSS ».
 */
const FIL = "M 88 0 C 88 62, 91.2 118, 89.4 152 C 88.7 165, 88 172, 88 178";
const COULEUR_FIL = "#5A5348";

/** Douille (annexe §1.2), entierement contenue dans le dome. */
const COULEUR_DOUILLE = "#3E4348";

/** Ampoule (annexe §1.5). */
const COULEUR_GLOBE = "#1E2225";
const COULEUR_CONTOUR_GLOBE = "#575F5A";

/** Arc d'interieur visible (annexe §1.4). */
const COULEUR_INTERIEUR = "#1C1F22";

/**
 * Polyligne du profil gauche, de l'apex (88, 178) a (11,87 ; 212), fournie
 * par la spec (meme superellipse que `geometrie.ts`, echantillonnee) pour
 * le lisere d'incidence — jamais une valeur inventee.
 */
const PROFIL_GAUCHE_LISERE: Array<[number, number]> = [
  [88.0, 178.0],
  [49.05, 182.25],
  [38.03, 186.5],
  [30.62, 190.75],
  [25.05, 195.0],
  [20.67, 199.25],
  [17.13, 203.5],
  [14.24, 207.75],
  [11.87, 212.0],
];
const CHEMIN_LISERE = PROFIL_GAUCHE_LISERE.map(
  ([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`,
).join(" ");
const [LISERE_DEBUT_X, LISERE_DEBUT_Y] = PROFIL_GAUCHE_LISERE[0];
const [LISERE_FIN_X, LISERE_FIN_Y] = PROFIL_GAUCHE_LISERE[PROFIL_GAUCHE_LISERE.length - 1];

/**
 * L'objet suspendu, a l'etat eteint uniquement. Le theme n'est pas encore
 * consomme ici : il commandera plus tard l'allumage, mais l'ampoule doit
 * deja vivre a l'interieur du fournisseur de theme pour que cette bascule
 * n'ait, le moment venu, aucun arbre a reorganiser.
 *
 * Ordre de dessin (annexe) : fil -> arc d'interieur -> douille -> ampoule
 * (col, tiges, globe, contour, filament, coeur, reflet speculaire) ->
 * maille -> occlusion ecretee -> lisere. La douille et l'ampoule passent
 * sous le tressage : elles ne sont visibles que par transparence (le voile
 * d'interstice a 0,38 les attenue deja) et par l'ouverture basse.
 *
 * `id` nomme tous les identifiants de `<defs>` de cette instance (et ceux
 * que `Maille` derive a son tour). Une valeur par defaut convient tant
 * qu'une seule instance est montee ; des que la tache 13 en monte une
 * seconde (le commutateur), deux jeux de `<defs>` partageant les memes
 * identifiants se marcheraient dessus en silence — aucun test ni typecheck
 * ne le detecte, seul le rendu HTML le revele.
 */
export function Ampoule({ id = "ampoule-eteinte" }: { id?: string } = {}) {
  const idContourDome = `contour-dome-${id}`;
  const idOcclusion = `occlusion-bord-${id}`;
  const idLisere = `lisere-incidence-${id}`;

  return (
    <>
    {/* L6 la moucheture puis L4 le faisceau (tache 11, ronde de correction
        1) : chacun dans son SVG, car un `position: fixed` forme un contexte
        d'empilement ISOLE : un `mix-blend-mode` pose sur un enfant ne
        fusionnerait qu'avec le contenu de ce SVG, jamais avec la page. Les
        classes `couche-moucheture` / `couche-faisceau` (opacite et fusion,
        globals.css) sont donc portees par l'element `<svg>` lui-meme. Ils
        sont derriere le contenu de la page
        (`.ampoule-lumiere`, z-index -1, globals.css). Un `screen` ou un
        `overlay` pose au-dessus du texte eclaircit le texte ET son fond et
        comprime leur contraste ; derriere, la lumiere ne modifie que le
        fond. Meme `viewBox` et meme classe `.ampoule` que l'objet ci-dessous
        (donc meme assise : fixed, top 0, right, scale, origin 100% 0) : le
        faisceau doit sortir exactement du bord de l'abat-jour. L5 le halo
        est `body::before`, egalement a z-index -1 ; l'ordre de peinture
        L5 -> L6 -> L4 est l'ordre de l'arbre. La moucheture reference par
        `<use href>` le `<symbol>` de la maille, defini dans le SVG de
        l'objet : la resolution se fait sur le document entier. Aucun second
        `feTurbulence`. */}
    <svg
      className="ampoule ampoule-lumiere couche-moucheture"
      viewBox="0 0 176 560"
      aria-hidden="true"
      focusable="false"
    >
      <CoucheMoucheture idMaille={id} />
    </svg>
    <svg
      className="ampoule ampoule-lumiere couche-faisceau"
      viewBox="0 0 176 560"
      aria-hidden="true"
      focusable="false"
    >
      <CoucheFaisceau />
    </svg>
    <svg
      className="ampoule"
      viewBox="0 0 176 560"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={idContourDome}>
          <path d={SILHOUETTE_FERMEE} />
        </clipPath>
        <linearGradient id={idOcclusion} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B0D0F" stopOpacity={0} />
          <stop offset="100%" stopColor="#0B0D0F" stopOpacity={0.55} />
        </linearGradient>
        <linearGradient
          id={idLisere}
          gradientUnits="userSpaceOnUse"
          x1={LISERE_DEBUT_X}
          y1={LISERE_DEBUT_Y}
          x2={LISERE_FIN_X}
          y2={LISERE_FIN_Y}
        >
          <stop offset="0%" stopColor="#9AA096" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#9AA096" stopOpacity={0} />
        </linearGradient>
      </defs>

      <path d={FIL} stroke={COULEUR_FIL} strokeWidth={1.5} strokeLinecap="round" fill="none" />

      {/* Arc d'interieur visible : demi-ellipse superieure du bord, le fond
          de la cavite entrevue par l'ouverture basse. ATTENTION au
          sweep-flag (l'avant-dernier chiffre de la commande A) : ces deux
          points (4,256) et (172,256) admettent DEUX moities d'ellipse aux
          coordonnees identiques, seul ce drapeau les distingue. sweep=1
          fait croitre theta de 180 a 360 deg et passe par le haut, milieu
          (88, 244) — a l'interieur de la coupole, comme l'exige l'annexe
          §1.4. sweep=0 ferait decroitre theta et passerait par le bas,
          milieu (88, 268) : 12 px sous le bord du dome, hors de l'objet et
          non ecrete. Ne pas rebasculer ce drapeau sans revalider sur le
          HTML rendu, pas seulement sur la lecture du chemin. */}
      <path
        d={`M 4 ${BORD_Y} A 84 12 0 0 1 172 ${BORD_Y} Z`}
        fill={COULEUR_INTERIEUR}
        fillOpacity={0.88}
      />

      {/* Douille : entierement contenue dans le dome (y <= 208), visible
          uniquement par transparence du tressage. */}
      <rect x={81} y={178} width={14} height={22} rx={2} fill={COULEUR_DOUILLE} />
      <rect x={79} y={197} width={18} height={3.5} rx={1} fill={COULEUR_DOUILLE} />
      <line x1={82} y1={202} x2={94} y2={202} stroke={COULEUR_DOUILLE} strokeWidth={1} />
      <line x1={82} y1={205} x2={94} y2={205} stroke={COULEUR_DOUILLE} strokeWidth={1} />
      <line x1={82} y1={208} x2={94} y2={208} stroke={COULEUR_DOUILLE} strokeWidth={1} />

      {/* Ampoule : col, tiges, globe (remplissage + contour), filament,
          coeur, reflet speculaire — dans cet ordre. */}
      <path d="M 81 208 L 95 208 L 91.5 214 L 84.5 214 Z" fill={COULEUR_GLOBE} fillOpacity={0.9} />
      <line
        x1={85}
        y1={214}
        x2={85.5}
        y2={230}
        stroke={LUMIERE.filamentFroid}
        strokeWidth={0.8}
      />
      <line
        x1={91}
        y1={214}
        x2={90.5}
        y2={230}
        stroke={LUMIERE.filamentFroid}
        strokeWidth={0.8}
      />
      <circle
        cx={CENTRE_X}
        cy={232}
        r={21}
        fill={COULEUR_GLOBE}
        fillOpacity={0.9}
        stroke={COULEUR_CONTOUR_GLOBE}
        strokeWidth={1}
      />
      <ellipse
        cx={CENTRE_X}
        cy={233}
        rx={6}
        ry={3.5}
        fill="none"
        stroke={LUMIERE.filamentFroid}
        strokeWidth={1}
      />
      <ellipse cx={CENTRE_X} cy={233} rx={2.2} ry={1.4} fill={LUMIERE.filamentFroid} />
      <path
        d="M 78 222 Q 81 219 84 218"
        fill="none"
        stroke="#9AA096"
        strokeOpacity={0.3}
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* Groupe isole (addendum du controleur, tache 8, point B) : seules
          ces trois couches — L2 la lueur du tressage, la maille, L1 le
          filament — vivent dans un contexte d'empilement isole.
          `isolation: isolate` (globals.css, `.lampe-isolee`) confine leur
          `mix-blend-mode: screen` a l'interieur du groupe, pour qu'il
          n'eclaircisse pas le fond de la page a travers le SVG. NE PAS
          poser cette isolation sur le SVG de la lumiere : L4 le faisceau,
          L5 le halo de fond et L6 la moucheture (SVG `.ampoule-lumiere`
          ci-dessus et globals.css) doivent au contraire eclairer la page
          au-dela de l'objet — les isoler les neutraliserait. Ne pas
          elargir ce groupe pour les y inclure. */}
      <g className="lampe-isolee">
        <CoucheLueur />
        <Maille id={id} />
        <CoucheFilament />
      </g>

      {/* Occlusion sous le bord : ecretee au contour du dome, qui est plus
          etroit que 84 a cette hauteur. */}
      <rect
        x={4}
        y={226}
        width={168}
        height={30}
        fill={`url(#${idOcclusion})`}
        clipPath={`url(#${idContourDome})`}
      />

      {/* Lisere d'incidence haut-gauche : suit le profil reel de y=178 a
          y=212, degrade d'opacite 0,22 -> 0 sur ce parcours. */}
      <path d={CHEMIN_LISERE} fill="none" stroke={`url(#${idLisere})`} strokeWidth={1} />
    </svg>
    </>
  );
}
