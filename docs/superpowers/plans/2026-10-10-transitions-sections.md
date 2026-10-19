# Les transitions entre sections : plan d'implementation

> **Pour les executants :** SOUS-COMPETENCE REQUISE : employer
> superpowers:subagent-driven-development (recommande) ou
> superpowers:executing-plans pour implementer ce plan tache par tache. Les
> etapes emploient des cases a cocher (`- [ ]`) pour le suivi.

**But :** remplacer le defilement de la page par une pagination section par
section, ou une section disparait par un fondu avant que la suivante paraisse.

**Architecture :** un composant client `ParcoursPagine` detient l'index de
section et traduit molette, tactile, clavier et clic en changements d'index. La
transition elle-meme est declarative : le composant pose `data-section-active`
sur la racine et la feuille fait le fondu. Toute regle de pagination est
imbriquee sous `data-pagination="active"`, que seul le JavaScript pose, donc
une panne de JavaScript laisse la page defiler comme aujourd'hui.

**Pile :** Next.js 16 (App Router, Turbopack), React 19, Tailwind 4, vitest en
environnement `node`, tests de rendu par `renderToStaticMarkup`.

**Spec :** `docs/superpowers/specs/2026-10-10-transitions-sections-design.md`

## Correction a la spec, trouvee en ecrivant ce plan

La section 2.2 de la spec dit que la liste des sections doit venir d'un seul
module, et parle de **deux** consommateurs. Il y en a **trois**, et ils
divergent deja :

1. `lib/parcours/entrees-sections.ts` : `ancre`, cle `nav.*`, et le reglage qui
   conditionne la section.
2. `app/page.tsx` : les `id` et les cles `section.*`, ecrits en ligne dans le
   JSX.
3. `components/portfolio/section-toast-observer.tsx` : deux tables, `sectionIcons`
   et `sectionTKeys`, indexees par les memes identifiants.

Et la divergence est visible a l'ecran, pas seulement dans le code :

| Section | Ce que la colonne affiche | Ce que le titre affiche |
|---|---|---|
| ouverture | `nav.presentation` = « Présentation. » | `section.ouverture` = « Ouverture » |
| competences | `nav.skills` = « Compétences. » | `section.skills` = « Compétences » |

Deux noms pour la meme chose, cote a cote a l'ecran, et les cles `nav.*`
portent un point final que les cles `section.*` n'ont pas. La tache 1 traite
les trois declarations et tranche le nom.

## Contraintes globales

- **Deux mouvements seulement sur tout le site :** l'incandescence de l'ampoule
  et la transition entre sections. Tout le reste parait par l'opacite seule.
- **Seule exception nommee :** la barre de progression du toast configurable
  (`toast-progress`) garde son `scaleX`, parce que sa longueur **est** son
  information.
- **Aucun degrade,** nulle part.
- **4,5:1 pour le texte et 3:1 pour les bordures signifiantes** dans les deux
  palettes.
- **Francais partout.** Aucun tiret cadratin, aucun emoji, dans aucun fichier
  touche. Messages de commit sans accents.
- **Les tests sont CATEGORIQUES et non orthographiques.** Un test qui interdit
  une ecriture ne protege pas contre une categorie de defaut. Le tableau de la
  section 7.1 de la spec donne la forme attendue de chaque garde-fou.
- **La base de donnees contient les donnees reelles du proprietaire.** Jamais
  `prisma migrate reset`, jamais `db push --force-reset`.
- **Ne jamais lancer `nest build`, `next build`, ni `npm run build` a la
  racine :** les serveurs de developpement tournent et un build concurrent
  corrompt `dist/` et `.next`. Employer `npm run typecheck -w frontend`.
- **Ne jamais arreter les serveurs de developpement, ne jamais `git stash`,
  ne jamais commiter sur `main`.** La branche est `charpente-parcours`.
- **Le cache de Turbopack s'est fige plusieurs fois** et a servi un melange
  d'etats. Ne jamais conclure a un defaut d'apres la feuille servie par le
  serveur : verifier la source sur le disque. Un `touch` ne declenche rien,
  seule une modification de contenu reelle provoque la recompilation.

## Points de vigilance

Cinq classes d'entree que la spec implique et qu'aucune tache ne testerait
spontanement. Chacune recoit son test dans la tache qui porte le code.

1. **Une seule section active dans le backoffice.** La pagination doit tenir
   avec une liste d'un element : aucun rebond, aucun saut, et la colonne
   n'affiche qu'une entree. Teste en tache 2.
2. **Aucune section active.** `ParcoursPagine` recoit une liste vide. Il doit
   rendre un document valide et ne pas lever. Teste en tache 4.
3. **Une section exactement de la hauteur de l'ecran.** `scrollHeight` vaut
   alors `clientHeight`, donc la section est en butee dans les deux directions
   des son arrivee et un cran de molette doit paginer immediatement, sans
   attendre un defilement interne impossible. Teste en tache 2.
4. **Un fragment d'adresse nommant une section eteinte.** `#temoignages` alors
   que `showTestimonials` est faux doit retomber sur la premiere section, sans
   index negatif ni page blanche. Teste en tache 4.
5. **Une rafale de molette.** Un geste continu de pavé tactile ne doit ni
   sauter de section, ni mettre en file neuf annonces de toast. Teste en
   tache 2 pour le verrou et en tache 6 pour le delai de stabilisation.

---

## Structure des fichiers

**A creer :**

- `frontend/lib/parcours/sections.ts` : la declaration unique de la liste des
  sections. Id, cle de titre, reglage conditionnant, et pictogramme de toast.
- `frontend/lib/parcours/pagination.ts` : la logique pure. `prochainIndex`,
  `estEnButee`, et l'accumulateur de molette.
- `frontend/components/parcours/parcours-pagine.tsx` : le conteneur client.
- `frontend/lib/parcours/sections.test.ts`
- `frontend/lib/parcours/pagination.test.ts`
- `frontend/lib/parcours/transition.test.ts`
- `frontend/lib/parcours/pagine.test.ts`

**A modifier :**

- `frontend/app/page.tsx` : rendre par le conteneur, ouverture inconditionnelle,
  pied dans la derniere section rendue.
- `frontend/components/portfolio/section-shell.tsx` : retrait de `useReveal`,
  ajout de `tabindex="-1"`.
- `frontend/components/parcours/colonne-passage.tsx` : consommer `sections.ts`,
  recevoir l'identifiant actif.
- `frontend/components/portfolio/section-toast-observer.tsx` : commande par
  l'index, delai de stabilisation.
- `frontend/components/portfolio/toast-notification.tsx` : opacite seule.
- `frontend/components/parcours/drapeau-disponibilite.tsx` : la ligne de
  disponibilite rejoint l'ouverture.
- `frontend/app/globals.css` : regles de pagination, transition, et les trois
  retraits.
- `frontend/lib/i18n/fr.json`, `en.json`, `de.json` : les cles unifiees.

**A supprimer :**

- `frontend/lib/use-reveal.ts`
- `frontend/lib/parcours/section-courante.ts`
- `frontend/lib/parcours/suivi.test.ts`
- `frontend/lib/parcours/entrees-sections.ts` (absorbe par `sections.ts`)

---

## Task 1 : La source unique des sections

**Files:**
- Create: `frontend/lib/parcours/sections.ts`
- Create: `frontend/lib/parcours/sections.test.ts`
- Modify: `frontend/components/parcours/colonne-passage.tsx`
- Modify: `frontend/components/portfolio/section-toast-observer.tsx`
- Modify: `frontend/lib/i18n/fr.json`, `en.json`, `de.json`
- Delete: `frontend/lib/parcours/entrees-sections.ts`

**Interfaces:**
- Consomme : `SiteSettingsDto` depuis `@portfolio/shared-types`
- Produit :
  - `type Section = { id: string; cleTitre: string; reglage: keyof SiteSettingsDto; picto: string }`
  - `SECTIONS: readonly Section[]` (les neuf, dans l'ordre du parcours)
  - `PICTOS: Record<string, string>` (deplace depuis le toast, non recopie)
  - `sectionsActives(reglages: SiteSettingsDto): Section[]`

**Decision de nom, a appliquer telle quelle.** Les cles `nav.*` gardent leur
libelle mais perdent leur point final, et les cles `section.*` sont abandonnees
pour les titres de section. Raison : la colonne et le titre doivent dire la
meme chose, et le libelle de la colonne est celui que le proprietaire lit dans
sa navigation. Le point final de « Présentation. » est un residu typographique,
pas une intention.

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/sections.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import type { SiteSettingsDto } from "@portfolio/shared-types";
import { SECTIONS, PICTOS, sectionsActives } from "./sections";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");

function reglages(actifs: string[]): SiteSettingsDto {
  const base: Record<string, unknown> = {};
  for (const s of SECTIONS) base[s.reglage] = actifs.includes(s.id);
  return base as SiteSettingsDto;
}

describe("la liste des sections (spec section 2.2)", () => {
  it("porte les neuf sections dans l ordre du parcours", () => {
    expect(SECTIONS.map((s) => s.id)).toEqual([
      "ouverture", "stats", "competences", "experience", "projets",
      "a-propos", "contact", "services", "temoignages",
    ]);
  });

  it("ne garde que les sections dont le reglage est vrai", () => {
    expect(sectionsActives(reglages(["projets", "contact"])).map((s) => s.id))
      .toEqual(["projets", "contact"]);
  });

  it("rend une liste vide quand tout est eteint", () => {
    expect(sectionsActives(reglages([]))).toEqual([]);
  });

  it("preserve l ordre quel que soit l ordre des reglages", () => {
    expect(sectionsActives(reglages(["contact", "projets"])).map((s) => s.id))
      .toEqual(["projets", "contact"]);
  });

  it("donne a chaque section une cle de titre et un pictogramme", () => {
    for (const s of SECTIONS) {
      expect(s.cleTitre, s.id).toMatch(/^nav\./);
      expect(PICTOS[s.id], s.id).toContain("<path");
    }
  });

  it("l ordre suit celui de page.tsx, qui fait autorite", () => {
    const page = lire("app/page.tsx");
    const rendus = [...page.matchAll(/id="([a-z-]+)"/g)].map((m) => m[1]);
    expect(rendus).toEqual(SECTIONS.map((s) => s.id));
  });
});

describe("source unique : aucune autre declaration (spec section 7.1)", () => {
  // Categorique et non orthographique : on n'interdit pas une ecriture, on
  // exige que tout consommateur PASSE par le module. Trois declarations
  // divergentes existaient avant cette tache.
  const CONSOMMATEURS = [
    "components/parcours/colonne-passage.tsx",
    "components/portfolio/section-toast-observer.tsx",
  ];

  it("chaque consommateur importe le module", () => {
    for (const f of CONSOMMATEURS) {
      expect(lire(f), f).toContain('from "@/lib/parcours/sections"');
    }
  });

  it("aucun consommateur ne nomme plus de deux identifiants de section", () => {
    // Un consommateur qui en nomme trois ou plus reconstruit la liste.
    for (const f of CONSOMMATEURS) {
      const src = lire(f);
      const cites = SECTIONS.map((s) => s.id).filter((id) =>
        new RegExp(`["'\`]${id}["'\`]`).test(src),
      );
      expect(cites, `${f} reconstruit la liste : ${cites.join(", ")}`)
        .toHaveLength(0);
    }
  });

  it("l ancien module est bien supprime", () => {
    expect(() => lire("lib/parcours/entrees-sections.ts")).toThrow();
  });

  it("plus rien n importe l ancien module", () => {
    for (const f of [...CONSOMMATEURS, "app/page.tsx"]) {
      expect(lire(f), f).not.toContain("entrees-sections");
    }
  });
});

describe("les cles de titre existent dans les trois langues", () => {
  for (const langue of ["fr", "en", "de"]) {
    it(`${langue}.json porte les neuf cles`, () => {
      const dict = JSON.parse(lire(`lib/i18n/${langue}.json`));
      for (const s of SECTIONS) expect(dict[s.cleTitre], s.cleTitre).toBeTruthy();
    });
  }

  it("aucun libelle de navigation ne finit par un point", () => {
    const dict = JSON.parse(lire("lib/i18n/fr.json"));
    for (const s of SECTIONS) {
      expect(dict[s.cleTitre], s.cleTitre).not.toMatch(/\.$/);
    }
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- sections`
Attendu : ECHEC, module `./sections` introuvable.

- [ ] **Etape 3 : Ecrire le module**

Creer `frontend/lib/parcours/sections.ts`. Reprendre les neuf pictogrammes
depuis `sectionIcons` de `section-toast-observer.tsx` **verbatim**, sans en
redessiner aucun.

```ts
import type { SiteSettingsDto } from "@portfolio/shared-types";

export type Section = {
  id: string;
  cleTitre: string;
  reglage: keyof SiteSettingsDto;
};

/**
 * Les pictogrammes, DEPLACES tels quels depuis `sectionIcons` de
 * `section-toast-observer.tsx`. Ne pas les redessiner ni les recopier a la
 * main : couper l'objet entier et le coller ici, ses cles etant deja les
 * identifiants de section.
 */
export const PICTOS: Record<string, string> = {
  /* contenu de sectionIcons, deplace sans modification */
};

/**
 * La declaration UNIQUE de la liste des sections. Avant cette tache elle
 * existait en trois exemplaires qui divergeaient : ce module, les `id` et cles
 * ecrits en ligne dans page.tsx, et les deux tables du toast de section. La
 * colonne annoncait « Présentation. » quand le titre de la meme section
 * annoncait « Ouverture ».
 *
 * L'ordre fait autorite et un test le compare au rendu de page.tsx.
 * « certifications » n'a pas d'entree propre : c'est un sous-bloc de
 * « experience ».
 */
export const SECTIONS: readonly Section[] = [
  { id: "ouverture", cleTitre: "nav.presentation", reglage: "showPresentations" },
  { id: "stats", cleTitre: "nav.stats", reglage: "showStats" },
  { id: "competences", cleTitre: "nav.skills", reglage: "showSkills" },
  { id: "experience", cleTitre: "nav.experience", reglage: "showExperiences" },
  { id: "projets", cleTitre: "nav.projects", reglage: "showProjects" },
  { id: "a-propos", cleTitre: "nav.about", reglage: "showAbout" },
  { id: "contact", cleTitre: "nav.contact", reglage: "showContact" },
  { id: "services", cleTitre: "nav.services", reglage: "showServices" },
  { id: "temoignages", cleTitre: "nav.testimonials", reglage: "showTestimonials" },
] as const;

export function sectionsActives(reglages: SiteSettingsDto): Section[] {
  return SECTIONS.filter((s) => reglages[s.reglage]);
}
```

Couper l'objet `sectionIcons` de `section-toast-observer.tsx` et le coller tel
quel comme corps de `PICTOS`. Ne rien retaper.
`nav.stats` n'existe pas encore : l'ajouter aux trois dictionnaires avec la
valeur actuelle de `section.stats`.

- [ ] **Etape 4 : Unifier les libelles dans les trois dictionnaires**

Dans `fr.json`, retirer le point final des neuf cles `nav.*` concernees
(« Présentation. » devient « Présentation », et ainsi de suite). Verifier
`en.json` et `de.json` de la meme facon. Ne pas supprimer les cles `section.*` :
elles peuvent rester, et la tache 5 cessera de les employer.

- [ ] **Etape 5 : Recabler les deux consommateurs**

Dans `colonne-passage.tsx`, remplacer l'import de `entreesSections` par
`sectionsActives`, et employer `s.id` la ou `e.ancre` etait employe.

Dans `section-toast-observer.tsx`, supprimer les tables `sectionIcons` et
`sectionTKeys` et lire `SECTIONS` a la place. La logique d'observation ne change
pas dans cette tache : la tache 6 s'en charge.

- [ ] **Etape 6 : Supprimer l'ancien module**

```bash
git rm frontend/lib/parcours/entrees-sections.ts
```

Si un test de la branche precedente importe `entreesSections`, le mettre a jour
vers `sectionsActives` plutot que de le supprimer. S'il doit disparaitre, le
dire explicitement dans le rapport.

- [ ] **Etape 7 : Lancer les tests et le typecheck**

Lancer : `npm run test -w frontend` puis `npm run typecheck -w frontend`
Attendu : tous les tests passent.

- [ ] **Etape 8 : Commit**

```bash
git add frontend/lib/parcours frontend/components frontend/lib/i18n
git commit -m "refactor(parcours): une seule declaration des sections, trois en divergeaient"
```

---

## Task 2 : Le reducteur de pagination

**Files:**
- Create: `frontend/lib/parcours/pagination.ts`
- Create: `frontend/lib/parcours/pagination.test.ts`

**Interfaces:**
- Consomme : rien
- Produit :
  - `type Direction = 1 | -1`
  - `prochainIndex(index: number, nombre: number, direction: Direction, enButee: boolean): number`
  - `estEnButee(el: { scrollTop: number; scrollHeight: number; clientHeight: number }, direction: Direction): boolean`
  - `creerAccumulateur(maintenant: () => number): { pousser(delta: number): Direction | null; reinitialiser(): void }`
  - `indexDepuisFragment(fragment: string, ids: string[]): number`

**Pourquoi ces trois pieces sont pures.** La spec impose des tests
categoriques, et la logique de pagination est la partie ou un defaut ne se
verrait pas a la lecture. Separee du composant, elle se teste sans navigateur,
horloge injectee comprise.

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/pagination.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import {
  prochainIndex, estEnButee, creerAccumulateur, indexDepuisFragment,
  SEUIL_MOLETTE, FENETRE_MOLETTE,
} from "./pagination";

describe("prochainIndex (spec section 2.3)", () => {
  it("ne bouge pas tant que la section n est pas en butee", () => {
    expect(prochainIndex(2, 9, 1, false)).toBe(2);
    expect(prochainIndex(2, 9, -1, false)).toBe(2);
  });

  it("avance d un cran en butee", () => {
    expect(prochainIndex(2, 9, 1, true)).toBe(3);
  });

  it("recule d un cran en butee", () => {
    expect(prochainIndex(2, 9, -1, true)).toBe(1);
  });

  it("ne depasse pas la derniere section et ne rebondit pas", () => {
    expect(prochainIndex(8, 9, 1, true)).toBe(8);
  });

  it("ne depasse pas la premiere section et ne rebondit pas", () => {
    expect(prochainIndex(0, 9, -1, true)).toBe(0);
  });

  // Point de vigilance 1 : une seule section active.
  it("tient avec une seule section, dans les deux directions", () => {
    expect(prochainIndex(0, 1, 1, true)).toBe(0);
    expect(prochainIndex(0, 1, -1, true)).toBe(0);
  });
});

describe("estEnButee (spec section 2.3)", () => {
  it("vers le bas : vrai au bas du defilement", () => {
    expect(estEnButee({ scrollTop: 400, scrollHeight: 1000, clientHeight: 600 }, 1)).toBe(true);
  });

  it("vers le bas : faux au milieu", () => {
    expect(estEnButee({ scrollTop: 200, scrollHeight: 1000, clientHeight: 600 }, 1)).toBe(false);
  });

  it("vers le haut : vrai en haut", () => {
    expect(estEnButee({ scrollTop: 0, scrollHeight: 1000, clientHeight: 600 }, -1)).toBe(true);
  });

  it("tolere un pixel, pour les rapports de pixels fractionnaires", () => {
    expect(estEnButee({ scrollTop: 399.4, scrollHeight: 1000, clientHeight: 600 }, 1)).toBe(true);
    expect(estEnButee({ scrollTop: 0.8, scrollHeight: 1000, clientHeight: 600 }, -1)).toBe(true);
  });

  // Point de vigilance 3 : une section exactement de la hauteur de l ecran.
  it("une section qui ne defile pas est en butee dans les deux sens", () => {
    const fixe = { scrollTop: 0, scrollHeight: 600, clientHeight: 600 };
    expect(estEnButee(fixe, 1)).toBe(true);
    expect(estEnButee(fixe, -1)).toBe(true);
  });
});

describe("indexDepuisFragment (point de vigilance 4)", () => {
  const ids = ["ouverture", "projets", "contact"];

  it("trouve la section nommee", () => {
    expect(indexDepuisFragment("#projets", ids)).toBe(1);
  });

  it("tolere l absence du diese", () => {
    expect(indexDepuisFragment("projets", ids)).toBe(1);
  });

  it("retombe sur la premiere section si le fragment est vide", () => {
    expect(indexDepuisFragment("", ids)).toBe(0);
    expect(indexDepuisFragment("#", ids)).toBe(0);
  });

  it("retombe sur la premiere section si le fragment est inconnu", () => {
    expect(indexDepuisFragment("#inexistant", ids)).toBe(0);
  });

  // Le coeur du point de vigilance : la section existe dans la spec mais son
  // reglage est eteint, donc elle n'est pas dans `ids`.
  it("retombe sur la premiere section si la section est eteinte", () => {
    expect(indexDepuisFragment("#temoignages", ids)).toBe(0);
  });

  it("rend zero sur une liste vide, sans index negatif", () => {
    expect(indexDepuisFragment("#projets", [])).toBe(0);
  });
});

describe("accumulateur de molette (spec section 2.4)", () => {
  function horloge() {
    let t = 0;
    return { avancer: (ms: number) => (t += ms), lire: () => t };
  }

  it("ne pagine pas sous le seuil", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    expect(a.pousser(SEUIL_MOLETTE - 1)).toBeNull();
  });

  it("pagine vers le bas quand le cumul atteint le seuil", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    a.pousser(SEUIL_MOLETTE / 2);
    expect(a.pousser(SEUIL_MOLETTE / 2)).toBe(1);
  });

  it("pagine vers le haut sur un cumul negatif", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    expect(a.pousser(-SEUIL_MOLETTE)).toBe(-1);
  });

  it("oublie le cumul apres la fenetre de temps", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    a.pousser(SEUIL_MOLETTE - 1);
    h.avancer(FENETRE_MOLETTE + 1);
    expect(a.pousser(1)).toBeNull();
  });

  it("repart de zero apres avoir pagine", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    expect(a.pousser(SEUIL_MOLETTE)).toBe(1);
    expect(a.pousser(SEUIL_MOLETTE - 1)).toBeNull();
  });

  it("change de direction remet le cumul a zero", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    a.pousser(SEUIL_MOLETTE - 1);
    expect(a.pousser(-1)).toBeNull();
  });

  // Point de vigilance 5 : une rafale de molette.
  it("une rafale de petits crans ne pagine qu une fois par seuil", () => {
    const h = horloge();
    const a = creerAccumulateur(h.lire);
    let pages = 0;
    for (let i = 0; i < 30; i++) {
      h.avancer(8);
      if (a.pousser(10) !== null) pages++;
    }
    // 30 crans de 10 px, seuil de 60 : cinq paginations, pas trente.
    expect(pages).toBe(5);
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- pagination`
Attendu : ECHEC, module `./pagination` introuvable.

- [ ] **Etape 3 : Ecrire le module**

Creer `frontend/lib/parcours/pagination.ts` :

```ts
export type Direction = 1 | -1;

/** Cumul de `deltaY` requis pour paginer (spec section 2.4). */
export const SEUIL_MOLETTE = 60;
/** Au-dela de ce silence, le cumul est oublie (spec section 2.4). */
export const FENETRE_MOLETTE = 300;
/** Tolerance de butee, pour les rapports de pixels fractionnaires. */
const TOLERANCE = 1;

/**
 * La regle de pagination, sans effet de bord. Hors butee la section defile a
 * l'interieur et l'index ne change pas. En butee l'index bouge d'un cran, et
 * aux deux extremites il ne bouge pas : rien ne rebondit.
 */
export function prochainIndex(
  index: number,
  nombre: number,
  direction: Direction,
  enButee: boolean,
): number {
  if (!enButee) return index;
  const vise = index + direction;
  if (vise < 0 || vise >= nombre) return index;
  return vise;
}

/**
 * La tolerance d'un pixel absorbe les rapports de pixels fractionnaires, ou
 * `scrollTop` n'atteint jamais exactement sa borne. Une section qui ne defile
 * pas du tout est en butee dans les deux sens, ce qui fait paginer des le
 * premier cran au lieu d'attendre un defilement impossible.
 */
export function estEnButee(
  el: { scrollTop: number; scrollHeight: number; clientHeight: number },
  direction: Direction,
): boolean {
  if (direction === -1) return el.scrollTop <= TOLERANCE;
  return el.scrollHeight - el.clientHeight - el.scrollTop <= TOLERANCE;
}

/**
 * Un fragment inconnu, vide, ou nommant une section que le backoffice a
 * eteinte retombe sur la premiere section. Jamais d'index negatif, qui
 * donnerait une page blanche.
 */
export function indexDepuisFragment(fragment: string, ids: string[]): number {
  const id = fragment.replace(/^#/, "");
  if (!id) return 0;
  const i = ids.indexOf(id);
  return i === -1 ? 0 : i;
}

/**
 * Le pavé tactile emet beaucoup de petits evenements, un cran de souris en
 * emet un gros. On cumule donc, et on ne pagine qu'au seuil. Un changement de
 * direction ou un silence plus long que la fenetre remet le cumul a zero.
 */
export function creerAccumulateur(maintenant: () => number) {
  let cumul = 0;
  let dernier = -Infinity;

  return {
    pousser(delta: number): Direction | null {
      const t = maintenant();
      if (t - dernier > FENETRE_MOLETTE) cumul = 0;
      if (cumul !== 0 && Math.sign(delta) !== Math.sign(cumul)) cumul = 0;
      dernier = t;
      cumul += delta;
      if (Math.abs(cumul) < SEUIL_MOLETTE) return null;
      const direction: Direction = cumul > 0 ? 1 : -1;
      cumul = 0;
      return direction;
    },
    reinitialiser() {
      cumul = 0;
      dernier = -Infinity;
    },
  };
}
```

- [ ] **Etape 4 : Lancer les tests et le typecheck**

Lancer : `npm run test -w frontend -- pagination` puis
`npm run typecheck -w frontend`
Attendu : tous les tests passent.

- [ ] **Etape 5 : Commit**

```bash
git add frontend/lib/parcours/pagination.ts frontend/lib/parcours/pagination.test.ts
git commit -m "feat(parcours): la regle de pagination en fonctions pures, horloge injectee"
```

---

## Task 3 : La transition declarative

**Files:**
- Modify: `frontend/app/globals.css`
- Create: `frontend/lib/parcours/transition.test.ts`

**Interfaces:**
- Consomme : les jetons `--duree` et `--courbe` existants
- Produit : les attributs `data-pagination="active"` et `data-section-active`,
  que la tache 4 posera

**Pourquoi le CSS avant le composant.** La transition est declarative, donc
elle se verifie en lisant la feuille, sans navigateur. La construire d'abord
permet aux garde-fous categoriques d'exister avant le code qui les sollicite.

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/transition.test.ts`. Reutiliser les auxiliaires
de `lib/parcours/feuille-test.ts`, qui lisent la feuille et evaluent les `calc`.

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { css } from "./feuille-test";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");

/** Corps de chaque bloc dont l'en-tete correspond. */
function blocs(entete: RegExp, source: string): string[] {
  const re = new RegExp(entete.source, "g");
  const trouves: string[] = [];
  for (let m = re.exec(source); m; m = re.exec(source)) {
    let profondeur = 0;
    for (let i = m.index + m[0].length - 1; i < source.length; i++) {
      if (source[i] === "{") profondeur++;
      if (source[i] === "}" && --profondeur === 0) {
        trouves.push(source.slice(m.index + m[0].length, i));
        break;
      }
    }
  }
  return trouves;
}

describe("repli sans JavaScript (spec section 6)", () => {
  it("la feuille ne tue jamais le defilement sans condition", () => {
    // Categorique : on cherche TOUTE regle visant html ou body qui porte
    // overflow: hidden, ou qu'elle soit, puis on exige qu'elle soit sous
    // l'attribut. Une regle ajoutee ailleurs fait echouer ce test.
    const regles = [...css.matchAll(/([^{}]*\b(?:html|body)\b[^{}]*)\{([^}]*)\}/g)];
    for (const [, selecteur, corps] of regles) {
      if (!/overflow(-y)?:\s*hidden/.test(corps)) continue;
      expect(selecteur, `regle non conditionnee : ${selecteur.trim()}`)
        .toMatch(/\[data-pagination="active"\]/);
    }
  });

  it("toute regle de pagination est sous data-pagination active", () => {
    // Categorique : chaque regle qui nomme une classe de pagination doit vivre
    // dans un bloc conditionne, ou porter l'attribut dans son selecteur.
    const CLASSES = [".section-paginee", ".parcours-pagine"];
    for (const classe of CLASSES) {
      const re = new RegExp(`([^{}]*\\${classe}[^{}]*)\\{`, "g");
      for (const m of css.matchAll(re)) {
        expect(m[1], `${classe} hors condition : ${m[1].trim()}`)
          .toMatch(/\[data-pagination="active"\]/);
      }
    }
  });
});

describe("la transition (spec section 2.5)", () => {
  it("ne fait varier que l opacite, jamais une position", () => {
    const regles = blocs(/\.section-paginee[^{]*\{/, css);
    expect(regles.length, "aucune regle .section-paginee").toBeGreaterThan(0);
    for (const r of regles) {
      expect(r).not.toMatch(/transform|translate|scale\(/);
    }
  });

  it("partage une seule duree entre la sortie et l entree", () => {
    expect(css).toMatch(/calc\(var\(--duree\)\s*\*\s*0?\.45\)/);
    expect(css).toMatch(/calc\(var\(--duree\)\s*\*\s*0?\.55\)/);
  });

  it("emploie la courbe du site et non une courbe propre", () => {
    const regles = blocs(/\.section-paginee[^{]*\{/, css);
    const avecTransition = regles.filter((r) => /transition:/.test(r));
    expect(avecTransition.length).toBeGreaterThan(0);
    for (const r of avecTransition) expect(r).toContain("var(--courbe)");
  });

  it("la section inactive quitte l arbre d accessibilite", () => {
    const regles = blocs(/\.section-paginee[^{]*\{/, css).join("\n");
    expect(regles).toMatch(/display:\s*none/);
  });
});

describe("mouvement reduit (spec section 2.5)", () => {
  it("les durees tombent a zero, avec l echappement du site", () => {
    const corps = blocs(/@media \(prefers-reduced-motion: reduce\)\s*\{/, css)
      .find((b) => b.includes("section-paginee"));
    expect(corps, "aucun bloc de mouvement reduit ne traite la pagination")
      .toBeDefined();
    expect(corps!).toMatch(/\[data-mouvement="force"\]/);
    expect(corps!).toMatch(/transition-duration:\s*0s/);
  });
});

describe("budget de mouvement (spec section 4)", () => {
  it("les deux toasts ne glissent plus, ils paraissent", () => {
    for (const nom of ["toast-enter", "toast-exit"]) {
      const corps = blocs(new RegExp(`@keyframes ${nom}\\s*\\{`), css);
      for (const c of corps) {
        expect(c, nom).not.toMatch(/translate|scale\(/);
      }
    }
  });

  it("la barre de progression garde son scaleX, seule exception nommee", () => {
    const corps = blocs(/@keyframes toast-progress\s*\{/, css);
    expect(corps.length, "toast-progress a disparu").toBe(1);
    expect(corps[0]).toMatch(/scaleX/);
  });

  it("le composant du toast configurable ne glisse plus", () => {
    const src = lire("components/portfolio/toast-notification.tsx");
    expect(src).not.toMatch(/slide-in|translate-/);
  });
});

describe("les retraits (spec section 3.1)", () => {
  it("l apparition des blocs a disparu de la feuille", () => {
    expect(css).not.toMatch(/\.reveal-visible|\.reveal\s*\{/);
  });

  it("content-visibility ne survit pas a display none", () => {
    expect(css).not.toMatch(/content-visibility:\s*auto/);
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- transition`
Attendu : ECHEC sur la plupart des assertions, aucune regle de pagination
n'existant encore.

- [ ] **Etape 3 : Ecrire les regles dans `@layer components`**

Le layer ouvre vers la ligne 721. Ajouter :

```css
  /* La pagination n'existe que si le JavaScript l'a activee. Sans lui, la page
     defile comme avant et les entrees de la colonne restent des ancres. Toute
     regle ajoutee ici DOIT rester sous cet attribut. */
  [data-pagination="active"] html,
  [data-pagination="active"] body {
    overflow: hidden;
  }

  [data-pagination="active"] .section-paginee {
    height: 100vh;
    overflow-y: auto;
    opacity: 0;
    display: none;
    transition: opacity calc(var(--duree) * 0.45) var(--courbe);
  }

  /* La section active parait. Sortie et entree se partagent une seule
     `--duree` : on pagine jusqu'a huit fois de suite, et deux fondus pleins
     donneraient 800 ms par changement, ce qui devient poussif. */
  [data-pagination="active"] .section-paginee[data-active="true"] {
    display: block;
    opacity: 1;
    transition: opacity calc(var(--duree) * 0.55) var(--courbe);
  }
```

Retirer ensuite les regles `.reveal` et `.reveal-visible`, ainsi que la regle
`content-visibility: auto` des sections de rang 4 a 6.

Dans les images-cles `toast-enter` et `toast-exit`, retirer tout `translate` et
tout `scale`, en ne gardant que l'opacite. Ne pas toucher a `toast-progress`.

- [ ] **Etape 4 : Ajouter le bloc de mouvement reduit**

A cote des blocs `prefers-reduced-motion` existants, en suivant leur motif
d'echappement :

```css
@media (prefers-reduced-motion: reduce) {
  :root:not([data-mouvement="force"]) .section-paginee {
    transition-duration: 0s;
  }
}
```

- [ ] **Etape 5 : Retirer le glissement du toast configurable**

Dans `toast-notification.tsx`, retirer `slide-in-from-top-4` et tout
`translate-`, en gardant `fade-in`.

- [ ] **Etape 6 : Lancer les tests et verifier que la feuille compile**

Lancer : `npm run test -w frontend` puis, depuis `frontend/`, compiler la
feuille par un script en ligne, faute de quoi Node resout les modules au
mauvais endroit :

```bash
node --input-type=module -e "
import postcss from 'postcss';
import tw from '@tailwindcss/postcss';
import { readFileSync } from 'node:fs';
const r = await postcss([tw()]).process(readFileSync('app/globals.css','utf8'), { from: 'app/globals.css' });
console.log('compile, ' + r.css.length + ' octets');
"
```

Attendu : tous les tests passent et la feuille compile.

- [ ] **Etape 7 : Commit**

```bash
git add frontend/app/globals.css frontend/lib/parcours/transition.test.ts \
        frontend/components/portfolio/toast-notification.tsx
git commit -m "feat(parcours): la transition en fondu sequentiel, sous data-pagination active"
```

---

## Task 4 : Le conteneur de pagination

**Files:**
- Create: `frontend/components/parcours/parcours-pagine.tsx`
- Create: `frontend/lib/parcours/pagine.test.ts`

**Interfaces:**
- Consomme : `SECTIONS`, `sectionsActives` (tache 1) ; `prochainIndex`,
  `estEnButee`, `creerAccumulateur`, `SEUIL_MOLETTE` (tache 2) ; les attributs
  de la tache 3
- Produit :
  - `ParcoursPagine` avec les props `{ sections: Section[]; enfants: Record<string, React.ReactNode>; pied: React.ReactNode; colonne: React.ReactNode }`
  - `ContexteSectionActive: Context<string | null>` et `useSectionActive(): string | null`

**Pourquoi un contexte et non une fonction de rendu.** La colonne a besoin de
l'identifiant actif, que seul le conteneur connait. Mais `page.tsx` est un
composant serveur : il ne peut pas lui passer une fonction, qui n'est pas
serialisable a travers la frontiere. Le conteneur fournit donc un contexte, et
`ColonnePassage`, qui est deja un composant client, le consomme. La colonne
reste rendue par `page.tsx` et passee en prop, puisqu'un element rendu, lui,
traverse la frontiere sans peine.

**Pourquoi un dictionnaire d'enfants et non des enfants JSX.** Le conteneur doit
savoir quel contenu va avec quel identifiant, et lire les enfants par
introspection du DOM serait fragile. La page lui passe donc une table
`id -> contenu`, et le conteneur rend les coquilles lui-meme dans l'ordre de
`sections`.

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/pagine.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../i18n/i18n-context";
import { ParcoursPagine } from "@/components/parcours/parcours-pagine";
import { SECTIONS } from "./sections";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");

/** Le fournisseur declare `children` en prop requise et `createElement` les
 *  passe en troisieme argument, que les surcharges de TypeScript ne comptent
 *  pas. Le cast ne masque rien : les enfants sont bien fournis. */
const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;

function rendre(ids: string[], pied = "PIED") {
  const sections = SECTIONS.filter((s) => ids.includes(s.id));
  const enfants: Record<string, string> = {};
  for (const id of ids) enfants[id] = `CONTENU-${id}`;
  return renderToStaticMarkup(
    createElement(
      Fournisseur,
      { defaultLocale: "fr" },
      createElement(ParcoursPagine, { sections, enfants, pied }),
    ),
  );
}

describe("ParcoursPagine (spec sections 2 et 5)", () => {
  it("rend une section par entree, dans l ordre", () => {
    const html = rendre(["ouverture", "projets", "contact"]);
    const ordre = ["ouverture", "projets", "contact"].map((id) =>
      html.indexOf(`CONTENU-${id}`),
    );
    expect(ordre[0]).toBeGreaterThan(-1);
    expect(ordre[1]).toBeGreaterThan(ordre[0]);
    expect(ordre[2]).toBeGreaterThan(ordre[1]);
  });

  it("n active que la premiere section au rendu serveur", () => {
    const html = rendre(["ouverture", "projets"]);
    expect([...html.matchAll(/data-active="true"/g)]).toHaveLength(1);
  });

  it("donne a chaque section tabindex -1, pour recevoir le focus", () => {
    const html = rendre(["ouverture", "projets"]);
    expect([...html.matchAll(/tabindex="-1"/g)]).toHaveLength(2);
  });

  it("porte une region aria-live polite pour annoncer l arrivee", () => {
    expect(rendre(["ouverture"])).toMatch(/aria-live="polite"/);
  });

  // Spec section 3.3 : le pied descend dans la DERNIERE section rendue.
  it("met le pied dans la derniere section rendue, pas dans temoignages", () => {
    const html = rendre(["ouverture", "projets"]);
    const dernier = html.indexOf("CONTENU-projets");
    expect(html.indexOf("PIED")).toBeGreaterThan(dernier);
    expect(html.indexOf("PIED")).toBeGreaterThan(html.indexOf("CONTENU-ouverture"));
  });

  it("ne rend le pied qu une fois", () => {
    expect([...rendre(["ouverture", "projets", "contact"]).matchAll(/PIED/g)])
      .toHaveLength(1);
  });

  // Point de vigilance 2 : aucune section active.
  it("rend un document valide avec une liste vide, sans lever", () => {
    expect(() => rendre([])).not.toThrow();
    expect(rendre([])).toContain("PIED");
  });

  it("n emploie aucun mouvement propre", () => {
    const html = rendre(["ouverture"]);
    expect(html).not.toMatch(/slide-in|translate-|animate-in/);
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- pagine`
Attendu : ECHEC, composant `parcours-pagine` introuvable.

- [ ] **Etape 3 : Ecrire le conteneur**

Creer `frontend/components/parcours/parcours-pagine.tsx`. Points a respecter,
chacun venant de la spec :

1. `"use client"`. Etat `index`, initialise a 0 **au rendu serveur comme au
   premier rendu client**, pour qu'aucun ecart d'hydratation n'apparaisse. Le
   fragment de l'adresse est lu dans un `useEffect`, apres l'hydratation.
2. Au montage, poser `data-pagination="active"` sur `document.documentElement`,
   et le retirer au demontage. C'est ce qui active toutes les regles de la
   tache 3, et c'est ce qui garantit le repli sans JavaScript.
3. Poser `data-section-active` sur `document.documentElement` a chaque
   changement d'index.
4. **Fragment d'adresse.** Au montage, chercher `location.hash` dans
   `sections`. Trouve : index correspondant. Absent, inconnu, ou nommant une
   section eteinte : index 0, sans lever. Employer `indexDepuisFragment` de la
   tache 2, qui porte cette regle et ses six tests. (Point de vigilance 4.)
5. **Molette.** Un `wheel` non passif sur le conteneur. `preventDefault()`.
   Lire la butee de la section active par `estEnButee`, pousser `deltaY` dans
   l'accumulateur, et n'appeler `prochainIndex` que si l'accumulateur rend une
   direction.
6. **Verrou.** Pendant la transition et 80 ms apres, ignorer tout changement.
   Reinitialiser l'accumulateur a la fin du verrou. La duree de la transition
   est lue par `getComputedStyle` sur `--duree`, et non recopiee, afin que le
   reglage du backoffice reste maitre.
7. **Tactile.** `touchstart` et `touchend`, seuil de 48 px, meme regle de butee.
8. **Clavier.** `PageDown` et `PageUp` paginent toujours. `Fin` et `Debut` vont
   aux extremites. `ArrowDown` et `ArrowUp` ne paginent qu'en butee.
9. **Historique.** Un changement venu d'un clic appelle `pushState`, tout autre
   appelle `replaceState`. Ecouter `popstate` pour suivre le bouton Retour.
10. **Focus.** Au clic et au clavier, appeler `focus()` sur la section arrivante.
    Sur la molette et le tactile, ne pas toucher au focus.
11. **Annonce.** Une region `aria-live="polite"` en `sr-only` nommant la section
    active par `t(section.cleTitre)`.
12. **Le contexte.** Exporter `ContexteSectionActive` et `useSectionActive`, et
    envelopper le rendu dans le fournisseur, valeur `sections[index]?.id ?? null`.
    Rendre `colonne` a l'interieur du fournisseur, et non a cote.
13. Rendre chaque section dans un element portant `className="section-paginee"`,
    `data-active`, `id`, et `tabIndex={-1}`. Le pied est rendu a la fin du
    contenu de la **derniere section de `sections`**, et une seule fois. Avec une
    liste vide, rendre le pied seul dans un conteneur sans section.

- [ ] **Etape 4 : Lancer les tests et le typecheck**

Lancer : `npm run test -w frontend` puis `npm run typecheck -w frontend`
Attendu : tous les tests passent.

- [ ] **Etape 5 : Commit**

```bash
git add frontend/components/parcours/parcours-pagine.tsx \
        frontend/lib/parcours/pagine.test.ts
git commit -m "feat(parcours): le conteneur de pagination, molette tactile clavier et historique"
```

---

## Task 5 : Le recablage de la page

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/components/portfolio/section-shell.tsx`
- Modify: `frontend/components/parcours/colonne-passage.tsx`
- Modify: `frontend/components/parcours/drapeau-disponibilite.tsx`
- Delete: `frontend/lib/use-reveal.ts`
- Test: `frontend/lib/parcours/pagine.test.ts` (etendu)

**Interfaces:**
- Consomme : `ParcoursPagine` (tache 4), `sectionsActives` (tache 1)
- Produit : rien de nouveau

- [ ] **Etape 1 : Etendre le test**

Ajouter a `frontend/lib/parcours/pagine.test.ts` :

```ts
describe("les retraits de la tache 5 (spec section 3.1)", () => {
  it("use-reveal est supprime", () => {
    expect(() => lire("lib/use-reveal.ts")).toThrow();
  });

  it("plus aucun fichier ne l importe", () => {
    for (const f of ["components/portfolio/section-shell.tsx", "app/page.tsx"]) {
      expect(lire(f), f).not.toContain("use-reveal");
      expect(lire(f), f).not.toContain("useReveal");
    }
  });

  it("l ouverture est rendue sans condition", () => {
    const page = lire("app/page.tsx");
    // Categorique : on exige que `showPresentations` ne conditionne plus la
    // section, mais seulement son contenu.
    expect(page).not.toMatch(/\{s\.showPresentations &&\s*\(?\s*<SectionShell/);
  });

  it("la ligne de disponibilite n est plus en tete de main", () => {
    const page = lire("app/page.tsx");
    const main = page.indexOf("<main");
    const ligne = page.indexOf("<LigneDisponibilite");
    const premiere = page.indexOf("<ParcoursPagine");
    if (ligne > -1) expect(ligne).toBeGreaterThan(premiere);
    expect(main).toBeGreaterThan(-1);
  });
});
```

Les imports `readFileSync` et `path` et l'auxiliaire `lire` existent deja en
tete du fichier, poses par la tache 4.

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- pagine`
Attendu : ECHEC, `use-reveal.ts` existe encore.

- [ ] **Etape 3 : Alleger `SectionShell`**

Retirer l'import et l'appel de `useReveal`, retirer le `ref` de reveal sur le
bloc, et ajouter `tabIndex={-1}` sur l'element `<section>`. Retirer egalement
`data-rang`, dont le seul usage etait la regle `content-visibility` supprimee en
tache 3. Remplacer la cle de titre employee : la section emploie desormais la
cle `nav.*` que `sections.ts` porte, afin que la colonne et le titre disent la
meme chose.

- [ ] **Etape 4 : Recabler `page.tsx`**

Construire la table des contenus et deleguer :

```tsx
  const sections = sectionsActives(s);
  const enfants: Record<string, React.ReactNode> = {
    ouverture: (
      <>
        <Medaillon infos={data.personalInfo} />
        <LigneDisponibilite etat={s.availabilityStatus} libelle={s.availabilityLabel} />
        {s.showPresentations && <PresentationSection presentations={data.presentations} infos={data.personalInfo} />}
      </>
    ),
    stats: <StatsSection stats={data.stats} />,
    competences: <SkillsSection skills={data.skills} />,
    experience: (
      <ExperienceSection
        experiences={data.experiences}
        certifications={data.certifications}
        afficherCertifications={s.showCertifications}
      />
    ),
    projets: <JournalProjets projets={data.projects} />,
    "a-propos": <AboutSection about={data.about} />,
    contact: <ContactSection />,
    services: <ServicesSection services={data.services} />,
    temoignages: <TestimonialsSection testimonials={data.testimonials} />,
  };
```

Puis, dans le rendu :

```tsx
      <main className="min-h-screen">
        <SectionToastObserver sections={sections} />
        <ParcoursPagine
          sections={sections}
          enfants={enfants}
          pied={<Footer personalInfo={data.personalInfo} />}
        />
        <ToastNotification message={s.toastMessage} delayMs={s.toastDelayMs} />
      </main>
```

La colonne est passee au conteneur pour vivre dans son contexte :

```tsx
          colonne={<ColonnePassage reglages={s} infos={data.personalInfo} />}
```

**L'ouverture est desormais inconditionnelle,** donc son reglage doit etre force
a vrai dans `sectionsActives`. Le plus simple et le plus honnete : retirer
`showPresentations` du champ `reglage` de l'ouverture dans `sections.ts` et le
remplacer par un reglage toujours vrai, en documentant pourquoi. Si aucun
reglage ne convient, ajouter a `Section` un champ optionnel
`inconditionnelle?: true` et le traiter dans `sectionsActives`.

Retirer le rendu de `LigneDisponibilite` en tete de `<main>` : il vit maintenant
dans le contenu de l'ouverture.

- [ ] **Etape 5 : Passer l'identifiant actif a la colonne**

`aria-current` est un attribut et non un style : il ne peut donc pas venir de
`data-section-active`, et il lui faut l'etat en React.

Dans `colonne-passage.tsx`, appeler `useSectionActive()` de la tache 4 et poser
`aria-current={idActif === s.id ? "true" : undefined}` sur chaque entree. Ne
pas ajouter de prop : le contexte evite de faire traverser l'etat par
`page.tsx`, qui est un composant serveur. La colonne elle-meme continue d'etre
rendue dans `page.tsx` et passee au conteneur par la prop `colonne`.

- [ ] **Etape 6 : Supprimer `use-reveal`**

```bash
git rm frontend/lib/use-reveal.ts
```

- [ ] **Etape 7 : Lancer les tests et le typecheck**

Lancer : `npm run test -w frontend` puis `npm run typecheck -w frontend`
Attendu : tous les tests passent.

- [ ] **Etape 8 : Commit**

```bash
git add frontend/app frontend/components frontend/lib
git commit -m "feat(parcours): la page rendue par le conteneur, ouverture inconditionnelle"
```

---

## Task 6 : Le toast recable et la derniere suppression

**Files:**
- Modify: `frontend/components/portfolio/section-toast-observer.tsx`
- Delete: `frontend/lib/parcours/section-courante.ts`
- Delete: `frontend/lib/parcours/suivi.test.ts`
- Test: `frontend/lib/parcours/toast-section.test.ts`

**Interfaces:**
- Consomme : `SECTIONS` (tache 1)
- Produit : `DELAI_STABILISATION = 400`

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/toast-section.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { DELAI_STABILISATION, annonceAPoser } from
  "@/components/portfolio/section-toast-observer";

const RACINE = path.resolve(import.meta.dirname, "../..");
const lire = (rel: string) => readFileSync(path.join(RACINE, rel), "utf8");

describe("le toast de section (spec section 3.2)", () => {
  it("le delai de stabilisation vaut 400 ms", () => {
    expect(DELAI_STABILISATION).toBe(400);
  });

  // Point de vigilance 5 : une rafale ne doit pas mettre neuf annonces en file.
  it("une rafale ne laisse qu une annonce, celle de l arrivee", () => {
    const poses: string[] = [];
    const planifier = annonceAPoser((id) => poses.push(id), DELAI_STABILISATION);
    planifier("stats");
    planifier("competences");
    planifier("projets");
    planifier.ecouler(DELAI_STABILISATION - 1);
    expect(poses).toEqual([]);
    planifier.ecouler(1);
    expect(poses).toEqual(["projets"]);
  });

  it("n annonce rien si l on repart avant la fin du delai", () => {
    const poses: string[] = [];
    const planifier = annonceAPoser((id) => poses.push(id), DELAI_STABILISATION);
    planifier("stats");
    planifier.ecouler(300);
    planifier("projets");
    planifier.ecouler(300);
    expect(poses).toEqual([]);
    planifier.ecouler(100);
    expect(poses).toEqual(["projets"]);
  });
});

describe("les retraits (spec section 3.1)", () => {
  it("le suivi par observation est supprime", () => {
    expect(() => lire("lib/parcours/section-courante.ts")).toThrow();
    expect(() => lire("lib/parcours/suivi.test.ts")).toThrow();
  });

  it("plus rien ne l importe", () => {
    for (const f of [
      "components/parcours/colonne-passage.tsx",
      "components/parcours/parcours-pagine.tsx",
    ]) {
      expect(lire(f), f).not.toContain("section-courante");
      expect(lire(f), f).not.toContain("useSectionCourante");
    }
  });

  it("le toast n observe plus rien", () => {
    const src = lire("components/portfolio/section-toast-observer.tsx");
    expect(src).not.toContain("IntersectionObserver");
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- toast-section`
Attendu : ECHEC, `DELAI_STABILISATION` n'est pas exporte.

- [ ] **Etape 3 : Recabler le toast**

Dans `section-toast-observer.tsx` :

```ts
export const DELAI_STABILISATION = 400;

/**
 * Avec la pagination, chaque section arrive entierement visible : sans delai,
 * une rafale de molette annoncerait les neuf sections traversees. On n'annonce
 * donc que celle ou l'on s'arrete vraiment, et tout nouveau changement annule
 * l'annonce en attente.
 *
 * L'horloge est injectee pour que la regle se teste sans navigateur.
 */
export function annonceAPoser(
  poser: (id: string) => void,
  delai: number,
) {
  let attendu: string | null = null;
  let restant = 0;

  const planifier = (id: string) => {
    attendu = id;
    restant = delai;
  };
  planifier.ecouler = (ms: number) => {
    if (attendu === null) return;
    restant -= ms;
    if (restant > 0) return;
    const id = attendu;
    attendu = null;
    poser(id);
  };
  return planifier;
}
```

Retirer l'`IntersectionObserver` et faire du composant un consommateur de la
section active, qu'il recoit par prop. Dans le composant reel, `ecouler` est
remplace par un `setTimeout` que chaque changement annule ; la fonction
ci-dessus est la regle, testable, et le composant l'applique avec une vraie
horloge.

- [ ] **Etape 4 : Supprimer le suivi par observation**

```bash
git rm frontend/lib/parcours/section-courante.ts frontend/lib/parcours/suivi.test.ts
```

- [ ] **Etape 5 : Lancer la suite complete, le typecheck et le lint**

Lancer : `npm run test -w frontend`, puis `npm run typecheck -w frontend`, puis
`npm run lint -w frontend`.

Attendu : tous les tests passent, le typecheck est propre, et le lint rapporte
**exactement un probleme**, l'erreur preexistante `i18n-context.tsx:35` sur
`setState` dans un effet, anterieure au depot et laissee en place sur decision
du proprietaire. Verifier qu'aucun second probleme n'apparait.

- [ ] **Etape 6 : Commit**

```bash
git add frontend/components frontend/lib
git commit -m "feat(parcours): le toast annonce l arrivee, le suivi par observation est retire"
```

---

## Ce que ce plan ne contient pas

Quatre chantiers restent ouverts, et le proprietaire choisira leur ordre :

- **Le parchemin des projets,** avec le lien LinkedIn. Devra cohabiter avec la
  transition definie ici.
- **La section contact,** dernier morceau reste a l'idiome d'avant la refonte :
  texte centre, variantes `dark:` de Tailwind, et un vert code en dur hors
  palette.
- **L'ampoule et le menu sur les pages de blog.**
- **L'horizon marin.** Avertissement : le toast de section est ancre en bas a
  droite, a 28 px du coin, exactement ou l'horizon doit venir.

Et un cinquieme, cree par l'inventaire : **la mise au pas des mouvements** sur
le reste du site, soit 21 regles, 4 jeux d'images-cles et 10 fichiers, dont le
carrousel des temoignages et la cascade `item-cascade`.
