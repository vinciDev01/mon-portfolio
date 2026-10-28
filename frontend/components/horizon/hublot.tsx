import type { CSSProperties } from "react";

/**
 * L'horizon maritime : la mer vue par un hublot de laiton, en bas a droite,
 * dans la bande que l'ampoule laisse libre au-dessus d'elle. La lune et ses
 * etoiles en theme sombre, le soleil couchant en theme clair : les couleurs
 * suivent `--t-page`, comme toute la palette.
 *
 * Le scintillement : des lueurs sur le chemin de l'astre et quelques etoiles
 * varient d'opacite, lentement, chacune a son rythme. Rien ne se deplace. La
 * feuille les fige pour qui demande moins de mouvement.
 *
 * Valeurs fixes et non tirees au hasard : le rendu serveur et le rendu client
 * doivent etre identiques. Aucun degrade : des aplats, comme partout.
 */

/** Une lueur : un trait horizontal sur l'eau, plus large a mesure qu'il
 *  approche (le reflet s'evase vers le spectateur). */
const LUEURS = [
  { x: 128, y: 110, l: 5, duree: 2.6, delai: 0 },
  { x: 125, y: 117, l: 8, duree: 3.4, delai: -1.1 },
  { x: 131, y: 124, l: 7, duree: 2.9, delai: -2.2 },
  { x: 126, y: 132, l: 11, duree: 4.1, delai: -0.6 },
  { x: 133, y: 140, l: 9, duree: 3.1, delai: -1.9 },
  { x: 124, y: 149, l: 14, duree: 3.7, delai: -2.8 },
  { x: 132, y: 158, l: 12, duree: 2.7, delai: -0.3 },
  { x: 127, y: 167, l: 17, duree: 4.4, delai: -3.3 },
  { x: 135, y: 175, l: 13, duree: 3.2, delai: -1.4 },
];

const ETOILES = [
  { x: 62, y: 52, r: 1.1, duree: 4.2, delai: -0.8 },
  { x: 92, y: 38, r: 0.9, duree: 3.6, delai: -2.1 },
  { x: 150, y: 46, r: 1.2, duree: 5, delai: -1.3 },
  { x: 74, y: 78, r: 0.8, duree: 3.9, delai: -3 },
  { x: 160, y: 72, r: 0.9, duree: 4.6, delai: -0.2 },
  { x: 112, y: 60, r: 0.7, duree: 3.3, delai: -2.6 },
];

/** Les rivets de l'anneau, tous les 45 degres. */
const RIVETS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4 + Math.PI / 8;
  return { x: Math.round((100 + 89 * Math.cos(a)) * 10) / 10, y: Math.round((100 + 89 * Math.sin(a)) * 10) / 10 };
});

const rythme = (duree: number, delai: number) =>
  ({ "--duree": `${duree}s`, "--delai": `${delai}s` }) as CSSProperties;

export function Hublot() {
  return (
    <div className="hublot" aria-hidden="true">
      <svg viewBox="0 0 200 200" focusable="false">
        <defs>
          <clipPath id="hublot-verre">
            <circle cx="100" cy="100" r="78" />
          </clipPath>
        </defs>

        <g clipPath="url(#hublot-verre)">
          {/* Le ciel en deux aplats, la bande basse plus claire. */}
          <rect className="hublot-ciel" x="0" y="0" width="200" height="104" />
          <rect className="hublot-ciel-bas" x="0" y="84" width="200" height="20" />
          <g className="hublot-etoiles">
            {ETOILES.map((e) => (
              <circle key={`${e.x}-${e.y}`} className="hublot-etoile" cx={e.x} cy={e.y} r={e.r} style={rythme(e.duree, e.delai)} />
            ))}
          </g>
          <circle className="hublot-astre" cx="128" cy="95" r="9" />
          {/* Un voilier au loin, sur la ligne d'horizon. */}
          <path className="hublot-voilier" d="M 64 103 L 76 103 L 74 105 L 66 105 Z M 69.5 102.5 L 69.5 91 L 75 102.5 Z M 69 102.5 L 69 94 L 65.5 102.5 Z" />
          {/* La mer : le large plus clair, le proche plus sombre, et deux
              rides immobiles. */}
          <rect className="hublot-mer-loin" x="0" y="104" width="200" height="22" />
          <rect className="hublot-mer" x="0" y="126" width="200" height="74" />
          <path className="hublot-ride" d="M 40 138 h 22 M 152 150 h 18 M 58 168 h 26" />
          {LUEURS.map((l) => (
            <rect
              key={`${l.x}-${l.y}`}
              className="hublot-lueur"
              x={l.x - l.l / 2}
              y={l.y}
              width={l.l}
              height="1.6"
              rx="0.8"
              style={rythme(l.duree, l.delai)}
            />
          ))}
          {/* Le reflet du verre, un aplat translucide en haut a gauche. */}
          <path className="hublot-reflet" d="M 38 70 A 64 64 0 0 1 84 32 L 88 40 A 56 56 0 0 0 46 74 Z" />
        </g>

        {/* L'anneau de laiton et ses rivets, par-dessus le bord du verre. */}
        <circle className="hublot-anneau" cx="100" cy="100" r="88" />
        <circle className="hublot-bord" cx="100" cy="100" r="78.5" />
        {RIVETS.map((r) => (
          <circle key={`${r.x}-${r.y}`} className="hublot-rivet" cx={r.x} cy={r.y} r="3" />
        ))}
      </svg>
    </div>
  );
}
