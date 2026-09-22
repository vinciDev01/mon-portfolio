import { CENTRE_X } from "@/lib/ampoule/geometrie";
import { Maille } from "./maille";

/**
 * Le fil de suspension. Jamais parfaitement vertical : la fleche de 3,2 px
 * (91.2 au lieu de 88 a mi-hauteur) supprime l'effet « trait CSS ».
 */
const FIL = "M 88 0 C 88 62, 91.2 118, 89.4 152 C 88.7 165, 88 172, 88 178";

const COULEUR_FIL = "#5A5348";

/**
 * L'objet suspendu, a l'etat eteint uniquement. Le theme n'est pas encore
 * consomme ici : il commandera plus tard l'allumage, mais l'ampoule doit
 * deja vivre a l'interieur du fournisseur de theme pour que cette bascule
 * n'ait, le moment venu, aucun arbre a reorganiser.
 */
export function Ampoule() {
  return (
    <svg
      className="ampoule"
      viewBox="0 0 176 560"
      aria-hidden="true"
      focusable="false"
    >
      <path d={FIL} stroke={COULEUR_FIL} strokeWidth={1.5} strokeLinecap="round" fill="none" />

      {/* Douille : petit fourreau metallique entre le fil et le dome. */}
      <rect x={CENTRE_X - 9} y={168} width={18} height={12} rx={2} fill={COULEUR_FIL} />

      <Maille id="ampoule-eteinte" />

      {/* Les trois indices de volume de l'etat eteint, et pas davantage. */}
      <defs>
        <linearGradient id="occlusion-bord" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B0D0F" stopOpacity={0} />
          <stop offset="100%" stopColor="#0B0D0F" stopOpacity={0.55} />
        </linearGradient>
        <linearGradient id="lisere-incidence" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9AA096" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#9AA096" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Occlusion sous le bord : assombrit la face interne du dome pres de
          son ourlet, entre y=226 et y=256. Ce n'est pas l'assombrissement
          des bords du dome (celui-la vient de la densite des meridiens) :
          c'est une ombre propre distincte, sous la surface. */}
      <rect x={4} y={226} width={168} height={30} fill="url(#occlusion-bord)" />

      {/* Lisere d'incidence haut-gauche : degressif par construction. */}
      <path
        d="M 20 190 A 84 78 0 0 1 88 178"
        fill="none"
        stroke="url(#lisere-incidence)"
        strokeWidth={1}
      />

      {/* Reflet speculaire du verre. */}
      <path
        d="M 78 222 Q 81 219 84 218"
        fill="none"
        stroke="#9AA096"
        strokeOpacity={0.3}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </svg>
  );
}
