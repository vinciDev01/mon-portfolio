import { BORD_Y, CENTRE_X } from "@/lib/ampoule/geometrie";
import { LUMIERE } from "@/lib/design/tokens";
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
 */
export function Ampoule() {
  return (
    <svg
      className="ampoule"
      viewBox="0 0 176 560"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="contour-dome">
          <path d={SILHOUETTE_FERMEE} />
        </clipPath>
        <linearGradient id="occlusion-bord" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B0D0F" stopOpacity={0} />
          <stop offset="100%" stopColor="#0B0D0F" stopOpacity={0.55} />
        </linearGradient>
        <linearGradient
          id="lisere-incidence"
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
          de la cavite entrevue par l'ouverture basse. */}
      <path
        d={`M 4 ${BORD_Y} A 84 12 0 0 0 172 ${BORD_Y} Z`}
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

      <Maille id="ampoule-eteinte" />

      {/* Occlusion sous le bord : ecretee au contour du dome, qui est plus
          etroit que 84 a cette hauteur. */}
      <rect
        x={4}
        y={226}
        width={168}
        height={30}
        fill="url(#occlusion-bord)"
        clipPath="url(#contour-dome)"
      />

      {/* Lisere d'incidence haut-gauche : suit le profil reel de y=178 a
          y=212, degrade d'opacite 0,22 -> 0 sur ce parcours. */}
      <path d={CHEMIN_LISERE} fill="none" stroke="url(#lisere-incidence)" strokeWidth={1} />
    </svg>
  );
}
