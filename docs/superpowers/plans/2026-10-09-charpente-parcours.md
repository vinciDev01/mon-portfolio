# Charpente du parcours, plan d'implementation

> **Pour les executants agentiques :** SOUS-COMPETENCE REQUISE : utiliser
> superpowers:subagent-driven-development (recommande) ou
> superpowers:executing-plans pour implementer ce plan tache par tache. Les
> etapes utilisent la syntaxe a cases (`- [ ]`) pour le suivi.

**But :** remplacer l'en-tete collant par une colonne de passage a gauche,
borner la mise en page pour que rien ne passe plus derriere l'ampoule, refaire
les projets en une de presse, le panneau de disponibilite en drapeau au mat, et
poser un medaillon de photo avec son repli.

**Architecture :** une seule formule CSS, exprimee depuis le bord droit du
conteneur et non en `100vw`, borne a la fois la mesure du texte et le decalage du
zigzag en fonction de ce que l'objet ampoule laisse. La colonne de passage est un
`nav` fixe a quatre paliers de largeur, qui reutilise l'`IntersectionObserver`
deja present plutot que d'ajouter un ecouteur de defilement. Les trois pieces de
contenu, journal, drapeau et medaillon, sont des composants independants poses
dans cette charpente.

**Pile :** Next.js 16 en App Router, React 19, Tailwind 4, vitest. Les tests
lisent les fichiers source comme des chaines, selon le modele deja etabli par
`frontend/lib/design/ombres.test.ts` et
`frontend/lib/ampoule/boite-et-accessibilite.test.ts`, faute de navigateur
pilotable dans cet environnement.

**Spec :** `docs/superpowers/specs/2026-10-09-charpente-parcours-design.md`

## Contraintes globales

Valeurs copiees telles quelles depuis la spec. Elles lient toutes les taches.

- **Au plus deux mouvements sur tout le site** : l'entree d'un bloc et la bascule
  de l'ampoule. Aucune `transition` ni `animation` nouvelle dans les fichiers
  crees ou modifies par ce plan.
- **Jamais de degrade** pour simuler un volume.
- **Tout texte atteint 4,5:1 sur son fond, toute bordure signifiante 3:1**, dans
  les deux palettes, verifie par test.
- **Aucun tiret cadratin, aucun emoji** dans les fichiers crees ou modifies par
  ce plan. Le depot en contient ailleurs, par exemple dans un commentaire de
  `availability-badge.tsx` ; les nettoyer n'est pas l'objet de ce chantier.
- **Langue du depot : francais.** Commentaires et identifiants en francais ;
  messages de commit en francais **sans accents**.
- **Ne jamais commiter sur `main`.** La branche de travail est
  `charpente-parcours`.
- **Jamais de `prisma migrate reset`** : la base contient les donnees reelles du
  proprietaire.
- **La boite de tout SVG est declaree** : `width`, `height` et `overflow` ecrits
  et lus par un test.
- **La tache qui exige un effet autorise explicitement le fichier qui le porte.**
  Chaque bloc **Files** de ce plan est exhaustif.

### Cotes de reference

| Grandeur | Valeur |
|---|---|
| Largeur de l'objet ampoule | 172 px, mis a l'echelle par `--ampoule-echelle` |
| Garde entre contenu et ampoule | 16 px |
| Mesure pleine | 66 ch, soit 576 px a 17 px de corps |
| Plancher de mesure | 41 ch, soit 358 px |
| Seuil de mise en colonnes du journal | mesure >= 520 px |
| Paliers de la colonne | 240 px (>= 1200), 160 px (1024 a 1199), 72 px (600 a 1023), 40 px (< 600) |

## Review Focus

Cinq classes d'entrees que la spec implique sans qu'aucune tache ne les exerce
d'elle-meme, les plus susceptibles de gener une personne reelle, la plus probable
en premier. Chaque ligne recoit son test dans la tache qui porte le code.

1. **Toutes les sections desactivees au backoffice.** La colonne se rendrait avec
   zero entree. Attendu : la liste des sections disparait, l'identite, le drapeau
   et les commandes du pied restent, et la colonne ne laisse pas un vide inerte.
   Test en tache 2.
2. **Un libelle de disponibilite tres long**, saisi librement au backoffice.
   Attendu : le drapeau garde sa forme et sa queue d'aronde, le texte se replie
   sur deux lignes au plus, et au-dela il est tronque avec le libelle complet
   conserve comme nom accessible. Test en tache 4.
3. **Un nom et un prenom longs.** Attendu : l'identite en tete de mat se replie
   sans deborder la colonne de 240 px ni pousser le drapeau hors de vue. Test en
   tache 2.
4. **Un projet de tete sans `photo1Path`.** Attendu : le journal ne reserve
   aucune place vide, le titre monte a la place de l'image, et la hierarchie
   reste lisible. Test en tache 5.
5. **Un projet dont `startDate` est posterieur a `endDate`**, saisie incoherente
   que rien n'empeche aujourd'hui. Attendu : la ligne de date ne s'inverse pas,
   elle prend le plus petit et le plus grand des deux bornes toutes dates
   confondues. Test en tache 5.

---

## Structure des fichiers

**Crees**

| Fichier | Responsabilite |
|---|---|
| `frontend/components/parcours/colonne-passage.tsx` | la colonne : identite, entrees de sections, commandes du pied |
| `frontend/components/parcours/drapeau-disponibilite.tsx` | le drapeau au mat et son guidon de repli |
| `frontend/components/parcours/medaillon.tsx` | le medaillon de photo et son repli sur initiales |
| `frontend/components/parcours/journal-projets.tsx` | la une de presse des projets |
| `frontend/lib/parcours/entrees-sections.ts` | la liste des sections du parcours, filtrable par les reglages |
| `frontend/lib/parcours/ligne-date.ts` | derivation de la ligne de date du journal |
| `frontend/lib/parcours/degagement.test.ts` | la formule de degagement, lue dans la feuille |
| `frontend/lib/parcours/colonne.test.ts` | paliers, identite, entrees, reculs |
| `frontend/lib/parcours/suivi.test.ts` | la regle de depart entre sections visibles |
| `frontend/lib/parcours/drapeau.test.ts` | forme, boite, etats, contrastes, libelle long |
| `frontend/lib/parcours/journal.test.ts` | bandeau, ligne de date, degradation, colonnes |
| `frontend/lib/parcours/medaillon.test.ts` | boite, densites, repli |
| `backend/src/upload/variantes.ts` | les tailles a produire par categorie |
| `backend/src/upload/variantes.spec.ts` | ses cas de bord |

**Modifies**

| Fichier | Nature de la modification |
|---|---|
| `frontend/app/globals.css` | formule de degagement, paliers de la colonne, styles des quatre pieces |
| `frontend/app/page.tsx` | depose de `Header`, montage de `ColonnePassage` |
| `frontend/components/portfolio/section-shell.tsx` | la classe du bloc passe de `mesure zigzag` a `bloc-parcours` |
| `frontend/components/portfolio/presentation-section.tsx` | insertion du medaillon et de la ligne de disponibilite de repli |
| `frontend/components/portfolio/projects-section.tsx` | devient une coquille qui delegue au journal |
| `frontend/lib/i18n/i18n-context.tsx` | `t()` accepte des parametres de substitution |
| `frontend/lib/i18n/fr.json`, `en.json`, `de.json` | cles du journal, du medaillon et de la colonne |
| `backend/src/upload/upload.service.ts` | generation des variantes pour la categorie `personal` |

**Supprimes**

| Fichier | Motif |
|---|---|
| `frontend/components/portfolio/header.tsx` | l'en-tete collant disparait, son contenu passe dans la colonne |
| `frontend/components/portfolio/availability-badge.tsx` | remplace par le drapeau |

---

## Task 1 : La regle de degagement

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: `frontend/components/portfolio/section-shell.tsx`
- Test: `frontend/lib/parcours/degagement.test.ts`

**Interfaces:**
- Consomme : rien
- Produit : les proprietes personnalisees `--colonne`, `--contenu-gauche`,
  `--gouttiere`, `--ampoule-largeur`, `--degagement`, `--mesure-courante`, et la
  classe `.bloc-parcours`

Pourquoi cette tache vient en premier : elle corrige un defaut existant et elle
fixe la geometrie dont les six autres dependent. Elle ne demande aucun composant.

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/degagement.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const RACINE = path.resolve(import.meta.dirname, "../..");
const css = readFileSync(path.join(RACINE, "app/globals.css"), "utf8");

/** Corps a accolades equilibrees du premier bloc dont l'en-tete correspond. */
function bloc(entete: RegExp, source = css): string {
  const m = entete.exec(source);
  expect(m, `bloc ${entete} introuvable`).not.toBeNull();
  let profondeur = 0;
  for (let i = m!.index + m![0].length - 1; i < source.length; i++) {
    if (source[i] === "{") profondeur++;
    if (source[i] === "}" && --profondeur === 0) {
      return source.slice(m!.index + m![0].length, i);
    }
  }
  throw new Error(`bloc ${entete} non ferme`);
}

const CH = 8.73;
const OBJET = 172;
const GARDE = 16;
const PLEINE = 576;
const PLANCHER = 358;

/** Reproduit la formule de la spec, section 4.2. */
function geometrie(largeur: number) {
  const colonne = largeur >= 1200 ? 240 : largeur >= 1024 ? 160 : largeur >= 600 ? 72 : 40;
  const gouttiere = largeur >= 1024 ? 64 : 32;
  const x0 = colonne > 72 ? colonne + gouttiere : colonne + GARDE;
  const [droite, echelle] =
    largeur >= 1440 ? [48, 1.0]
    : largeur >= 1200 ? [40, 1.0]
    : largeur >= 900 ? [32, 0.82]
    : largeur >= 600 ? [24, 0.66]
    : largeur >= 360 ? [16, 0.5]
    : [12, 0.44];
  const C = largeur - x0 - gouttiere;
  const A = C + gouttiere - droite - OBJET * echelle - GARDE;
  const mesure = Math.min(C, Math.max(PLANCHER, Math.min(PLEINE, A)));
  const ampouleGauche = largeur - droite - OBJET * echelle;
  return { colonne, gouttiere, x0, C, A, mesure, ampouleGauche };
}

describe("regle de degagement (spec section 4.2)", () => {
  it("reproduit la table de la spec, section 4.3", () => {
    const attendu: Array<[number, number, number]> = [
      // largeur, mesure en px, garde en px
      [1440, 576, 340],
      [1200, 576, 108],
      [1024, 576, 51],
      [900, 576, 63],
      [700, 458, 16],
      [600, 358, 16],
      [599, 425, 16],
      [360, 272, -70],
    ];
    for (const [largeur, mesure, garde] of attendu) {
      const g = geometrie(largeur);
      expect(Math.round(g.mesure), `mesure a ${largeur}`).toBe(mesure);
      expect(Math.round(g.ampouleGauche - (g.x0 + g.mesure)), `garde a ${largeur}`).toBe(garde);
    }
  });

  it("corrige le defaut existant des 11 px au palier 900", () => {
    // Avant cette spec : bloc de rang pair 162 a 738, ampoule a partir de 727.
    const g = geometrie(900);
    expect(g.ampouleGauche - (g.x0 + g.mesure)).toBeGreaterThanOrEqual(GARDE);
  });

  it("ne descend jamais sous 31 caracteres, meme a 320 px", () => {
    for (const largeur of [320, 360, 420, 480, 540]) {
      expect(geometrie(largeur).mesure / CH).toBeGreaterThanOrEqual(31);
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
    expect(corps).toContain("41ch");
    expect(corps).toContain("66ch");
  });

  it("le decalage du zigzag est plafonne et reste pilote par le reglage", () => {
    const corps = bloc(/\.bloc-parcours\[data-cote="droite"\]\s*\{/);
    expect(corps).toContain("--portfolio-zigzag");
    expect(corps).toMatch(/margin-inline-start:\s*max\(\s*0px/);
    expect(corps).toContain("var(--degagement)");
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
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- degagement`
Attendu : ECHEC, « bloc /\.bloc-parcours\s*\{/ introuvable ».

- [ ] **Etape 3 : Poser les paliers de la colonne dans la feuille**

Dans `frontend/app/globals.css`, a la suite du bloc des paliers de l'ampoule,
ajouter :

```css
/* -----------------------------------------------------------
   Colonne de passage : quatre paliers, dictes par le calcul de
   la spec section 4.1 et non choisis. Au-dela de 72 px la colonne
   est une vraie colonne de mise en page et le contenu commence
   apres elle ; a 72 px et en dessous elle est une bande superposee,
   et la gouttiere gauche du contenu est portee a colonne + 16 px
   pour que le texte ne passe jamais dessous.
   ----------------------------------------------------------- */
:root {
  --colonne: 40px;
  --gouttiere: 32px;
  --contenu-gauche: calc(var(--colonne) + 16px);
}

@media (min-width: 600px) {
  :root {
    --colonne: 72px;
    --contenu-gauche: calc(var(--colonne) + 16px);
  }
}

@media (min-width: 1024px) {
  :root {
    --colonne: 160px;
    --gouttiere: 64px;
    --contenu-gauche: calc(var(--colonne) + var(--gouttiere));
  }
}

@media (min-width: 1200px) {
  :root {
    --colonne: 240px;
    --contenu-gauche: calc(var(--colonne) + var(--gouttiere));
  }
}
```

- [ ] **Etape 4 : Poser la formule de degagement**

Toujours dans `globals.css`, dans `@layer components`, remplacer les regles
`.zigzag` et `.zigzag[data-cote="droite"]` par :

```css
  /* -----------------------------------------------------------
     Le bloc d'une section du parcours.
     L'objet ampoule est en `position: fixed` et occupe en permanence
     la bande verticale 0 a 560 px : toutes les sections defilent
     derriere elle, il n'existe aucune hauteur a l'abri. La mesure du
     texte ET le decalage du zigzag sont donc bornes par ce qu'elle
     laisse.
     La formule part du bord DROIT du conteneur et non de `100vw` :
     `100vw` inclut la barre de defilement, alors que l'ampoule, etant
     fixe, est ancree sans elle. Mesure a l'appui dans la spec.
     ----------------------------------------------------------- */
  .bloc-parcours {
    --ampoule-largeur: calc(172px * var(--ampoule-echelle, 1));
    --degagement: calc(
      100% + var(--gouttiere) - var(--ampoule-droite, 48px)
      - var(--ampoule-largeur) - 16px
    );
    /* Le plancher de 41ch existe parce que sans lui la formule etrangle
       la mesure a 21 caracteres a 360 px. Sous environ 520 px le
       degagement ne peut plus etre tenu : le recouvrement est assume et
       borne a 70 px. */
    --mesure-courante: min(100%, max(41ch, min(66ch, var(--degagement))));
    max-width: var(--mesure-courante);
    margin-inline-start: 0;
  }

  @media (min-width: 900px) {
    .bloc-parcours[data-cote="droite"] {
      /* `--portfolio-zigzag` reste un reglage du backoffice : le decalage
         est plafonne, jamais remplace. */
      margin-inline-start: max(0px, min(
        calc(var(--portfolio-zigzag, 0.5) * (100% - var(--mesure-courante))),
        calc(var(--degagement) - var(--mesure-courante))
      ));
    }
  }
```

- [ ] **Etape 5 : Decaler le contenu derriere la colonne**

Dans `globals.css`, ajouter dans `@layer components` :

```css
  /* La gouttiere gauche du contenu reserve la colonne de passage. */
  .section-parcours {
    padding-inline-start: var(--contenu-gauche);
    padding-inline-end: var(--gouttiere);
  }
```

- [ ] **Etape 5 bis : Poser le garde-fou de mouvement reduit sur le defilement**

`scroll-behavior: smooth` est pose sur `html` a la ligne 287 **sans aucun
garde-fou** : c'est un manquement preexistant, et la spec section 5.3 l'exige.
Comme la colonne de passage fait du defilement souple sa mecanique principale,
le corriger ici n'est pas une digression.

Ajouter dans `globals.css`, hors de tout `@layer`, a la suite de la regle `html`
existante :

```css
/* La colonne de passage fait du defilement souple sa mecanique : il doit donc
   pouvoir etre coupe. `data-mouvement="force"` laisse au proprietaire la
   possibilite de passer outre la preference systeme depuis le backoffice, comme
   la feuille l'honore deja pour les entrees de bloc. */
@media (prefers-reduced-motion: reduce) {
  html:not([data-mouvement="force"]) {
    scroll-behavior: auto;
  }
}
```

- [ ] **Etape 6 : Brancher la coquille de section**

Dans `frontend/components/portfolio/section-shell.tsx`, remplacer la ligne de
classes de la `<section>` et celle du bloc :

```tsx
    <section
      id={id}
      data-rang={index}
      className="grid grid-cols-12 section-parcours"
```

```tsx
      <div
        ref={(el) => reveal(el)}
        className="col-span-12 bloc-parcours"
        data-cote={aGauche ? "gauche" : "droite"}
      >
```

Les anciennes classes `px-8 lg:px-16` et `mesure zigzag` disparaissent de cet
element. La classe `.mesure` reste definie dans la feuille et continue de servir
aux paragraphes imbriques : elle n'est pas supprimee.

- [ ] **Etape 7 : Lancer les tests et le typecheck**

Lancer : `npm run test -w frontend` puis `npm run typecheck -w frontend`
Attendu : tous les tests passent, aucune erreur de type.

- [ ] **Etape 8 : Commit**

```bash
git add frontend/app/globals.css frontend/components/portfolio/section-shell.tsx \
        frontend/lib/parcours/degagement.test.ts
git commit -m "feat(parcours): regle de degagement bornant mesure et zigzag"
```

---

## Task 2 : La colonne de passage, son identite, et la depose de l'en-tete

**Files:**
- Create: `frontend/components/parcours/colonne-passage.tsx`
- Create: `frontend/lib/parcours/entrees-sections.ts`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/lib/i18n/fr.json`, `en.json`, `de.json`
- Delete: `frontend/components/portfolio/header.tsx`
- Test: `frontend/lib/parcours/colonne.test.ts`

**Interfaces:**
- Consomme : `--colonne`, `--contenu-gauche` (tache 1)
- Produit :
  - `entreesSections(reglages: SiteSettingsDto): EntreeSection[]` avec
    `type EntreeSection = { ancre: string; cleTitre: string }`
  - `ColonnePassage` avec les props
    `{ reglages: SiteSettingsDto; infos: PersonalInfoDto }`

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/colonne.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { entreesSections } from "./entrees-sections";
import type { SiteSettingsDto } from "@portfolio/shared-types";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");

/** Reglages ou tout est actif, pour partir d'une base connue. */
function tousActifs(): SiteSettingsDto {
  return {
    showPresentations: true, showStats: true, showSkills: true,
    showExperiences: true, showProjects: true, showServices: true,
    showAbout: true, showTestimonials: true, showContact: true,
  } as unknown as SiteSettingsDto;
}

describe("entrees de la colonne", () => {
  it("rend une entree par section activee, dans l'ordre du parcours", () => {
    const e = entreesSections(tousActifs());
    expect(e.map((x) => x.ancre)).toEqual([
      "ouverture", "stats", "competences", "experience",
      "projets", "services", "a-propos", "temoignages", "contact",
    ]);
  });

  it("omet les sections desactivees", () => {
    const r = { ...tousActifs(), showStats: false, showServices: false };
    const ancres = entreesSections(r).map((x) => x.ancre);
    expect(ancres).not.toContain("stats");
    expect(ancres).not.toContain("services");
    expect(ancres).toContain("projets");
  });

  // Review Focus 1 : toutes les sections desactivees.
  it("rend une liste vide quand tout est desactive, sans jeter", () => {
    const aucune = Object.fromEntries(
      Object.keys(tousActifs()).map((k) => [k, false]),
    ) as unknown as SiteSettingsDto;
    expect(entreesSections(aucune)).toEqual([]);
  });

  it("ne reference que des cles de traduction qui existent", () => {
    const fr = JSON.parse(lire("lib/i18n/fr.json")) as Record<string, string>;
    for (const e of entreesSections(tousActifs())) {
      expect(fr[e.cleTitre], `cle manquante : ${e.cleTitre}`).toBeTypeOf("string");
    }
  });
});

describe("colonne de passage", () => {
  const src = lire("components/parcours/colonne-passage.tsx");

  it("est un nav au nom accessible explicite", () => {
    expect(src).toContain("<nav");
    expect(src).toMatch(/aria-label=\{t\("parcours\.colonne"\)\}/);
  });

  it("porte l identite, le drapeau, les sections puis les commandes", () => {
    const i = src.indexOf("identite-mat");
    const d = src.indexOf("DrapeauDisponibilite");
    const s = src.indexOf("entreesSections");
    const p = src.indexOf("pied-colonne");
    expect(i).toBeGreaterThan(-1);
    expect(d).toBeGreaterThan(i);
    expect(s).toBeGreaterThan(d);
    expect(p).toBeGreaterThan(s);
  });

  // Review Focus 3 : un nom et un prenom longs.
  it("replie l identite sans la laisser deborder", () => {
    const css = lire("app/globals.css");
    const m = /\.identite-mat\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .identite-mat introuvable").not.toBeNull();
    expect(m![1]).toMatch(/overflow-wrap:\s*anywhere/);
    expect(m![1]).toMatch(/max-width:\s*100%/);
  });

  it("rend l identite accessible meme quand le nom n est plus affiche", () => {
    // Sous 1024 px seul le logo subsiste : le nom reste le nom du lien.
    expect(src).toMatch(/aria-label=\{nomComplet\}/);
  });

  it("ne cree aucun mouvement", () => {
    expect(src).not.toMatch(/transition|animate-|animation/);
  });

  it("l en-tete collant a bien ete depose", () => {
    const page = lire("app/page.tsx");
    expect(page).not.toContain("Header");
    expect(page).toContain("ColonnePassage");
  });

  it("n introduit ni tiret cadratin ni emoji", () => {
    for (const f of ["components/parcours/colonne-passage.tsx",
                     "lib/parcours/entrees-sections.ts"]) {
      const t = lire(f);
      expect(t, f).not.toContain("\u2014");
      expect([...t].some((c) => c.codePointAt(0)! > 0x2500), f).toBe(false);
    }
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- colonne`
Attendu : ECHEC, module `./entrees-sections` introuvable.

- [ ] **Etape 3 : Ecrire la liste des entrees**

Creer `frontend/lib/parcours/entrees-sections.ts` :

```ts
import type { SiteSettingsDto } from "@portfolio/shared-types";

export type EntreeSection = { ancre: string; cleTitre: string };

/**
 * Les ancres suivent les identifiants francais rendus par SectionShell dans
 * app/page.tsx. « certifications » n'a pas d'entree propre : c'est un sous-bloc
 * de « experience », et une entree dediee ferait doublon.
 */
const TOUTES: Array<EntreeSection & { reglage: keyof SiteSettingsDto }> = [
  { ancre: "ouverture", cleTitre: "nav.presentation", reglage: "showPresentations" },
  { ancre: "stats", cleTitre: "section.stats", reglage: "showStats" },
  { ancre: "competences", cleTitre: "nav.skills", reglage: "showSkills" },
  { ancre: "experience", cleTitre: "nav.experience", reglage: "showExperiences" },
  { ancre: "projets", cleTitre: "nav.projects", reglage: "showProjects" },
  { ancre: "services", cleTitre: "nav.services", reglage: "showServices" },
  { ancre: "a-propos", cleTitre: "nav.about", reglage: "showAbout" },
  { ancre: "temoignages", cleTitre: "nav.testimonials", reglage: "showTestimonials" },
  { ancre: "contact", cleTitre: "nav.contact", reglage: "showContact" },
];

export function entreesSections(reglages: SiteSettingsDto): EntreeSection[] {
  return TOUTES.filter((e) => reglages[e.reglage]).map(
    ({ ancre, cleTitre }) => ({ ancre, cleTitre }),
  );
}
```

- [ ] **Etape 4 : Ajouter les cles de traduction**

Dans `frontend/lib/i18n/fr.json`, ajouter :

```json
  "parcours.colonne": "Parcours du site",
  "parcours.identite": "Retour a l'accueil"
```

Dans `en.json` :

```json
  "parcours.colonne": "Site navigation",
  "parcours.identite": "Back to home"
```

Dans `de.json` :

```json
  "parcours.colonne": "Seitennavigation",
  "parcours.identite": "Zurück zur Startseite"
```

- [ ] **Etape 5 : Ecrire la colonne**

Creer `frontend/components/parcours/colonne-passage.tsx` :

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import type { SiteSettingsDto, PersonalInfoDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { entreesSections } from "@/lib/parcours/entrees-sections";
import { LanguageSwitcher } from "@/components/portfolio/language-switcher";
import { Button } from "@/components/ui/button";
import { DrapeauDisponibilite } from "./drapeau-disponibilite";

/**
 * La colonne de passage : seul morceau de chrome du site depuis la depose de
 * l'en-tete collant. De haut en bas : l'identite au sommet du mat, le drapeau
 * de disponibilite, les sections du parcours, puis les commandes au pied.
 *
 * L'ampoule occupe le coin haut droit et l'horizon viendra en bas droite : la
 * gauche reste le seul endroit ou l'on agit.
 */
export function ColonnePassage({
  reglages,
  infos,
}: {
  reglages: SiteSettingsDto;
  infos: PersonalInfoDto;
}) {
  const { t } = useTranslation();
  const entrees = entreesSections(reglages);
  const logo = getFileUrl(reglages.logoPath);
  const nomComplet = `${infos.name} ${infos.surname}`.trim();
  const initiales = `${infos.name?.[0] ?? ""}${infos.surname?.[0] ?? ""}`.toUpperCase();

  return (
    <nav className="colonne-passage" aria-label={t("parcours.colonne")}>
      <Link href="/" className="identite-mat" aria-label={nomComplet}>
        {logo ? (
          <Image src={logo} alt="" width={36} height={36} className="identite-logo" />
        ) : (
          <span className="identite-initiales" aria-hidden="true">{initiales}</span>
        )}
        <span className="identite-nom">{nomComplet}</span>
      </Link>

      {reglages.availabilityStatus && (
        <DrapeauDisponibilite
          etat={reglages.availabilityStatus}
          libelle={reglages.availabilityLabel}
        />
      )}

      {entrees.length > 0 && (
        <ol className="entrees-parcours">
          {entrees.map((e) => (
            <li key={e.ancre}>
              <a href={`#${e.ancre}`} className="entree-parcours">
                <span className="entree-repere" aria-hidden="true" />
                <span className="entree-nom">{t(e.cleTitre)}</span>
              </a>
            </li>
          ))}
        </ol>
      )}

      <div className="pied-colonne">
        {reglages.showCvDownload && (
          <Button asChild size="sm">
            <a href="/api/download-cv-word" download>{t("nav.downloadCv")}</a>
          </Button>
        )}
        <LanguageSwitcher />
        <Link href="/blog" className="entree-parcours">{t("nav.blog")}</Link>
      </div>
    </nav>
  );
}
```

- [ ] **Etape 6 : Styler la colonne**

Dans `frontend/app/globals.css`, dans `@layer components` :

```css
  .colonne-passage {
    position: fixed;
    inset-block: 0;
    inset-inline-start: 0;
    width: var(--colonne);
    z-index: 55;
    display: flex;
    flex-direction: column;
    gap: var(--espace-3);
    padding: var(--espace-3) var(--espace-2);
    overflow-y: auto;
    background: var(--fond);
    border-inline-end: 1px solid var(--bordure);
  }

  /* Le nom doit se replier plutot que deborder : il vient du backoffice et
     rien n'en borne la longueur. */
  .identite-mat {
    display: flex;
    align-items: center;
    gap: var(--espace-1);
    max-width: 100%;
    overflow-wrap: anywhere;
    color: var(--texte);
  }

  .identite-initiales {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--bordure-signifiante);
    border-radius: 4px;
    background: var(--surface);
    color: var(--texte-secondaire);
    font-variation-settings: "opsz" 48;
  }

  .entrees-parcours {
    display: flex;
    flex-direction: column;
    gap: var(--espace-1);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .entree-parcours {
    display: flex;
    align-items: center;
    gap: var(--espace-1);
    color: var(--texte-secondaire);
  }

  .entree-parcours[aria-current="true"] {
    color: var(--texte);
  }

  .pied-colonne {
    margin-block-start: auto;
    display: flex;
    flex-direction: column;
    gap: var(--espace-1);
  }

  /* Sous 1024 px la colonne se reduit : le nom et les noms de sections n'ont
     plus la place d'etre lus, seuls les reperes subsistent. Le nom reste le
     nom accessible du lien d'identite. */
  @media (max-width: 1023px) {
    .identite-nom,
    .entree-nom {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  }
```

- [ ] **Etape 7 : Monter la colonne et deposer l'en-tete**

Dans `frontend/app/page.tsx`, retirer l'import et l'usage de `Header`, et
ajouter apres `<Ampoule />` :

```tsx
      <ColonnePassage reglages={s} infos={data.personalInfo} />
```

Puis supprimer le fichier :

```bash
git rm frontend/components/portfolio/header.tsx
```

- [ ] **Etape 8 : Lancer les tests et le typecheck**

Lancer : `npm run test -w frontend` puis `npm run typecheck -w frontend`
Attendu : tous les tests passent.

- [ ] **Etape 9 : Commit**

```bash
git add frontend/components/parcours frontend/lib/parcours frontend/app \
        frontend/lib/i18n
git commit -m "feat(parcours): colonne de passage, identite en tete de mat, depose de l en-tete"
```

---

## Task 3 : Le suivi de position

**Files:**
- Create: `frontend/lib/parcours/section-courante.ts`
- Modify: `frontend/components/parcours/colonne-passage.tsx`
- Test: `frontend/lib/parcours/suivi.test.ts`

**Interfaces:**
- Consomme : `EntreeSection` (tache 2)
- Produit :
  - `type Visible = { ancre: string; part: number; haut: number }`
  - `sectionCourante(visibles: Visible[]): string | null`
  - `useSectionCourante(ancres: string[]): string | null`

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/suivi.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { sectionCourante } from "./section-courante";

describe("regle de depart entre sections visibles (spec section 5.2)", () => {
  it("retient celle dont la part visible est la plus grande", () => {
    expect(sectionCourante([
      { ancre: "projets", part: 0.3, haut: 400 },
      { ancre: "services", part: 0.7, haut: 900 },
    ])).toBe("services");
  });

  it("a egalite, retient la plus haute dans le document", () => {
    // Le resultat doit etre deterministe, donc testable.
    expect(sectionCourante([
      { ancre: "services", part: 0.5, haut: 900 },
      { ancre: "projets", part: 0.5, haut: 400 },
    ])).toBe("projets");
  });

  it("rend null quand aucune section n est visible", () => {
    expect(sectionCourante([])).toBeNull();
  });

  it("ignore les sections de part nulle", () => {
    expect(sectionCourante([
      { ancre: "projets", part: 0, haut: 400 },
    ])).toBeNull();
  });

  it("est stable quel que soit l ordre d arrivee des entrees", () => {
    const a = [
      { ancre: "projets", part: 0.5, haut: 400 },
      { ancre: "services", part: 0.5, haut: 900 },
    ];
    expect(sectionCourante(a)).toBe(sectionCourante([...a].reverse()));
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- suivi`
Attendu : ECHEC, module `./section-courante` introuvable.

- [ ] **Etape 3 : Ecrire la regle et le hook**

Creer `frontend/lib/parcours/section-courante.ts` :

```ts
"use client";

import { useEffect, useState } from "react";

export type Visible = { ancre: string; part: number; haut: number };

/**
 * Quand deux sections sont visibles, celle dont la part visible est la plus
 * grande gagne. A egalite, la plus haute dans le document gagne : sans cette
 * seconde regle le resultat dependrait de l'ordre d'arrivee des entrees de
 * l'observateur, donc ne serait pas testable.
 */
export function sectionCourante(visibles: Visible[]): string | null {
  const retenues = visibles.filter((v) => v.part > 0);
  if (retenues.length === 0) return null;
  return retenues.reduce((a, b) => {
    if (b.part > a.part) return b;
    if (b.part < a.part) return a;
    return b.haut < a.haut ? b : a;
  }).ancre;
}

/**
 * Reutilise l'IntersectionObserver plutot qu'un ecouteur de defilement : le
 * site en a deja un dans section-toast-observer.tsx, et un ecouteur de
 * defilement se declencherait a chaque image.
 */
export function useSectionCourante(ancres: string[]): string | null {
  const [courante, setCourante] = useState<string | null>(null);

  useEffect(() => {
    if (ancres.length === 0) return;
    const parts = new Map<string, Visible>();

    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          const ancre = e.target.id;
          parts.set(ancre, {
            ancre,
            part: e.intersectionRatio,
            haut: (e.target as HTMLElement).offsetTop,
          });
        }
        setCourante(sectionCourante([...parts.values()]));
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );

    for (const ancre of ancres) {
      const el = document.getElementById(ancre);
      if (el) observateur.observe(el);
    }
    return () => observateur.disconnect();
  }, [ancres.join(",")]);

  return courante;
}
```

- [ ] **Etape 4 : Brancher le suivi dans la colonne**

Dans `frontend/components/parcours/colonne-passage.tsx`, importer le hook et
poser `aria-current` :

```tsx
import { useSectionCourante } from "@/lib/parcours/section-courante";
```

```tsx
  const courante = useSectionCourante(entrees.map((e) => e.ancre));
```

```tsx
              <a
                href={`#${e.ancre}`}
                className="entree-parcours"
                aria-current={courante === e.ancre ? "true" : undefined}
              >
```

- [ ] **Etape 5 : Lancer les tests et le typecheck**

Lancer : `npm run test -w frontend` puis `npm run typecheck -w frontend`
Attendu : tous les tests passent.

- [ ] **Etape 6 : Commit**

```bash
git add frontend/lib/parcours/section-courante.ts frontend/lib/parcours/suivi.test.ts \
        frontend/components/parcours/colonne-passage.tsx
git commit -m "feat(parcours): suivi de position de la colonne, regle de depart deterministe"
```

---

## Task 4 : Le drapeau au mat

**Files:**
- Create: `frontend/components/parcours/drapeau-disponibilite.tsx`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/components/portfolio/presentation-section.tsx`
- Modify: `frontend/lib/i18n/fr.json`, `en.json`, `de.json`
- Delete: `frontend/components/portfolio/availability-badge.tsx`
- Test: `frontend/lib/parcours/drapeau.test.ts`

**Interfaces:**
- Consomme : `--accent`, `--texte-secondaire`, `--fond`
- Produit : `DrapeauDisponibilite` avec les props
  `{ etat: string; libelle: string | null }`, et
  `LigneDisponibilite` avec les memes props

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/drapeau.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");
const src = lire("components/parcours/drapeau-disponibilite.tsx");
const css = lire("app/globals.css");

function lum(hex: string): number {
  const n = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)];
  const [h, l] = x > y ? [x, y] : [y, x];
  return (h + 0.05) / (l + 0.05);
}

describe("drapeau au mat (spec section 7)", () => {
  it("declare sa boite, width height et overflow", () => {
    const m = /\.drapeau-disponibilite\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .drapeau-disponibilite introuvable").not.toBeNull();
    expect(m![1]).toMatch(/width:/);
    expect(m![1]).toMatch(/height:/);
    expect(m![1]).toMatch(/overflow:\s*visible/);
  });

  it("porte une queue d aronde et un galbe, pas un rectangle", () => {
    // Deux pointes au bord libre, et des courbes sur les bords haut et bas.
    expect(src).toContain("CHEMIN_DRAPEAU");
    expect(src).toMatch(/[CQ]\s/);
  });

  it("ne porte aucune animation : le vent est dans le trace", () => {
    expect(src).not.toMatch(/transition|animate-|animation|@keyframes/);
  });

  it("tient 4,5:1 pour son texte dans les deux palettes", () => {
    expect(ratio(PALETTE_CLAIRE.accent, PALETTE_CLAIRE.fond)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(PALETTE_SOMBRE.accent, PALETTE_SOMBRE.fond)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(PALETTE_CLAIRE.texteSecondaire, PALETTE_CLAIRE.fond)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(PALETTE_SOMBRE.texteSecondaire, PALETTE_SOMBRE.fond)).toBeGreaterThanOrEqual(4.5);
  });

  it("n emploie aucune couleur d alerte", () => {
    expect(src).not.toMatch(/red|orange|#f0|#e4001|destructive/i);
  });

  // Review Focus 2 : un libelle de disponibilite tres long.
  it("borne le texte a deux lignes et garde le libelle complet accessible", () => {
    const m = /\.drapeau-texte\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .drapeau-texte introuvable").not.toBeNull();
    expect(m![1]).toMatch(/-webkit-line-clamp:\s*2/);
    expect(src).toMatch(/aria-label=\{libelleComplet\}/);
  });

  it("se replie en guidon sans texte sous 1024 px", () => {
    expect(src).toContain("guidon");
    const m = /@media \(max-width: 1023px\)/.exec(css);
    expect(m, "palier de repli du drapeau introuvable").not.toBeNull();
  });

  it("reporte le message dans l ouverture quand le drapeau n a plus de texte", () => {
    const ouverture = lire("components/portfolio/presentation-section.tsx");
    expect(ouverture).toContain("LigneDisponibilite");
  });

  it("l ancien badge a bien ete depose", () => {
    expect(() => lire("components/portfolio/availability-badge.tsx")).toThrow();
  });

  it("n introduit ni tiret cadratin ni emoji", () => {
    expect(src).not.toContain("\u2014");
    expect([...src].some((c) => c.codePointAt(0)! > 0x2500)).toBe(false);
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- drapeau`
Attendu : ECHEC, fichier `components/parcours/drapeau-disponibilite.tsx`
introuvable.

- [ ] **Etape 3 : Ajouter les cles de traduction**

Dans `fr.json` : `"parcours.disponibilite": "Disponibilite"`.
Dans `en.json` : `"parcours.disponibilite": "Availability"`.
Dans `de.json` : `"parcours.disponibilite": "Verfügbarkeit"`.

- [ ] **Etape 4 : Ecrire le drapeau**

Creer `frontend/components/parcours/drapeau-disponibilite.tsx` :

```tsx
"use client";

import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * Le drapeau de disponibilite, en tete de colonne, comme a un mat.
 *
 * Drapeau par la forme et non par l'embleme : hampe droite au mat, bord libre
 * en queue d'aronde, et un leger galbe sur les bords haut et bas qui suggere la
 * toile. Aucune animation : le vent est dans le trace, pas dans le mouvement,
 * donc le budget de deux mouvements du site reste intact.
 *
 * Seul l'etat disponible recoit la couleur d'accent. Les autres restent neutres,
 * et aucune couleur d'alerte n'entre dans la palette : c'est le texte qui
 * distingue les etats.
 */
const CLES_ETAT: Record<string, string> = {
  available: "availability.available",
  busy: "availability.busy",
  unavailable: "availability.unavailable",
};

/** Boite 200 x 56. Hampe a x = 0, queue d'aronde a x = 200, galbe en C. */
const CHEMIN_DRAPEAU =
  "M 0 2 C 54 10, 118 10, 172 4 " +
  "L 200 14 L 176 28 L 200 42 L 172 52 " +
  "C 118 46, 54 46, 0 54 Z";

/** Guidon triangulaire du repli, boite 40 x 56. */
const CHEMIN_GUIDON = "M 0 4 C 12 14, 26 22, 40 28 C 26 34, 12 42, 0 52 Z";

function couleurs(etat: string) {
  return etat === "available"
    ? { fond: "var(--accent)", texte: "var(--fond)" }
    : { fond: "var(--texte-secondaire)", texte: "var(--fond)" };
}

export function DrapeauDisponibilite({
  etat,
  libelle,
}: {
  etat: string;
  libelle: string | null;
}) {
  const { t } = useTranslation();
  const libelleComplet = libelle ?? t(CLES_ETAT[etat] ?? "availability.unavailable");
  const c = couleurs(etat);

  return (
    <div className="mat-disponibilite">
      <svg
        className="drapeau-disponibilite"
        viewBox="0 0 200 56"
        role="img"
        aria-label={libelleComplet}
        focusable="false"
      >
        <path d={CHEMIN_DRAPEAU} fill={c.fond} className="drapeau-toile" />
        <path d={CHEMIN_GUIDON} fill={c.fond} className="drapeau-guidon" />
      </svg>
      <span className="drapeau-texte" style={{ color: c.texte }} aria-hidden="true">
        {libelleComplet}
      </span>
    </div>
  );
}

/**
 * Sous 1024 px le drapeau devient un guidon sans texte : le message se reporte
 * ici, dans la section d'ouverture. L'information change de place, elle ne
 * disparait pas.
 */
export function LigneDisponibilite({
  etat,
  libelle,
}: {
  etat: string;
  libelle: string | null;
}) {
  const { t } = useTranslation();
  const libelleComplet = libelle ?? t(CLES_ETAT[etat] ?? "availability.unavailable");
  return (
    <p className="ligne-disponibilite">
      <span className="meta">{t("parcours.disponibilite")}</span> {libelleComplet}
    </p>
  );
}
```

- [ ] **Etape 5 : Styler le drapeau**

Dans `globals.css`, dans `@layer components` :

```css
  .mat-disponibilite {
    position: relative;
    display: block;
  }

  .drapeau-disponibilite {
    display: block;
    width: 200px;
    height: 56px;
    overflow: visible;
  }

  .drapeau-guidon { display: none; }

  /* Le libelle vient du backoffice et rien n'en borne la longueur : deux
     lignes au plus, puis troncature. Le libelle complet reste le nom
     accessible du drapeau. */
  .drapeau-texte {
    position: absolute;
    inset-block-start: 8px;
    inset-inline-start: 12px;
    width: 150px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    font-size: 0.8125rem;
    line-height: 1.2;
  }

  .ligne-disponibilite { margin-block-end: var(--espace-2); }

  @media (max-width: 1023px) {
    .drapeau-disponibilite { width: 40px; }
    .drapeau-toile { display: none; }
    .drapeau-guidon { display: inline; }
    .drapeau-texte { display: none; }
  }

  @media (min-width: 1024px) {
    .ligne-disponibilite { display: none; }
  }
```

- [ ] **Etape 6 : Reporter le message dans l'ouverture**

Dans `frontend/components/portfolio/presentation-section.tsx`, accepter les deux
nouvelles props et rendre la ligne avant les cartes :

```tsx
import { LigneDisponibilite } from "@/components/parcours/drapeau-disponibilite";
```

```tsx
export function PresentationSection({
  presentations,
  etatDisponibilite,
  libelleDisponibilite,
}: PresentationSectionProps) {
  if (!presentations.length) return null;

  return (
    <>
      {etatDisponibilite && (
        <LigneDisponibilite etat={etatDisponibilite} libelle={libelleDisponibilite} />
      )}
      {presentations.map((item, index) => (
        <PresentationCard key={item.id} item={item} index={index} />
      ))}
    </>
  );
}
```

Passer les deux valeurs depuis `app/page.tsx`, et supprimer l'ancien badge :

```bash
git rm frontend/components/portfolio/availability-badge.tsx
```

- [ ] **Etape 7 : Lancer les tests et le typecheck**

Lancer : `npm run test -w frontend` puis `npm run typecheck -w frontend`
Attendu : tous les tests passent.

- [ ] **Etape 8 : Commit**

```bash
git add frontend/components frontend/app frontend/lib
git commit -m "feat(parcours): drapeau de disponibilite au mat, guidon de repli"
```

---

## Task 5 : Le journal des projets

**Files:**
- Create: `frontend/components/parcours/journal-projets.tsx`
- Create: `frontend/lib/parcours/ligne-date.ts`
- Modify: `frontend/components/portfolio/projects-section.tsx`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/lib/i18n/i18n-context.tsx`
- Modify: `frontend/lib/i18n/fr.json`, `en.json`, `de.json`
- Test: `frontend/lib/parcours/journal.test.ts`

**Interfaces:**
- Consomme : `ProjectDto` depuis `@portfolio/shared-types`
- Produit :
  - `ligneDate(projets: ProjectDto[], locale: string): string | null`
  - `JournalProjets` avec la prop `{ projets: ProjectDto[] }`
  - `t(cle: string, params?: Record<string, string>)` etendu

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/journal.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { ligneDate } from "./ligne-date";
import type { ProjectDto } from "@portfolio/shared-types";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");

function projet(p: Partial<ProjectDto>): ProjectDto {
  return {
    id: p.id ?? "x", name: p.name ?? "Projet", description: null,
    photo1Path: null, photo2Path: null, demoUrl: null, targetAudience: null,
    startDate: null, endDate: null, technologies: [], collaborators: [],
    sortOrder: 0, ...p,
  } as ProjectDto;
}

describe("ligne de date du journal (spec section 6.2)", () => {
  it("prend le plus petit debut et le plus grand terme", () => {
    const l = ligneDate([
      projet({ startDate: "2024-03-01", endDate: "2024-09-01" }),
      projet({ startDate: "2025-01-01", endDate: "2026-01-01" }),
    ], "fr");
    expect(l).toContain("2024");
    expect(l).toContain("2026");
  });

  it("est omise quand aucun projet ne porte de date", () => {
    expect(ligneDate([projet({}), projet({})], "fr")).toBeNull();
  });

  it("ne se replie jamais sur la date du jour", () => {
    const anneeCourante = String(new Date().getFullYear());
    const l = ligneDate([projet({ startDate: "2020-01-01", endDate: "2020-06-01" })], "fr");
    expect(l).not.toContain(anneeCourante);
  });

  // Review Focus 5 : startDate posterieur a endDate.
  it("ne s inverse pas sur une saisie incoherente", () => {
    const l = ligneDate([projet({ startDate: "2026-01-01", endDate: "2024-03-01" })], "fr");
    // Le plus petit et le plus grand, toutes bornes confondues.
    const i2024 = l!.indexOf("2024");
    const i2026 = l!.indexOf("2026");
    expect(i2024).toBeGreaterThan(-1);
    expect(i2026).toBeGreaterThan(i2024);
  });

  it("tient avec une seule borne renseignee", () => {
    expect(ligneDate([projet({ startDate: "2024-03-01" })], "fr")).toContain("2024");
  });
});

describe("journal des projets (spec section 6)", () => {
  const src = lire("components/parcours/journal-projets.tsx");
  const css = lire("app/globals.css");

  it("rend un bandeau ferme par un filet signifiant", () => {
    const m = /\.journal-bandeau\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .journal-bandeau introuvable").not.toBeNull();
    expect(m![1]).toContain("var(--bordure-signifiante)");
  });

  it("separe les colonnes par un filet decoratif", () => {
    const m = /\.journal-colonnes\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .journal-colonnes introuvable").not.toBeNull();
    expect(m![1]).toContain("var(--bordure)");
  });

  it("met en colonnes selon la mesure et non la largeur de fenetre", () => {
    // A 700 px de fenetre la mesure vaut 458 px : deux colonnes y donneraient
    // 213 px, soit 24 caracteres, ou l'on ne lit plus.
    expect(css).toContain("--mesure-courante");
    expect(css).toMatch(/520px/);
  });

  it("couvre les quatre cas de degradation", () => {
    for (const marqueur of ["projets.length === 0", "projets.length === 1", "tete", "suite"]) {
      expect(src, marqueur).toContain(marqueur);
    }
  });

  // Review Focus 4 : projet de tete sans photo1Path.
  it("ne reserve aucune place vide quand le projet de tete n a pas d image", () => {
    expect(src).toMatch(/tete\.photo1Path\s*&&/);
  });

  it("ferme chaque article par la signature des technologies", () => {
    expect(src).toContain("journal-signature");
    expect(src).not.toMatch(/bg-(red|orange|yellow|green|blue)/);
  });

  it("ne cree aucun mouvement", () => {
    expect(src).not.toMatch(/transition|animate-|animation/);
  });

  it("n introduit ni tiret cadratin ni emoji", () => {
    for (const f of ["components/parcours/journal-projets.tsx", "lib/parcours/ligne-date.ts"]) {
      const t = lire(f);
      expect(t, f).not.toContain("\u2014");
      expect([...t].some((c) => c.codePointAt(0)! > 0x2500), f).toBe(false);
    }
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- journal`
Attendu : ECHEC, module `./ligne-date` introuvable.

- [ ] **Etape 3 : Etendre la fonction de traduction**

Dans `frontend/lib/i18n/i18n-context.tsx`, remplacer la fonction `t` :

```tsx
  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const brut = dictionaries[locale][key] ?? dictionaries.fr[key] ?? key;
      if (!params) return brut;
      return brut.replace(/\{(\w+)\}/g, (_, nom: string) => params[nom] ?? `{${nom}}`);
    },
    [locale],
  );
```

Le parametre est optionnel : tous les appels existants restent valides.

- [ ] **Etape 4 : Ecrire la ligne de date**

Creer `frontend/lib/parcours/ligne-date.ts` :

```ts
import type { ProjectDto } from "@portfolio/shared-types";

/**
 * La ligne de date du journal se calcule des donnees et jamais de l'horloge :
 * une une qui change chaque jour perdrait la coherence du cache de
 * revalidation, et n'apporterait rien.
 *
 * On prend le plus petit et le plus grand de TOUTES les bornes, debuts et
 * termes confondus, plutot que le plus petit debut et le plus grand terme.
 * Rien n'empeche aujourd'hui un `startDate` posterieur a son `endDate` : avec
 * la seconde methode la ligne s'inverserait.
 */
export function ligneDate(projets: ProjectDto[], locale: string): string | null {
  const bornes = projets
    .flatMap((p) => [p.startDate, p.endDate])
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (bornes.length === 0) return null;

  const format = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const debut = format.format(bornes[0]);
  const fin = format.format(bornes[bornes.length - 1]);
  return debut === fin ? debut : `${debut} / ${fin}`;
}
```

- [ ] **Etape 5 : Ecrire le journal**

Creer `frontend/components/parcours/journal-projets.tsx` :

```tsx
"use client";

import Image from "next/image";
import type { ProjectDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { ligneDate } from "@/lib/parcours/ligne-date";

/**
 * Les projets en une de presse : un bandeau date, un projet de tete avec son
 * image, puis les suivants en colonnes separees de filets fins.
 *
 * Le seuil de mise en colonnes porte sur la MESURE et non sur la largeur de
 * fenetre : la mesure varie dans un meme palier selon ce que l'ampoule laisse,
 * et un seuil en fenetre produirait des colonnes de 24 caracteres.
 */
function Article({ projet, tete }: { projet: ProjectDto; tete: boolean }) {
  const image = tete ? getFileUrl(projet.photo1Path) : null;
  return (
    <article className={tete ? "journal-tete" : "journal-article"}>
      {image && (
        <Image
          src={image}
          alt=""
          width={576}
          height={288}
          className="journal-image"
        />
      )}
      <h3 className="journal-titre">{projet.name}</h3>
      {projet.description && <p className="journal-corps">{projet.description}</p>}
      {projet.technologies.length > 0 && (
        <p className="journal-signature">
          {projet.technologies.map((x) => x.name).join(" . ")}
        </p>
      )}
    </article>
  );
}

export function JournalProjets({ projets }: { projets: ProjectDto[] }) {
  const { t, locale } = useTranslation();
  if (projets.length === 0) return null;

  const ordonnes = [...projets].sort((a, b) => a.sortOrder - b.sortOrder);
  const tete = ordonnes[0];
  const suite = ordonnes.slice(1);
  const date = ligneDate(ordonnes, locale);

  return (
    <div className="journal">
      <header className="journal-bandeau">
        {date && <p className="meta">{date}</p>}
      </header>

      <Article projet={tete} tete />

      {projets.length === 1 ? null : suite.length === 1 ? (
        <Article projet={suite[0]} tete={false} />
      ) : (
        <div className="journal-colonnes">
          {suite.map((p) => (
            <Article key={p.id} projet={p} tete={false} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Etape 6 : Styler le journal**

Dans `globals.css`, dans `@layer components` :

```css
  .journal-bandeau {
    border-block-end: 1px solid var(--bordure-signifiante);
    padding-block-end: var(--espace-1);
    margin-block-end: var(--espace-3);
  }

  .journal-image {
    width: 100%;
    height: auto;
    border: 1px solid var(--bordure);
  }

  .journal-signature {
    color: var(--texte-secondaire);
    font-variation-settings: "opsz" 12;
    font-size: 0.8125rem;
  }

  /* Deux colonnes seulement a partir de 520 px de mesure, ce qui garantit des
     colonnes d'au moins 244 px, soit 28 caracteres. */
  .journal-colonnes {
    display: grid;
    gap: var(--espace-3);
    border-block-start: 1px solid var(--bordure);
    padding-block-start: var(--espace-3);
    margin-block-start: var(--espace-3);
  }

  @container (min-width: 520px) {
    .journal-colonnes {
      grid-template-columns: 1fr 1px 1fr;
    }
    .journal-colonnes > :nth-child(1) { grid-column: 1; }
    .journal-colonnes > :nth-child(2) { grid-column: 3; }
  }

  .journal { container-type: inline-size; }
```

- [ ] **Etape 7 : Deleguer depuis la section existante**

Dans `frontend/components/portfolio/projects-section.tsx`, remplacer tout le
corps par une coquille qui delegue :

```tsx
"use client";

import type { ProjectDto } from "@portfolio/shared-types";
import { JournalProjets } from "@/components/parcours/journal-projets";

export function ProjectsSection({ projects }: { projects: ProjectDto[] }) {
  return <JournalProjets projets={projects} />;
}
```

- [ ] **Etape 8 : Lancer les tests et le typecheck**

Lancer : `npm run test -w frontend` puis `npm run typecheck -w frontend`
Attendu : tous les tests passent.

- [ ] **Etape 9 : Commit**

```bash
git add frontend/components frontend/lib frontend/app
git commit -m "feat(parcours): journal des projets en une de presse"
```

---

## Task 6 : Les variantes au televersement

**Files:**
- Create: `packages/shared-types/src/variantes.ts`
- Modify: `packages/shared-types/src/index.ts`
- Create: `backend/src/upload/variantes.spec.ts`
- Modify: `backend/src/upload/upload.service.ts`

**Interfaces:**
- Consomme : rien
- Produit, depuis `@portfolio/shared-types` : `TAILLES_MEDAILLON`,
  `taillesPour(categorie: string): number[]` et
  `nomVariante(base: string, taille: number): string`

Pourquoi le paquet partage et non le backend : le medaillon de la tache 7 doit
construire les memes noms de fichiers que ceux que le televersement ecrit. Le
paquet `@portfolio/shared-types` est consomme **sans etape de build** par les
deux workspaces, donc la regle vit a un seul endroit. La reduplication serait
l'erreur evidente ici, et elle deriverait au premier changement.

Pourquoi cette tache precede le medaillon : le medaillon declare trois
descripteurs de densite, et sans variantes il n'y aurait rien a declarer.

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `backend/src/upload/variantes.spec.ts` :

```ts
import { taillesPour, nomVariante, TAILLES_MEDAILLON } from "@portfolio/shared-types";

describe("variantes de televersement", () => {
  it("produit trois tailles pour la categorie personal", () => {
    expect(taillesPour("personal")).toEqual([88, 176, 264]);
  });

  it("ne produit aucune variante pour les autres categories", () => {
    for (const c of ["projects", "technologies", "certifications", "blog", "site"]) {
      expect(taillesPour(c)).toEqual([]);
    }
  });

  it("ne produit aucune variante pour une categorie inconnue", () => {
    expect(taillesPour("inconnue")).toEqual([]);
  });

  it("nomme la variante en suffixant la taille avant l extension", () => {
    expect(nomVariante("abc.webp", 176)).toBe("abc-176.webp");
  });

  it("laisse intact un nom sans extension", () => {
    expect(nomVariante("abc", 176)).toBe("abc-176");
  });

  it("preserve un chemin a dossiers", () => {
    expect(nomVariante("personal/abc.webp", 264)).toBe("personal/abc-264.webp");
  });

  it("expose les trois tailles du medaillon, que le frontend lira aussi", () => {
    expect(TAILLES_MEDAILLON).toEqual([88, 176, 264]);
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w backend -- variantes`
Attendu : ECHEC, `nomVariante` n'est pas exporte par `@portfolio/shared-types`.

- [ ] **Etape 3 : Ecrire les variantes dans le paquet partage**

Creer `packages/shared-types/src/variantes.ts` :

```ts
/**
 * La regle de nommage des variantes de densite, partagee par les deux
 * workspaces. Le televersement les ecrit, le medaillon les lit : si la regle
 * vivait des deux cotes, elle deriverait au premier changement.
 *
 * Seule la categorie `personal` recoit des variantes : c'est la seule image du
 * site affichee a une taille fixe connue. Les autres ne depassent pas 200 px a
 * la source et ne gagneraient rien a etre declinees.
 */
export const TAILLES_MEDAILLON = [88, 176, 264] as const;

const TAILLES: Record<string, readonly number[]> = {
  personal: TAILLES_MEDAILLON,
};

export function taillesPour(categorie: string): number[] {
  return [...(TAILLES[categorie] ?? [])];
}

/** Suffixe la taille avant l'extension : `a/b.webp` donne `a/b-176.webp`. */
export function nomVariante(base: string, taille: number): string {
  const barre = Math.max(base.lastIndexOf("/"), base.lastIndexOf("\\"));
  const point = base.lastIndexOf(".");
  if (point <= barre + 1) return `${base}-${taille}`;
  return `${base.slice(0, point)}-${taille}${base.slice(point)}`;
}
```

Le calcul de `barre` evite un piege : sans lui, un chemin comme
`dossier.v2/abc` prendrait le point du dossier pour celui d'une extension.

Puis exporter depuis `packages/shared-types/src/index.ts` :

```ts
export * from "./variantes";
```

- [ ] **Etape 4 : Generer les variantes au televersement**

Dans `backend/src/upload/upload.service.ts`, ajouter l'import :

```ts
import { taillesPour, nomVariante } from "@portfolio/shared-types";
```

puis, apres l'ecriture du fichier principal :

```ts
    // Les variantes de densite du medaillon. `withoutEnlargement` evite
    // d'agrandir une source trop petite : un agrandissement coute des octets
    // sans ajouter un seul detail.
    for (const taille of taillesPour(categorie)) {
      await sharp(file.buffer)
        .resize(taille, taille, { fit: "cover", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(dossier, nomVariante(nomFichier, taille)));
    }
```

- [ ] **Etape 5 : Lancer les tests et le typecheck**

Lancer : `npm run test -w backend` puis
`npx tsc --noEmit -p backend/tsconfig.json`
Attendu : tous les tests passent.

- [ ] **Etape 6 : Commit**

```bash
git add backend/src/upload
git commit -m "feat(upload): variantes de densite pour la categorie personal"
```

---

## Task 7 : Le medaillon

**Files:**
- Create: `frontend/components/parcours/medaillon.tsx`
- Modify: `frontend/components/portfolio/presentation-section.tsx`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/lib/i18n/fr.json`, `en.json`, `de.json`
- Test: `frontend/lib/parcours/medaillon.test.ts`

**Interfaces:**
- Consomme : `PersonalInfoDto`, et `nomVariante` depuis
  `@portfolio/shared-types` (tache 6). **Aucune duplication** : le paquet
  partage est consomme sans etape de build par les deux workspaces, donc la
  regle de nommage vit a un seul endroit et le frontend lit exactement celle que
  le backend applique.
- Produit : `Medaillon` avec la prop `{ infos: PersonalInfoDto }`

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/medaillon.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { nomVariante } from "@portfolio/shared-types";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");
const src = lire("components/parcours/medaillon.tsx");
const css = lire("app/globals.css");

describe("medaillon (spec section 8)", () => {
  it("declare sa boite : 88 px, bordure signifiante, rayon 4", () => {
    const m = /\.medaillon\s*\{([^}]*)\}/.exec(css);
    expect(m, "regle .medaillon introuvable").not.toBeNull();
    expect(m![1]).toMatch(/width:\s*88px/);
    expect(m![1]).toMatch(/height:\s*88px/);
    expect(m![1]).toContain("var(--bordure-signifiante)");
    expect(m![1]).toMatch(/border-radius:\s*4px/);
  });

  it("n a ni ombre, ni degrade, ni filtre", () => {
    const m = /\.medaillon\s*\{([^}]*)\}/.exec(css);
    expect(m![1]).not.toMatch(/box-shadow|gradient|filter/);
  });

  it("n est pas un cercle", () => {
    const m = /\.medaillon\s*\{([^}]*)\}/.exec(css);
    expect(m![1]).not.toMatch(/border-radius:\s*(50%|9999px)/);
  });

  it("declare les trois densites", () => {
    for (const taille of [88, 176, 264]) {
      expect(src, String(taille)).toContain(String(taille));
    }
    expect(src).toContain("srcSet");
  });

  it("se replie sur les initiales quand avatarPath est absent", () => {
    expect(src).toMatch(/infos\.avatarPath/);
    expect(src).toContain("initiales");
  });

  it("ne cree aucun mouvement propre", () => {
    expect(src).not.toMatch(/transition|animate-|animation/);
  });

  it("est monte dans la section d ouverture", () => {
    expect(lire("components/portfolio/presentation-section.tsx")).toContain("Medaillon");
  });

  it("lit la regle de nommage partagee et n en redefinit aucune", () => {
    // La regle vit dans @portfolio/shared-types, consomme sans etape de build
    // par les deux workspaces : le frontend lit exactement celle que le backend
    // applique. Ce test est ce qui empeche de la redupliquer un jour.
    expect(src).toContain('from "@portfolio/shared-types"');
    expect(src).toContain("nomVariante");
    expect(src, "une regle de nommage locale a ete reintroduite")
      .not.toMatch(/lastIndexOf\("\."\)/);
  });

  it("construit les trois sources par la regle partagee", () => {
    expect(nomVariante("a/b/c.webp", 88)).toBe("a/b/c-88.webp");
    expect(nomVariante("a/b/c.webp", 176)).toBe("a/b/c-176.webp");
    expect(nomVariante("a/b/c.webp", 264)).toBe("a/b/c-264.webp");
  });

  it("n introduit ni tiret cadratin ni emoji", () => {
    expect(src).not.toContain("\u2014");
    expect([...src].some((c) => c.codePointAt(0)! > 0x2500)).toBe(false);
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- medaillon`
Attendu : ECHEC, fichier `components/parcours/medaillon.tsx` introuvable.

- [ ] **Etape 3 : Ajouter la cle de traduction**

Dans `fr.json` : `"parcours.portrait": "Portrait de {nom}"`.
Dans `en.json` : `"parcours.portrait": "Portrait of {nom}"`.
Dans `de.json` : `"parcours.portrait": "Porträt von {nom}"`.

- [ ] **Etape 4 : Ecrire le medaillon**

Creer `frontend/components/parcours/medaillon.tsx` :

```tsx
"use client";

import type { PersonalInfoDto } from "@portfolio/shared-types";
import { TAILLES_MEDAILLON, nomVariante } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * Le medaillon d'ouverture, carre de 88 px, a gauche dans la colonne de texte.
 *
 * Carre a peine adouci et non cercle : un cercle rogne les epaules et renvoie
 * au registre de l'avatar de reseau social, la ou un carre renvoie a celui du
 * document.
 *
 * Il est a gauche, donc hors de l'ellipse du halo a tous les paliers, et les
 * couches de lumiere sont de toute facon en z-index -1, derriere le contenu :
 * aucune cohabitation avec la lumiere n'est a verifier.
 *
 * Aucun mouvement propre : il herite de l'entree de bloc, qui est l'un des deux
 * mouvements autorises.
 */
export function Medaillon({ infos }: { infos: PersonalInfoDto }) {
  const { t } = useTranslation();
  const initiales = `${infos.name?.[0] ?? ""}${infos.surname?.[0] ?? ""}`.toUpperCase();

  if (!infos.avatarPath) {
    return (
      <div className="medaillon medaillon-repli" aria-hidden="true">
        {initiales}
      </div>
    );
  }

  const base = getFileUrl(infos.avatarPath)!;
  const [un, deux, trois] = TAILLES_MEDAILLON;
  return (
    <img
      className="medaillon"
      src={nomVariante(base, un)}
      srcSet={`${nomVariante(base, deux)} 2x, ${nomVariante(base, trois)} 3x`}
      width={un}
      height={un}
      alt={t("parcours.portrait", { nom: `${infos.name} ${infos.surname}`.trim() })}
    />
  );
}
```

- [ ] **Etape 5 : Styler le medaillon**

Dans `globals.css`, dans `@layer components` :

```css
  .medaillon {
    width: 88px;
    height: 88px;
    border: 1px solid var(--bordure-signifiante);
    border-radius: 4px;
    background: var(--surface);
    object-fit: cover;
    margin-block-end: var(--espace-2);
  }

  .medaillon-repli {
    display: grid;
    place-items: center;
    color: var(--texte-secondaire);
    font-variation-settings: "opsz" 48;
    font-size: 1.75rem;
  }
```

- [ ] **Etape 6 : Monter le medaillon**

Dans `presentation-section.tsx`, accepter `infos` et rendre le medaillon avant
la ligne de disponibilite.

- [ ] **Etape 7 : Lancer les tests et le typecheck**

Lancer : `npm run test -w frontend` puis `npm run typecheck -w frontend`
Attendu : tous les tests passent.

- [ ] **Etape 8 : Commit**

```bash
git add frontend/components frontend/app frontend/lib
git commit -m "feat(parcours): medaillon d ouverture et repli sur initiales"
```

---

## Notes pour l'executant

**L'ordre compte.** La tache 1 fixe la geometrie dont les six autres dependent,
et elle corrige au passage un defaut existant de 11 px au palier 900. Les taches
2 et 3 se suivent : la colonne avant son suivi. La tache 6 precede la 7, parce
que le medaillon declare des variantes que seul le televersement produit.

**Ce que le plan ne peut pas garantir.** Cinq verifications reviennent au
proprietaire et aucune commande ne les remplace : la souplesse du defilement et
la justesse du suivi, la lecture du journal comme une une de presse, la lecture
du drapeau comme un drapeau, la nettete du medaillon une fois la photo fournie,
et le caractere acceptable du recouvrement assume sous 520 px.

**La valeur de 66ch est derivee, pas mesuree.** 576 px a 17 px de corps, soit
8,73 px par caractere. L'avance du glyphe zero de Literata sur le fichier
reellement servi doit etre mesuree a l'implementation, et la table de la tache 1
recalculee si elle s'en ecarte de plus de 2 %.

**Le cache de compilation de ce depot s'est fige six fois** sur la branche
precedente, et il a servi un melange d'etats. Ne jamais conclure a un defaut sur
la seule foi du CSS servi par le serveur de developpement : verifier la source,
et au besoin compiler la feuille directement depuis `frontend/` par un script en
ligne, faute de quoi Node resout les modules au mauvais endroit.

```bash
node --input-type=module -e "
import postcss from 'postcss';
import tw from '@tailwindcss/postcss';
import { readFileSync } from 'node:fs';
const r = await postcss([tw()]).process(readFileSync('app/globals.css','utf8'), { from: 'app/globals.css' });
process.stdout.write(r.css);
" > /tmp/compile.css
```

Le compilateur emet souvent une **paire de repli** : une valeur simple, puis la
vraie dans un `@supports (color: color-mix(...))`. Un grep qui ne regarde pas
dans le bloc conditionnel fait croire a tort qu'une valeur a ete figee.

**Ne jamais lancer `npm run build` a la racine** pendant qu'un serveur de
developpement tourne : le build racine declenche `nest build` alors que le watch
du backend est actif, et c'est l'incident qui a corrompu `dist/` dans ce projet.
