/** Luminance relative WCAG 2.x d'une couleur hexadecimale. */
export function luminanceRelative(hex: string): number {
  const n = hex.replace("#", "");
  const canaux = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const lineaire = canaux.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * lineaire[0] + 0.7152 * lineaire[1] + 0.0722 * lineaire[2];
}

/** Ratio de contraste WCAG entre deux couleurs, de 1 a 21. */
export function ratioContraste(avant: string, arriere: string): number {
  const a = luminanceRelative(avant);
  const b = luminanceRelative(arriere);
  const [clair, sombre] = a > b ? [a, b] : [b, a];
  return (clair + 0.05) / (sombre + 0.05);
}

/** Melange une couleur vers une autre selon un taux de 0 a 1. */
export function melanger(source: string, cible: string, taux: number): string {
  const lire = (hex: string) => {
    const n = hex.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  };
  const [rs, gs, bs] = lire(source);
  const [rc, gc, bc] = lire(cible);
  const mix = (s: number, c: number) => Math.round(s * (1 - taux) + c * taux);
  return (
    "#" +
    [mix(rs, rc), mix(gs, gc), mix(bs, bc)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}
