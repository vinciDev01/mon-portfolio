import { describe, it, expect } from "vitest";
import { bloc, contenuGaucheA, lire, PALIERS, tableDesContenus, variableA } from "./feuille-test";

/* Le defaut : trois elements vivent hors de `SectionShell` et ne recevaient
   donc jamais la gouttiere gauche qui reserve la colonne de passage, opaque et
   fixe. Le pied de page glissait dessous de 32 a 80 px, la ligne de
   disponibilite commencait a x = 0, le toast se centrait sur la fenetre. */

const page = lire("app/page.tsx");
const GOUTTIERE = "gouttiere-parcours";

/** Garde minimale entre la colonne et le contenu (spec 4.1), aux paliers
 *  ou la colonne est une bande superposee. */
const GARDE_MIN = 16;

/** Corps de `<main>` dans la page, commentaires JSX retires. */
const corpsMain = (() => {
  const debut = page.indexOf("<main");
  const fin = page.indexOf("</main>");
  expect(debut, "<main> introuvable").toBeGreaterThan(-1);
  return page
    .slice(page.indexOf(">", debut) + 1, fin)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
})();

/**
 * Enfants directs de `<main>` : tout ce qui reste une fois les `SectionShell`
 * retirees (elles portent la gouttiere elles-memes). Une balise ajoutee demain
 * y apparait sans qu'on ait rien a declarer.
 */
const enfants = (() => {
  const sansCoquilles = corpsMain.replace(/<SectionShell[\s\S]*?<\/SectionShell>/g, "");
  return [...sansCoquilles.matchAll(/<([A-Za-z][\w.]*)((?:[^<>]|=>)*?)\/?>/g)].map((m) => ({
    balise: m[1]!,
    attributs: m[2]!,
  }));
})();

/** Fichier source d'un composant importe par la page. */
function sourceDe(balise: string): string {
  const m = new RegExp(`import \\{[^}]*\\b${balise}\\b[^}]*\\} from "@/([^"]+)"`).exec(page);
  expect(m, `import de ${balise} introuvable dans page.tsx`).not.toBeNull();
  return lire(`${m![1]}.tsx`);
}

/** Classes de la premiere balise rendue par le composant `nom` de `source`. */
function classesRacine(source: string, nom: string): { classes: string[]; rienRendu: boolean } {
  const i = source.search(new RegExp(`export function ${nom}\\b`));
  const suite = source.slice(i + 1);
  const fin = suite.search(/\nexport (?:default )?(?:async )?function /);
  const corps = source.slice(i, fin === -1 ? undefined : i + 1 + fin);
  // `return (` suivi d'une balise : `return () => {` d'un effet n'en est pas un.
  const retours = [...corps.matchAll(/return \(\s*</g)];
  const r = retours.length ? retours[retours.length - 1]!.index! : -1;
  if (r === -1) return { classes: [], rienRendu: /return null;/.test(corps) };
  const m = /<[a-z][\w]*[^>]*?className="([^"]*)"/.exec(corps.slice(r));
  return { classes: m ? m[1]!.split(/\s+/) : [], rienRendu: false };
}

const positionFixe = (classe: string) =>
  classe === "fixed" ||
  new RegExp(`\\.${classe}\\s*\\{[^}]*position:\\s*fixed`).test(lire("app/globals.css"));

describe("la gouttiere du parcours", () => {
  it("est une regle unique, qui reserve la colonne", () => {
    const regle = bloc(/\.gouttiere-parcours\s*\{/);
    expect(regle).toMatch(/padding-inline-start:\s*var\(--contenu-gauche\)/);
    expect(regle).toMatch(/padding-inline-end:\s*var\(--gouttiere\)/);
  });

  it("garde au moins 16 px entre la colonne et le contenu a chaque palier", () => {
    expect(PALIERS.length).toBeGreaterThan(1);
    for (const p of PALIERS) {
      const fenetre = Math.max(p.min, 320);
      expect(
        contenuGaucheA(fenetre) - variableA("--colonne", fenetre),
        `palier ${p.min} px`,
      ).toBeGreaterThanOrEqual(GARDE_MIN);
    }
  });

  it("n'est definie qu'une fois : une seule regle de gouttiere", () => {
    const css = lire("app/globals.css");
    expect(css.match(/\.gouttiere-parcours\s*\{/g)).toHaveLength(1);
  });

  it("la coquille de section la porte", () => {
    expect(lire("components/portfolio/section-shell.tsx")).toContain(GOUTTIERE);
  });
});

describe("les elements hors de SectionShell", () => {
  it("la page a bien des enfants directs a examiner", () => {
    // Le conteneur et le toast configurable : sans eux la boucle suivante
    // n'examinerait rien.
    expect(enfants.length).toBeGreaterThanOrEqual(2);
  });

  it("chaque enfant direct de <main> est une SectionShell, porte la gouttiere, ou est fixe", () => {
    // Un quatrieme element ajoute hors SectionShell reproduirait le defaut : il
    // echoue ici en etant nomme. Un composant qui ne rend rien n'a pas de
    // boite et n'a donc rien a reserver.
    for (const { balise, attributs } of enfants) {
      let ok: boolean;
      if (/^[a-z]/.test(balise)) {
        const cl = /className="([^"]*)"/.exec(attributs)?.[1]?.split(/\s+/) ?? [];
        ok = cl.includes(GOUTTIERE) || cl.some(positionFixe);
      } else {
        const { classes, rienRendu } = classesRacine(sourceDe(balise), balise);
        ok = rienRendu || classes.includes(GOUTTIERE) || classes.some(positionFixe);
      }
      expect(ok, `<${balise}> est hors SectionShell sans gouttiere ni position fixe`).toBe(true);
    }
  });

  it("le pied de page ne declare plus d'utilitaire px-", () => {
    const pied = lire("components/portfolio/footer.tsx");
    const racine = /<footer\s[^>]*className="([^"]*)"/.exec(pied);
    expect(racine, "balise footer introuvable").not.toBeNull();
    expect(racine![1]).toContain(GOUTTIERE);
    expect(racine![1]).not.toMatch(/(?:^|[\s:])px-/);
  });

  it("le toast se centre dans l'espace restant, par un retrait et non par un padding", () => {
    const toast = lire("components/portfolio/toast-notification.tsx");
    const m = /className="(fixed [^"]*)"/.exec(toast);
    expect(m, "conteneur fixe introuvable").not.toBeNull();
    expect(m![1]).toContain("start-[var(--colonne)]");
    expect(m![1]).not.toContain("inset-x-0");
  });

  it("la ligne de disponibilite garde sa marge, et sa gouttiere vient de la coquille", () => {
    expect(bloc(/\.ligne-disponibilite\s*\{/)).toMatch(/margin-block-end/);
    // Elle vit dans le contenu de l'ouverture, donc dans une SectionShell qui
    // porte deja la gouttiere : la porter aussi doublerait le retrait.
    expect(lire("components/parcours/drapeau-disponibilite.tsx")).toMatch(
      /className="ligne-disponibilite"/,
    );
    const ouverture = tableDesContenus().find((e) => e.id === "ouverture")!;
    // Structure, pas cooccurrence : la ligne doit etre DANS la coquille, qui
    // s'ouvre avant elle et ne s'est pas refermee entre les deux.
    const ouvre = ouverture.texte.indexOf("<SectionShell");
    const ligne = ouverture.texte.indexOf("<LigneDisponibilite");
    expect(ouvre, "<SectionShell> absente de l'ouverture").toBeGreaterThan(-1);
    expect(ligne, "<LigneDisponibilite> absente de l'ouverture").toBeGreaterThan(-1);
    expect(ouvre).toBeLessThan(ligne);
    expect(
      ouverture.texte.slice(ouvre, ligne),
      "la coquille est refermee avant la ligne",
    ).not.toContain("</SectionShell>");
    expect(ouverture.texte.indexOf("</SectionShell>", ligne)).toBeGreaterThan(ligne);
  });
});
