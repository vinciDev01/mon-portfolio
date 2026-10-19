import { prochainIndex, type Direction } from "./pagination";

/** Seuil du balayage tactile, en pixels. */
export const SEUIL_TACTILE = 48;

export type ActionClavier =
  | { type: "aller"; cible: number }
  | { type: "defiler"; dy: number }
  | null;

/**
 * Ce que fait une touche. Les touches de pagination respectent la butee
 * exactement comme la molette : `html` et `body` sont en `overflow: hidden`
 * et le focus ne suit pas la molette, donc hors butee on FAIT defiler la
 * section nous-memes (retour `defiler`), sans quoi le bas d'une section plus
 * haute que l'ecran serait illisible au clavier. `Home` et `End` sautent aux
 * extremites : c'est leur sens.
 */
export function actionClavier(
  touche: string,
  maj: boolean,
  index: number,
  nombre: number,
  enButee: (d: Direction) => boolean,
  hauteur: number,
): ActionClavier {
  const pas = (d: Direction, dy: number): ActionClavier =>
    enButee(d)
      ? { type: "aller", cible: prochainIndex(index, nombre, d, true) }
      : { type: "defiler", dy: dy * d };
  switch (touche) {
    case "PageDown":
      return pas(1, hauteur * 0.9);
    case "PageUp":
      return pas(-1, hauteur * 0.9);
    case " ":
      return pas(maj ? -1 : 1, hauteur * 0.9);
    case "ArrowDown":
      return pas(1, 40);
    case "ArrowUp":
      return pas(-1, 40);
    case "End":
      return nombre > 0 ? { type: "aller", cible: nombre - 1 } : null;
    case "Home":
      return nombre > 0 ? { type: "aller", cible: 0 } : null;
    default:
      return null;
  }
}

/** Un balayage ne pagine que s'il est assez long ET plus vertical qu'horizontal. */
export function directionTactile(dx: number, dy: number): Direction | null {
  if (Math.abs(dy) < SEUIL_TACTILE || Math.abs(dy) <= Math.abs(dx)) return null;
  return dy > 0 ? 1 : -1;
}

type EvenementMolette = {
  deltaY: number;
  ctrlKey: boolean;
  preventDefault: () => void;
};

/**
 * Le gestionnaire de molette, dependances injectees pour etre testable sans
 * DOM. `delta` est deja normalise en pixels.
 */
export function traiterMolette(
  e: EvenementMolette,
  delta: number,
  d: {
    enButee: (dir: Direction) => boolean;
    verrouille: () => boolean;
    pousser: (delta: number) => Direction | null;
    aller: (dir: Direction) => void;
  },
): void {
  // `Ctrl` + molette est le zoom du navigateur et le pincement du pave
  // tactile. Le capter empecherait d'agrandir la page, qui est un outil
  // d'accessibilite exige par WCAG 1.4.4.
  if (e.ctrlKey) return;
  if (delta === 0) return;
  const direction: Direction = delta > 0 ? 1 : -1;
  // Hors butee, la section defile a l'interieur : on laisse faire.
  if (!d.enButee(direction)) return;
  e.preventDefault();
  if (d.verrouille()) return;
  const sens = d.pousser(delta);
  if (sens !== null) d.aller(sens);
}
