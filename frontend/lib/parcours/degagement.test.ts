import { describe, it, expect } from "vitest";
import { bloc, contenuGaucheA, css, variableA } from "./feuille-test";

const CH = 8.73;
const GARDE = 16;
const PLEINE = 576;
const PLANCHER = 358;

/* Les reglages de l'ampoule ont une valeur par defaut dans la formule meme
   (`var(--ampoule-droite, 48px)`) : on la lit la, comme le navigateur. */
const regleBloc = bloc(/\.bloc-parcours\s*\{/);
const DROITE_DEFAUT = Number(/var\(--ampoule-droite,\s*([\d.]+)px\)/.exec(regleBloc)![1]);
const ECHELLE_DEFAUT = Number(/var\(--ampoule-echelle,\s*([\d.]+)\)/.exec(css)![1]);
const OBJET = Number(/--ampoule-largeur:\s*calc\(([\d.]+)px/.exec(regleBloc)![1]);

/**
 * Reproduit la formule de la spec, section 4.2. Tout ce qui vient de la
 * feuille (colonne, gouttiere, bord gauche du contenu, ampoule) y est lu et
 * non recopie : changer un palier change la geometrie verifiee.
 */
function geometrie(largeur: number, zigzag = 0.5) {
  const colonne = variableA("--colonne", largeur);
  const gouttiere = variableA("--gouttiere", largeur);
  const x0 = contenuGaucheA(largeur);
  const droite = variableA("--ampoule-droite", largeur, DROITE_DEFAUT);
  const echelle = variableA("--ampoule-echelle", largeur, ECHELLE_DEFAUT);
  const C = largeur - x0 - gouttiere;
  const A = C + gouttiere - droite - OBJET * echelle - GARDE;
  const mesure = Math.min(C, Math.max(PLANCHER, Math.min(PLEINE, A)));
  const ampouleGauche = largeur - droite - OBJET * echelle;
  const decalage = Math.max(0, Math.min(zigzag * (C - mesure), A - mesure));
  return { colonne, gouttiere, x0, C, A, mesure, ampouleGauche, decalage };
}

describe("regle de degagement (spec section 4.2)", () => {
  it("reproduit la table de la spec, section 4.3", () => {
    const attendu: Array<[number, number, number]> = [
      // largeur, mesure en px, garde en px
      [1440, 576, 340],
      [1200, 576, 108],
      [1024, 576, 51],
      [1023, 576, 186],
      [900, 576, 63],
      [700, 458, 16],
      [600, 358, 16],
      [599, 425, 16],
      [480, 358, -36],
      [360, 272, -70],
      [320, 248, -72],
    ];
    for (const [largeur, mesure, garde] of attendu) {
      const g = geometrie(largeur);
      expect(Math.round(g.mesure), `mesure a ${largeur}`).toBe(mesure);
      expect(Math.round(g.ampouleGauche - (g.x0 + g.mesure)), `garde a ${largeur}`).toBe(garde);
    }
  });

  it("lit la geometrie dans la feuille et non dans des nombres recopies", () => {
    // Garde-fou du helper lui-meme : s'il ne trouvait rien, tout serait NaN.
    for (const l of [320, 599, 600, 1023, 1024, 1199, 1200, 1440]) {
      const g = geometrie(l);
      for (const [nom, v] of Object.entries(g)) {
        expect(Number.isFinite(v), `${nom} a ${l}`).toBe(true);
      }
    }
  });

  it("reproduit la colonne du decalage de la table 4.3 aux onze lignes", () => {
    // Largeur, decalage en px au reglage 0,5 (celui de la table).
    const attendu: Array<[number, number]> = [
      [1440, 248],
      [1200, 92],
      [1024, 35],
      [1023, 164],
      [900, 47],
      [700, 0],
      [600, 0],
      [599, 0],
      [480, 0],
      [360, 0],
      [320, 0],
    ];
    for (const [largeur, decalage] of attendu) {
      expect(Math.round(geometrie(largeur).decalage), `decalage a ${largeur}`).toBe(decalage);
    }
    // 1023 : la table arrondit 163,5.
    expect(geometrie(1023).decalage).toBeCloseTo(163.5, 1);
  });

  it("corrige le defaut existant des 11 px au palier 900, decalage compris", () => {
    // Avant cette spec : bloc de rang pair 162 a 738, ampoule a partir de 727.
    // Le defaut vivait dans la configuration decalee : sans le plafond, le
    // decalage valait 0,5 * (C - mesure) = 102 px au lieu de 47, et le texte
    // passait 39 px sous l'ampoule.
    const g = geometrie(900);
    expect(g.ampouleGauche - (g.x0 + g.mesure)).toBeGreaterThanOrEqual(GARDE);
    expect(0.5 * (g.C - g.mesure)).toBeCloseTo(102, 0);
    expect(g.decalage).toBeLessThan(0.5 * (g.C - g.mesure));
    expect(g.ampouleGauche - (g.x0 + g.decalage + g.mesure)).toBeGreaterThanOrEqual(GARDE - 1e-9);
  });

  it("le texte decale ne passe jamais sous l'ampoule, a tout reglage du zigzag", () => {
    // Hors du recouvrement assume (480 px et en dessous, section 4.2) : la
    // garde de 16 px est tenue pour 0, 0,5 et 1.
    for (const largeur of [1440, 1200, 1024, 1023, 900, 700, 600, 599]) {
      for (const z of [0, 0.5, 1]) {
        const g = geometrie(largeur, z);
        expect(
          g.x0 + g.decalage + g.mesure,
          `bord droit a ${largeur} px, zigzag ${z}`,
        ).toBeLessThanOrEqual(g.ampouleGauche - GARDE + 1e-9);
      }
    }
  });

  it("ne descend jamais sous 28 caracteres, meme a 320 px", () => {
    // 28 et non 31 : a 320 px, atteindre 31 ch demanderait que la colonne et
    // sa garde tiennent en 49 px, or 40 + 16 en font 56. Aucun reglage n'y
    // parvient, et la spec section 4.2 inscrit ce plancher.
    for (const largeur of [320, 360, 420, 480, 540]) {
      expect(geometrie(largeur).mesure / CH).toBeGreaterThanOrEqual(28);
    }
  });

  it("la feuille exprime le degagement sans 100vw", () => {
    // `100vw` inclut la barre de defilement la ou l'ampoule, element fixe, est
    // ancree sans elle : la formule doit partir du bord droit du conteneur.
    const corps = bloc(/\.bloc-parcours\s*\{/);
    expect(corps).toContain("--degagement");
    expect(corps).not.toContain("100vw");
  });

  it("la feuille borne la mesure par le plancher et la pleine mesure", () => {
    const corps = bloc(/\.bloc-parcours\s*\{/);
    expect(corps).toMatch(/--mesure-courante:\s*min\(\s*100%/);
    // Les roles, et pas seulement la presence : le plancher est le `max`, la
    // pleine mesure le `min` interieur. Permutes, les deux resteraient presents.
    expect(corps).toMatch(
      /--mesure-courante:\s*min\(\s*100%,\s*max\(\s*41ch,\s*min\(\s*66ch,\s*var\(--degagement\)\s*\)\s*\)\s*\)/,
    );
  });

  it("le decalage du zigzag est plafonne et reste pilote par le reglage", () => {
    const corps = bloc(/\.bloc-parcours\[data-cote="droite"\]\s*\{/);
    expect(corps).toContain("--portfolio-zigzag");
    expect(corps).toMatch(/margin-inline-start:\s*max\(\s*0px/);
    expect(corps).toContain("var(--degagement)");
    // Le plafond lui-meme, et non sa seule presence : sans lui le decalage
    // retombe a 0,5 * (C - mesure) et le defaut de la section 4.2 revient.
    expect(corps).toMatch(
      /min\(\s*calc\(var\(--portfolio-zigzag[^)]*\)\s*\*\s*\(100%\s*-\s*var\(--mesure-courante\)\)\),\s*calc\(var\(--degagement\)\s*-\s*var\(--mesure-courante\)\)\s*\)/,
    );
  });

  it("le defilement souple repasse en auto sous mouvement reduit", () => {
    // Manquement preexistant : `scroll-behavior: smooth` etait pose sur `html`
    // sans aucun garde-fou. La spec, section 5.3, l'exige.
    const m = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g;
    const blocs = [...css.matchAll(m)].map((x) => x[1]);
    expect(
      blocs.some((b) => /scroll-behavior:\s*auto/.test(b)),
      "aucun bloc de mouvement reduit ne repasse scroll-behavior en auto",
    ).toBe(true);
  });

  it("honore la derogation du backoffice au mouvement reduit", () => {
    // `data-mouvement="force"` permet au proprietaire de passer outre la
    // preference systeme, et la feuille l'honore deja ailleurs.
    const m = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g;
    const blocs = [...css.matchAll(m)].map((x) => x[1]);
    const celui = blocs.find((b) => /scroll-behavior:\s*auto/.test(b));
    expect(celui).toContain('[data-mouvement="force"]');
  });
});
