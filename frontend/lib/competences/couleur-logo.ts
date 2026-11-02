import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";

function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const c = [0, 2, 4]
    .map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

export function contraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  const [h, l] = x > y ? [x, y] : [y, x];
  return (h + 0.05) / (l + 0.05);
}

/** Le contraste minimal d'un element graphique sur son fond (WCAG 1.4.11). */
export const CONTRASTE_LOGO = 3;

/**
 * Les logos que le catalogue donne en noir alors que la marque a une couleur
 * connue : la tasse de Java est orange, le bouclier d'Angular rouge. Ceux
 * qui sont vraiment noirs (Next.js, GitHub) n'y figurent pas.
 */
export const TEINTES_DE_MARQUE: Record<string, string> = {
  openjdk: "E76F00",
  angular: "DD0031",
};

function canaux(hex: string): [number, number, number] {
  const n = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as [number, number, number];
}

function versHex(c: readonly number[]): string {
  return `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** Un gris, du noir au blanc : pas de teinte a garder en l'eclaircissant. */
function estNeutre(hex: string): boolean {
  const c = canaux(hex);
  return Math.max(...c) - Math.min(...c) < 24;
}

/**
 * La couleur de marque rendue lisible sur `fond` : melangee pas a pas au
 * blanc (fond sombre) ou au noir (fond clair) jusqu'a tenir 3:1. Le melange
 * garde la teinte : un violet trop sombre la nuit devient un violet clair.
 */
export function teinteLisible(hex: string, fond: string): string {
  const depart = canaux(hex);
  const cible = luminance(fond) < 0.5 ? 255 : 0;
  for (let pas = 0; pas <= 20; pas++) {
    const t = pas / 20;
    const couleur = versHex(depart.map((v) => v + (cible - v) * t));
    if (contraste(couleur, fond) >= CONTRASTE_LOGO) return couleur;
  }
  return versHex([cible, cible, cible]);
}

/**
 * Les deux couleurs d'un logo, une par theme : sa couleur de marque, rendue
 * assez contrastee sur la surface des etiquettes de ce theme (3:1) en
 * l'eclaircissant la nuit, en la foncant le jour. Un logo vraiment noir ou
 * blanc n'a pas de teinte a garder : il prend la couleur du texte quand il
 * ne se voit pas (le logo noir de GitHub la nuit). Sans couleur de marque,
 * le texte dans les deux themes. `slug` : le logo du catalogue, pour les
 * marques que le catalogue donne en noir a tort (`TEINTES_DE_MARQUE`).
 */
export function couleursLogo(
  hex: string | null | undefined,
  slug?: string | null,
): { nuit: string; jour: string } {
  const texte = "var(--texte)";
  const brut = (slug && TEINTES_DE_MARQUE[slug]) || hex;
  if (!brut || !/^[0-9a-f]{6}$/i.test(brut)) return { nuit: texte, jour: texte };
  const marque = `#${brut.toUpperCase()}`;
  const pour = (fond: string) => {
    if (contraste(marque, fond) >= CONTRASTE_LOGO) return marque;
    return estNeutre(marque) ? texte : teinteLisible(marque, fond);
  };
  return { nuit: pour(PALETTE_SOMBRE.surface), jour: pour(PALETTE_CLAIRE.surface) };
}
