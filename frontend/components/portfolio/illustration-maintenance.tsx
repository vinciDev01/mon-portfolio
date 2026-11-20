/**
 * L'illustration de la page de maintenance : l'ampoule du site, suspendue
 * au-dessus d'un etabli ou un ordinateur portable affiche du code et une barre
 * de progression, avec deux engrenages et un tournevis. Dessinee en SVG avec les couleurs du
 * theme (variables CSS) : elle suit l'ampoule, du jour a la nuit, sans image
 * a charger. Les engrenages tournent lentement, sauf si le visiteur a demande
 * a reduire les animations.
 */

/** Une roue dentee de `dents` dents, centree sur (cx, cy). */
function cheminEngrenage(cx: number, cy: number, rayon: number, dents: number): string {
  const interieur = rayon * 0.78;
  const pas = (Math.PI * 2) / dents;
  const points: string[] = [];
  for (let i = 0; i < dents; i++) {
    const a = i * pas;
    // Chaque dent : deux points sur le cercle exterieur, deux a l'interieur.
    for (const [r, d] of [
      [interieur, -0.5],
      [rayon, -0.28],
      [rayon, 0.28],
      [interieur, 0.5],
    ] as const) {
      const t = a + d * pas;
      points.push(`${(cx + r * Math.cos(t)).toFixed(2)},${(cy + r * Math.sin(t)).toFixed(2)}`);
    }
  }
  return `M${points.join("L")}Z`;
}

const ROTATION =
  "origin-center [transform-box:fill-box] motion-safe:animate-[spin_14s_linear_infinite]";
const ROTATION_INVERSE =
  "origin-center [transform-box:fill-box] motion-safe:animate-[spin_10s_linear_infinite_reverse]";

export function IllustrationMaintenance({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 230"
      className={className}
      role="img"
      aria-hidden="true"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Le halo de l'ampoule sur l'etabli. */}
      <ellipse cx="160" cy="196" rx="120" ry="14" fill="var(--accent)" opacity="0.12" />
      <path d="M160 66 L92 190 H228 Z" fill="var(--accent)" opacity="0.07" />

      {/* L'ampoule suspendue, comme celle du site. */}
      <line x1="160" y1="0" x2="160" y2="34" stroke="var(--texte-secondaire)" strokeWidth="1.5" />
      <rect x="153" y="32" width="14" height="10" rx="2" fill="var(--texte-secondaire)" />
      <path
        d="M160 42c-11 0-19 8-19 18 0 7 4 11 7 14 2 2 3 4 3 6h18c0-2 1-4 3-6 3-3 7-7 7-14 0-10-8-18-19-18z"
        fill="var(--surface)"
        stroke="var(--texte)"
        strokeWidth="2"
      />
      <path d="M153 66 l3.5 6 3.5 -6 3.5 6 3.5 -6" stroke="var(--accent)" strokeWidth="1.6" />
      <line x1="153" y1="84" x2="167" y2="84" stroke="var(--texte)" strokeWidth="2" />

      {/* L'etabli. */}
      <line x1="40" y1="190" x2="280" y2="190" stroke="var(--texte)" strokeWidth="2.5" />
      <line x1="64" y1="190" x2="58" y2="226" stroke="var(--texte-secondaire)" strokeWidth="2" />
      <line x1="256" y1="190" x2="262" y2="226" stroke="var(--texte-secondaire)" strokeWidth="2" />

      {/* L'ordinateur portable : du code et une barre de progression. */}
      <rect x="110" y="112" width="100" height="66" rx="6" fill="var(--surface)" stroke="var(--texte)" strokeWidth="2" />
      <path d="M100 178 h120 l-8 12 h-104 z" fill="var(--surface)" stroke="var(--texte)" strokeWidth="2" />
      <path d="M140 132 l-8 8 8 8" stroke="var(--accent)" strokeWidth="2.2" />
      <path d="M180 132 l8 8 -8 8" stroke="var(--accent)" strokeWidth="2.2" />
      <line x1="164" y1="128" x2="156" y2="152" stroke="var(--texte-secondaire)" strokeWidth="2" />
      <rect x="126" y="162" width="68" height="5" rx="2.5" fill="var(--bordure)" />
      <rect x="126" y="162" width="44" height="5" rx="2.5" fill="var(--accent)" />

      {/* Les engrenages, a gauche de l'ordinateur. */}
      <g className={ROTATION}>
        <path d={cheminEngrenage(72, 160, 22, 10)} fill="var(--surface)" stroke="var(--texte)" strokeWidth="2" />
        <circle cx="72" cy="160" r="7" stroke="var(--texte)" strokeWidth="2" />
      </g>
      <g className={ROTATION_INVERSE}>
        <path d={cheminEngrenage(94, 128, 13, 8)} fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
        <circle cx="94" cy="128" r="4" stroke="var(--accent)" strokeWidth="2" />
      </g>

      {/* Le tournevis, pose a droite de l'ordinateur. */}
      <rect x="230" y="179" width="22" height="9" rx="4" fill="var(--accent)" stroke="var(--texte)" strokeWidth="2" />
      <line x1="252" y1="183.5" x2="272" y2="183.5" stroke="var(--texte)" strokeWidth="2.2" />
      <line x1="272" y1="181" x2="272" y2="186" stroke="var(--texte)" strokeWidth="2.2" />
    </svg>
  );
}
