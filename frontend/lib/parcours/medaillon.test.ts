import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { nomVariante } from "@portfolio/shared-types";
import type { PersonalInfoDto } from "@portfolio/shared-types";
import { Medaillon } from "../../components/parcours/medaillon";
import { PresentationSection } from "../../components/portfolio/presentation-section";
import { initialesDe } from "./identite";
import { tableDesContenus } from "./feuille-test";
import { I18nProvider } from "../i18n/i18n-context";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");
const src = lire("components/parcours/medaillon.tsx");
const css = lire("app/globals.css");

const infos = (p: Partial<PersonalInfoDto>): PersonalInfoDto =>
  ({ name: "Bertrand", surname: "Fanuel", avatarPath: null, ...p }) as PersonalInfoDto;

const rendre = (p: Partial<PersonalInfoDto>) =>
  renderToStaticMarkup(
    createElement(
      // `children` est requis par le type du fournisseur mais passe en argument
      // de createElement, comme l'exige la regle react/no-children-prop.
      I18nProvider as ComponentType<{ defaultLocale: string }>,
      { defaultLocale: "fr" },
      createElement(Medaillon, { infos: infos(p) }),
    ),
  );

describe("medaillon (spec section 8)", () => {
  it("est une arche sans cadre : haute, arrondie en haut, sans bordure", () => {
    const m = /\.medaillon\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .medaillon introuvable").not.toBeNull();
    // Plus grand que l'ancien carre de 88 px, et plus haut que large : les
    // dimensions vivent sur la niche, que le palier etroit reduit.
    expect(m![1]).toMatch(/width:\s*var\(--medaillon-l\)/);
    expect(m![1]).toMatch(/height:\s*var\(--medaillon-h\)/);
    const niche = /\.medaillon-niche\s*\{([^}]*)\}/.exec(css)![1];
    expect(niche).toMatch(/--medaillon-l:\s*176px/);
    expect(niche).toMatch(/--medaillon-h:\s*220px/);
    expect(m![1]).not.toMatch(/(?:^|[;\s])border:/);
    // Arrondi en haut seulement : une arche, pas un cercle d'avatar.
    expect(m![1]).toMatch(/border-radius:\s*999px 999px 6px 6px/);
    expect(m![1]).toMatch(/object-fit:\s*cover/);
    // Spec section 9, point 4 : width, height ET overflow, lus dans la feuille.
    expect(m![1]).toMatch(/overflow:\s*hidden/);
  });

  it("n a ni ombre, ni degrade, ni filtre : l echo est un aplat", () => {
    const m = /\.medaillon\s*\{([^}]*)\}/.exec(css);
    expect(m![1]).not.toMatch(/box-shadow|gradient|filter/);
    const echo = /\.medaillon-niche::before\s*\{([^}]*)\}/.exec(css);
    expect(echo, "l echo de l arche est introuvable").not.toBeNull();
    expect(echo![1]).toMatch(/background:\s*var\(--accent\)/);
    expect(echo![1]).not.toMatch(/box-shadow|gradient|filter|blur/);
  });

  it("se reduit au palier etroit", () => {
    const etroit = /@media \(max-width:\s*599px\)\s*\{\s*\.medaillon-niche\s*\{([^}]*)\}/.exec(css);
    expect(etroit, "palier etroit du medaillon introuvable").not.toBeNull();
    expect(etroit![1]).toMatch(/--medaillon-l:\s*128px/);
  });

  it("charge assez de pixels pour sa taille", () => {
    const html = rendre({ avatarPath: "http://hote.test/uploads/personal/u.webp" });
    const balise = /<img\s[^>]*>/.exec(html)?.[0];
    expect(balise, "aucune balise img").toBeDefined();
    const base = "http://hote.test/uploads/personal/u.webp";
    // 220 px de haut a recouvrir : la variante de 264 en simple densite,
    // l'original au-dela.
    expect(balise).toContain(`src="${nomVariante(base, 264)}"`);
    const srcSet = /srcSet="([^"]*)"/.exec(balise!)?.[1];
    expect(srcSet).toBe(`${nomVariante(base, 264)} 1x, ${base} 2x`);
    expect(balise).toContain('width="176"');
    expect(balise).toContain('height="220"');
    expect(balise).toContain('class="medaillon"');
    expect(html).toMatch(/<span class="medaillon-niche">\s*<img/);
  });

  it("se replie sur les initiales quand avatarPath est nul", () => {
    const html = rendre({ avatarPath: null });
    expect(html).not.toMatch(/<img[\s>]/);
    expect(html).toContain("medaillon-repli");
    expect(html).toContain(">BF<");
  });

  it("ne cree aucun mouvement propre", () => {
    expect(src).not.toMatch(/transition|animate-|animation/);
  });

  it("lit la regle de nommage partagee et n en redefinit aucune", () => {
    // La regle vit dans @portfolio/shared-types : ce test empeche de la
    // redupliquer un jour.
    expect(src).toContain('from "@portfolio/shared-types"');
    expect(src).toContain("nomVariante");
    expect(src, "une regle de nommage locale a ete reintroduite")
      .not.toMatch(/lastIndexOf\("\."\)/);
  });

  it("n introduit ni tiret cadratin ni emoji", () => {
    expect(src).not.toContain("\u2014");
    expect([...src].some((c) => c.codePointAt(0)! >= 0x2500)).toBe(false);
  });
});

describe("section d ouverture : le portrait ne depend pas des presentations", () => {
  const rendreCartes = (presentations: unknown[]) =>
    renderToStaticMarkup(
      createElement(
        I18nProvider as ComponentType<{ defaultLocale: string }>,
        { defaultLocale: "fr" },
        createElement(PresentationSection, { presentations: presentations as never }),
      ),
    );

  it("les cartes sont seules : liste vide, rien n'est rendu", () => {
    expect(rendreCartes([])).toBe("");
  });

  it("les cartes ne rendent jamais le portrait", () => {
    const html = rendreCartes([{ id: "1", title: "Titre", subtitle: null, description: null }]);
    expect(html).toContain("Titre");
    expect(html).not.toContain("medaillon");
  });

  it("le portrait est rendu par l ouverture, hors de toute condition de reglage", () => {
    const ouverture = tableDesContenus().find((e) => e.id === "ouverture")!;
    const i = ouverture.texte.indexOf("<Medaillon");
    expect(i, "<Medaillon> absent de l'ouverture").toBeGreaterThan(-1);
    expect(ouverture.texte.slice(0, i)).not.toMatch(/show[A-Z]\w+/);
    // showPresentations ne conditionne que les cartes, qui viennent apres.
    const cartes = ouverture.texte.indexOf("<PresentationSection");
    expect(cartes).toBeGreaterThan(i);
    expect(ouverture.texte.slice(0, cartes)).toMatch(/showPresentations\s*&&/);
  });

  it("le medaillon rend la photo ou les initiales sans presentation", () => {
    expect(rendre({ avatarPath: "http://hote.test/uploads/personal/u.webp" }))
      .toMatch(/<img\s[^>]*class="medaillon"/);
    expect(rendre({})).toContain("medaillon-repli");
    expect(rendre({ name: "", surname: "" })).toBe("");
  });
});

describe("initiales (regle unique)", () => {
  it("ignore les blancs, les nuls et met en majuscules", () => {
    expect(initialesDe({ name: "bertrand", surname: "fanuel" })).toBe("BF");
    expect(initialesDe({ name: " ", surname: " " })).toBe("");
    expect(initialesDe({ name: null, surname: "Fanuel" } as never)).toBe("F");
  });

  it("est lue par la colonne et par le medaillon, sans copie locale", () => {
    for (const f of ["components/parcours/colonne-passage.tsx", "components/parcours/medaillon.tsx"]) {
      const t = lire(f);
      expect(t, f).toContain('from "@/lib/parcours/identite"');
      expect(t, f).not.toMatch(/name\?\.(trim\(\))?\[0\]/);
    }
  });

  it("le texte alternatif n affiche jamais null ni undefined", () => {
    const html = rendre({ avatarPath: "http://hote.test/u.webp", name: null as never });
    expect(html).toContain('alt="Portrait de Fanuel"');
  });
});
