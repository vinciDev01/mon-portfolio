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
 * Les deux couleurs d'un logo, une par theme : sa couleur de marque, si elle
 * tient 3:1 sur la surface des etiquettes de ce theme ; sinon la couleur du
 * texte, toujours lisible (le logo noir de GitHub la nuit, un logo blanc le
 * jour). Sans couleur de marque, le texte dans les deux themes.
 */
export function couleursLogo(hex: string | null | undefined): { nuit: string; jour: string } {
  const texte = "var(--texte)";
  if (!hex || !/^[0-9a-f]{6}$/i.test(hex)) return { nuit: texte, jour: texte };
  const marque = `#${hex}`;
  return {
    nuit: contraste(marque, PALETTE_SOMBRE.surface) >= CONTRASTE_LOGO ? marque : texte,
    jour: contraste(marque, PALETTE_CLAIRE.surface) >= CONTRASTE_LOGO ? marque : texte,
  };
}
