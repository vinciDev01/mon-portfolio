/**
 * La couleur d'un logo du catalogue (Simple Icons) dans le backoffice : sa
 * couleur de marque, lisible sur le fond blanc des pages. Meme regle que le
 * site (frontend/lib/competences/couleur-logo.ts), pour un seul fond.
 */

/** Le fond des pages du backoffice. */
const FOND = "#FFFFFF";
/** Le contraste minimal d'un element graphique sur son fond (WCAG 1.4.11). */
const CONTRASTE_LOGO = 3;

/**
 * Les logos que le catalogue donne en noir alors que la marque a une couleur
 * connue : la tasse de Java est orange, le bouclier d'Angular rouge. Les memes
 * que sur le site.
 */
const TEINTES_DE_MARQUE: Record<string, string> = {
  openjdk: "E76F00",
  angular: "DD0031",
};

function canaux(hex: string): [number, number, number] {
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(c: readonly number[]): number {
  const [r, g, b] = c.map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contraste(a: readonly number[], b: readonly number[]): number {
  const [x, y] = [luminance(a), luminance(b)];
  const [h, l] = x > y ? [x, y] : [y, x];
  return (h + 0.05) / (l + 0.05);
}

function versHex(c: readonly number[]): string {
  return `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/**
 * La couleur a donner au logo, ou `undefined` pour la couleur du texte : un
 * logo sans couleur connue, ou vraiment noir ou gris (Next.js, GitHub). Une
 * couleur trop claire sur le blanc (le jaune de JavaScript) est foncee pas a
 * pas, en gardant sa teinte, jusqu'a se voir.
 */
export function couleurLogo(hex: string | null | undefined, slug?: string | null): string | undefined {
  const brut = (slug && TEINTES_DE_MARQUE[slug]) || hex;
  if (!brut || !/^[0-9a-f]{6}$/i.test(brut)) return undefined;
  const depart = canaux(brut);
  if (Math.max(...depart) - Math.min(...depart) < 24) return undefined;
  const fond = canaux(FOND.slice(1));
  for (let pas = 0; pas <= 20; pas++) {
    const c = depart.map((v) => v * (1 - pas / 20));
    if (contraste(c, fond) >= CONTRASTE_LOGO) return versHex(c);
  }
  return undefined;
}
