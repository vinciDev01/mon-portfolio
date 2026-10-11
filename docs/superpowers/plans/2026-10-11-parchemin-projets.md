# Le parchemin des projets : plan d'implementation

> **Pour les executants :** SOUS-COMPETENCE REQUISE : employer
> superpowers:subagent-driven-development (recommande) ou
> superpowers:executing-plans pour implementer ce plan tache par tache. Les
> etapes emploient des cases a cocher (`- [ ]`) pour le suivi.

**But :** cliquer le titre d'un projet ouvre un parchemin posé sur la page, qui
porte le dossier complet du projet, collaborateurs et liens LinkedIn compris.

**Architecture :** un `<dialog>` ouvert par `showModal()`, avec repli sur
l'attribut `open` quand la methode manque. Le navigateur fournit alors la couche
superieure, le voile, Echap, la capture du focus et l'inertie du reste de la
page. La pagination se suspend par un drapeau porte par le fournisseur de
contexte existant, et la garde de la molette devient generique au lieu de
recevoir un second cas particulier.

**Pile :** Next.js 16 (App Router, Turbopack), React 19, Tailwind 4, vitest en
environnement `node`, avec un fichier en `jsdom` pour le cablage DOM.

**Spec :** `docs/superpowers/specs/2026-10-11-parchemin-projets-design.md`

## Contraintes globales

- **Deux mouvements seulement sur tout le site :** l'incandescence de l'ampoule
  et la transition entre sections. **Ce chantier n'en consomme aucun.** Le
  parchemin parait par l'opacite, et aucune de ses regles ne porte
  `transition`, `transform`, `translate`, `scale` ni `animate`.
- **Aucun degrade,** nulle part. Les bandes d'enroulement sont des `fill` SVG
  plats.
- **4,5:1 pour le texte et 3:1 pour les bordures signifiantes** dans les deux
  palettes. Les trois paires du parchemin sont deja mesurees, section 2.1 de la
  spec : bordure sur surface 3,52:1 et 3,74:1 ; texte secondaire sur surface
  6,83:1 et 6,32:1 ; accent sur surface 6,61:1 et 5,51:1.
- **Francais partout.** Aucun tiret cadratin, aucun emoji, dans aucun fichier
  touche. Messages de commit sans accents.
- **Les tests sont CATEGORIQUES et non orthographiques.** Un test qui interdit
  une ecriture ne protege pas contre une categorie de defaut. Le tableau de la
  section 7.1 de la spec donne la forme attendue de chaque garde-fou.
- **La base de donnees contient les donnees reelles du proprietaire.** Jamais
  `prisma migrate reset`, jamais `db push --force-reset`.
- **Ne jamais lancer `nest build`, `next build`, ni `npm run build` a la
  racine.** Employer `npm run typecheck -w frontend`.
- **Ne jamais arreter les serveurs de developpement, ne jamais `git stash`,
  ne jamais commiter sur `main`.** La branche est `charpente-parcours`.
- **Le cache de Turbopack s'est fige plusieurs fois** et a servi un melange
  d'etats. Ne jamais conclure a un defaut d'apres la feuille servie : verifier
  la source sur le disque. Un `touch` ne declenche rien, seule une modification
  de contenu reelle provoque la recompilation.

## Fait mesure, a connaitre avant d'ecrire une ligne

**jsdom n'implemente pas `showModal`.** Sonde passee puis supprimee : la methode
est absente, le dialogue ne s'ouvre jamais, et la propriete `inert` est
inconnue. Les quatre comportements modaux de la section 6 de la spec sont donc
**hors de portee de tout test ecrit ici**, et c'est le chemin de repli, par
l'attribut `open`, qui rend testables l'ouverture, la fermeture, le contenu et
l'historique.

Ne pas tenter de simuler `showModal` : un bouchon prouverait le bouchon.

## Points de vigilance

Cinq classes d'entree que la spec implique et qu'aucune tache ne testerait
spontanement. Chacune recoit son test dans la tache qui porte le code.

1. **Un projet depouille.** Ni seconde photo, ni public cible, ni
   collaborateurs, ni demonstration. Le parchemin doit se rendre sans bloc vide
   ni titre orphelin. Teste en tache 2.
2. **Un collaborateur sans LinkedIn.** Son nom est rendu **sans balise de
   lien**, et non comme un lien mort. Teste en tache 2.
3. **`showModal` absente.** Le parchemin doit s'ouvrir quand meme, par
   l'attribut `open`. C'est le cas de jsdom et des navigateurs anciens. Teste en
   tache 4.
4. **Un `popstate` pendant le verrou de pagination, parchemin ouvert.** Le
   parchemin se ferme et la section ne change **pas**. Les deux consommateurs du
   meme evenement doivent s'ordonner. Teste en tache 1.
5. **Fermer par Echap puis presser Retour.** L'entree d'historique doit avoir
   ete consommee, sans quoi le Retour « fermerait » un parchemin deja ferme ou
   sauterait une section. Teste en tache 4.

---

## Structure des fichiers

**A creer :**

- `frontend/lib/parcours/parchemin.ts` : les regles pures. Presence des blocs,
  rendu d'un collaborateur, et le predicat de precedence de l'historique.
- `frontend/components/parcours/parchemin-projet.tsx` : le dialogue.
- `frontend/lib/parcours/parchemin.test.ts`
- `frontend/lib/parcours/parchemin-dom.test.ts` (en `jsdom`)

**A modifier :**

- `frontend/components/parcours/parcours-pagine.tsx` : garde generique, drapeau
  de surcouche, precedence de `popstate`.
- `frontend/components/parcours/colonne-passage.tsx` : l'attribut de propriete
  de defilement.
- `frontend/components/parcours/journal-projets.tsx` : le titre en bouton, la
  photo de tete en bouton, l'etat du projet ouvert.
- `frontend/app/globals.css` : les regles du parchemin.
- `frontend/lib/i18n/fr.json`, `en.json`, `de.json` : une cle nouvelle.
- `frontend/lib/parcours/transition.test.ts` : le selecteur de la garde change.

**A supprimer :** rien.

---

## Task 1 : La garde generique, le drapeau de surcouche, et la precedence de l'historique

**Files:**
- Modify: `frontend/components/parcours/parcours-pagine.tsx`
- Modify: `frontend/components/parcours/colonne-passage.tsx`
- Modify: `frontend/lib/parcours/transition.test.ts`
- Test: `frontend/lib/parcours/parchemin-dom.test.ts` (cree ici, etendu en tache 4)

**Interfaces:**
- Consomme : `estEnButee` et `Direction` depuis `lib/parcours/pagination.ts`
- Produit :
  - `useSurcoucheOuverte(): boolean`
  - `useChangerSurcouche(): (ouverte: boolean) => void`
  - l'attribut `data-defilement-propre`, convention de tout element proprietaire
    de son defilement

**Pourquoi cette tache vient en premier.** Le parchemin depend des trois
mecanismes, et elle touche du code partage par toute la pagination : la faire
seule lui donne sa propre revue, au lieu de la noyer dans celle du parchemin.

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/parchemin-dom.test.ts` :

```ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createElement, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { I18nProvider } from "../i18n/i18n-context";
import {
  FournisseurSectionActive,
  ParcoursPagine,
  useChangerSurcouche,
} from "@/components/parcours/parcours-pagine";
import { SECTIONS } from "./sections";

/** Le fournisseur declare `children` en prop requise et `createElement` les
 *  passe en troisieme argument, que les surcharges de TypeScript ne comptent
 *  pas. Le cast ne masque rien : les enfants sont bien fournis. */
const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;

/** Bascule la surcouche depuis l'interieur de l'arbre, seul endroit d'ou le
 *  contexte est lisible. */
function Bascule({ ouverte }: { ouverte: boolean }) {
  const changer = useChangerSurcouche();
  changer(ouverte);
  return null;
}

let racine: ReturnType<typeof createRoot> | null = null;
let hote: HTMLDivElement;

beforeEach(() => {
  document.body.innerHTML = "";
  hote = document.createElement("div");
  document.body.append(hote);
  // jsdom n'implemente ni `scrollTo` ni `scrollBy` sur un element.
  Element.prototype.scrollTo = function () {};
  Element.prototype.scrollBy = function () {};
});

function monter(ids: string[], ouverte = false) {
  const sections = SECTIONS.filter((s) => ids.includes(s.id));
  const enfants: Record<string, string> = {};
  for (const id of ids) enfants[id] = `CONTENU-${id}`;
  racine = createRoot(hote);
  act(() => {
    racine!.render(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(
          FournisseurSectionActive,
          { initial: sections[0]?.id ?? null },
          createElement(Bascule, { ouverte }),
          createElement(ParcoursPagine, { sections, enfants, pied: "PIED" }),
        ),
      ),
    );
  });
}

function actif(): string | null {
  return hote.querySelector('[data-active="true"]')?.id ?? null;
}

describe("la garde est generique (spec section 5.3)", () => {
  it("sort pour tout element qui se declare proprietaire de son defilement", () => {
    monter(["ouverture", "projets"]);
    const prop = document.createElement("div");
    prop.setAttribute("data-defilement-propre", "");
    // Un element qui peut reellement defiler vers le bas.
    Object.defineProperties(prop, {
      scrollTop: { value: 0, writable: true },
      scrollHeight: { value: 1000, configurable: true },
      clientHeight: { value: 400, configurable: true },
    });
    hote.append(prop);
    act(() => {
      prop.dispatchEvent(
        new WheelEvent("wheel", { deltaY: 300, bubbles: true, cancelable: true }),
      );
    });
    expect(actif(), "la pagination a vole le defilement du proprietaire")
      .toBe("ouverture");
  });

  it("ne sort pas pour un proprietaire deja en butee dans ce sens", () => {
    monter(["ouverture", "projets"]);
    const prop = document.createElement("div");
    prop.setAttribute("data-defilement-propre", "");
    Object.defineProperties(prop, {
      scrollTop: { value: 600, writable: true },
      scrollHeight: { value: 1000, configurable: true },
      clientHeight: { value: 400, configurable: true },
    });
    hote.append(prop);
    act(() => {
      prop.dispatchEvent(
        new WheelEvent("wheel", { deltaY: 300, bubbles: true, cancelable: true }),
      );
    });
    // En butee vers le bas : la pagination reprend la main.
    expect(actif()).not.toBe("ouverture");
  });
});

describe("la pagination se suspend sous une surcouche (spec section 5.2)", () => {
  it("une molette ne change pas de section quand la surcouche est ouverte", () => {
    monter(["ouverture", "projets"], true);
    act(() => {
      window.dispatchEvent(
        new WheelEvent("wheel", { deltaY: 300, bubbles: true, cancelable: true }),
      );
    });
    expect(actif()).toBe("ouverture");
  });

  it("une touche de pagination ne change pas de section non plus", () => {
    monter(["ouverture", "projets"], true);
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "PageDown", bubbles: true, cancelable: true }),
      );
    });
    expect(actif()).toBe("ouverture");
  });

  // Point de vigilance 4.
  it("un popstate ferme la surcouche et NE change PAS de section", () => {
    monter(["ouverture", "projets"], true);
    const avant = actif();
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(actif(), "la section a change alors qu'une surcouche etait ouverte")
      .toBe(avant);
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- parchemin-dom`
Attendu : ECHEC, `useChangerSurcouche` n'est pas exporte.

- [ ] **Etape 3 : Rendre la garde generique**

Dans `parcours-pagine.tsx`, remplacer `colonneDefile` par `proprietaireDefile`.
L'ancienne forme visait `.colonne-passage` en dur :

```ts
    // Tout element qui se declare proprietaire de son defilement garde ses
    // evenements, a condition de pouvoir reellement defiler dans ce sens. Sans
    // cette condition, une bande pleine hauteur deviendrait morte, la ou le
    // pointeur se trouve justement apres un clic. `direction` nul : le geste
    // n'a pas encore de sens, on regarde les deux.
    // Une regle, deux clients : la colonne de passage et le parchemin.
    const proprietaireDefile = (cible: EventTarget | null, direction: Direction | 0) => {
      const el = cible instanceof Element ? cible.closest("[data-defilement-propre]") : null;
      if (!el) return false;
      if (direction === 0) return !estEnButee(el, 1) || !estEnButee(el, -1);
      return !estEnButee(el, direction);
    };
```

Mettre a jour ses deux appelants, `surMolette` et les gestionnaires tactiles.

Dans `colonne-passage.tsx`, ajouter `data-defilement-propre` sur le `<nav>`, avec
un commentaire disant que c'est la convention lue par le conteneur.

Dans `transition.test.ts`, mettre a jour toute assertion qui nommait
`.colonne-passage` dans ce role.

- [ ] **Etape 4 : Ajouter le drapeau de surcouche**

Dans `parcours-pagine.tsx`, a cote des deux contextes existants :

```ts
const ContexteSurcouche = createContext(false);
const ContexteChangerSurcouche = createContext<(ouverte: boolean) => void>(() => {});

export function useSurcoucheOuverte(): boolean {
  return useContext(ContexteSurcouche);
}
export function useChangerSurcouche(): (ouverte: boolean) => void {
  return useContext(ContexteChangerSurcouche);
}
```

`FournisseurSectionActive` detient l'etat et empile les deux fournisseurs de
plus. `ParcoursPagine` lit `useSurcoucheOuverte()` dans une `ref`, et chacun de
ses gestionnaires de pagination sort tot quand elle vaut vrai : molette,
tactile, clavier et clic.

Employer une `ref` et non la valeur directement : les gestionnaires sont
installes une fois dans un effet, et une valeur capturee y serait perimee.

- [ ] **Etape 5 : Donner la precedence a la surcouche sur `popstate`**

`surRetour` sort tot quand la surcouche est ouverte, sans changer de section.
C'est le parchemin qui se fermera, en tache 4, par son propre ecouteur.

Commenter le pourquoi : deux consommateurs du meme evenement, et celui de la
surcouche prime, sans quoi un Retour fermerait le parchemin ET reculerait d'une
section.

- [ ] **Etape 6 : Lancer les tests et le typecheck**

Lancer : `npm run test -w frontend` puis `npm run typecheck -w frontend` puis
`npm run lint -w frontend`.
Attendu : tous les tests passent, le typecheck est propre, et le lint rapporte
**exactement un probleme**, l'erreur preexistante `i18n-context.tsx:35`.

- [ ] **Etape 7 : Eprouver les deux gardes par mutation**

Retirer a la main la condition de butee de `proprietaireDefile`, c'est-a-dire
rendre vrai des que l'element existe : le test « ne sort pas pour un
proprietaire deja en butee » doit tomber. Remettre.

Retirer la sortie anticipee de `surRetour` : le test du point de vigilance 4
doit tomber. Remettre.

Rapporter les deux messages d'echec obtenus. Un garde-fou qu'on n'a pas vu
mordre n'en est pas un, et ce depot l'a paye deux fois.

- [ ] **Etape 8 : Commit**

```bash
git add frontend/components/parcours frontend/lib/parcours
git commit -m "feat(parcours): garde de defilement generique, drapeau de surcouche, precedence de l historique"
```

---

## Task 2 : Les regles pures du parchemin

**Files:**
- Create: `frontend/lib/parcours/parchemin.ts`
- Create: `frontend/lib/parcours/parchemin.test.ts`

**Interfaces:**
- Consomme : `ProjectDto` et `ProjectCollaboratorDto` depuis
  `@portfolio/shared-types` ; `ligneDateProjet` depuis `lib/parcours/journal.ts`
- Produit :
  - `type BlocParchemin = "photos" | "description" | "public" | "technologies" | "collaborateurs" | "demonstration"`
  - `blocsPresents(projet: ProjectDto): BlocParchemin[]`
  - `type Credit = { cle: string; nom: string; lien: string | null }`
  - `credits(projet: ProjectDto): Credit[]`

**Pourquoi des fonctions pures.** La spec impose des tests categoriques, et la
degradation bloc par bloc est l'endroit ou un defaut ne se verrait pas a la
lecture. Separee du composant, elle se teste sans navigateur.

- [ ] **Etape 1 : Ecrire le test qui echoue**

Creer `frontend/lib/parcours/parchemin.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import type { ProjectDto, ProjectCollaboratorDto } from "@portfolio/shared-types";
import { blocsPresents, credits } from "./parchemin";

function projet(p: Partial<ProjectDto>): ProjectDto {
  return {
    id: "x", name: "Projet", description: null,
    photo1Path: null, photo2Path: null, demoUrl: null, targetAudience: null,
    startDate: null, endDate: null, technologies: [], collaborators: [],
    sortOrder: 0, ...p,
  } as ProjectDto;
}

function qui(p: Partial<ProjectCollaboratorDto>): ProjectCollaboratorDto {
  return {
    id: "c", firstName: "Ada", lastName: "Lovelace",
    email: null, linkedinUrl: null, sortOrder: 0, ...p,
  };
}

describe("blocsPresents (spec section 4)", () => {
  // Point de vigilance 1 : un projet depouille.
  it("ne rend aucun bloc pour un projet sans rien", () => {
    expect(blocsPresents(projet({}))).toEqual([]);
  });

  it("rend les photos des qu une seule existe", () => {
    expect(blocsPresents(projet({ photo1Path: "a.webp" }))).toContain("photos");
    expect(blocsPresents(projet({ photo2Path: "b.webp" }))).toContain("photos");
  });

  it("ne rend pas le public cible quand il est vide ou blanc", () => {
    expect(blocsPresents(projet({ targetAudience: "" }))).not.toContain("public");
    expect(blocsPresents(projet({ targetAudience: "   " }))).not.toContain("public");
  });

  it("ne rend pas la description quand elle est blanche", () => {
    expect(blocsPresents(projet({ description: "  " }))).not.toContain("description");
  });

  it("ne rend pas les technologies sur une liste vide", () => {
    expect(blocsPresents(projet({ technologies: [] }))).not.toContain("technologies");
  });

  it("ne rend pas les collaborateurs sur une liste vide", () => {
    expect(blocsPresents(projet({ collaborators: [] }))).not.toContain("collaborateurs");
  });

  it("garde l ordre de lecture de la spec", () => {
    const tout = projet({
      photo1Path: "a.webp", description: "d", targetAudience: "p",
      technologies: [{ id: "t", label: "Angular", logoPath: null, sortOrder: 0 }],
      collaborators: [qui({})], demoUrl: "https://exemple.test",
    });
    expect(blocsPresents(tout)).toEqual([
      "photos", "description", "public", "technologies",
      "collaborateurs", "demonstration",
    ]);
  });
});

describe("credits (spec section 4)", () => {
  // Point de vigilance 2 : un collaborateur sans LinkedIn.
  it("rend un nom sans lien quand le LinkedIn est nul", () => {
    expect(credits(projet({ collaborators: [qui({ linkedinUrl: null })] })))
      .toEqual([{ cle: "c", nom: "Ada Lovelace", lien: null }]);
  });

  it("traite une chaine vide ou blanche comme une absence de lien", () => {
    expect(credits(projet({ collaborators: [qui({ linkedinUrl: "   " })] }))[0].lien)
      .toBeNull();
  });

  it("rend le lien quand il existe", () => {
    const c = credits(projet({
      collaborators: [qui({ linkedinUrl: "https://linkedin.test/in/ada" })],
    }));
    expect(c[0].lien).toBe("https://linkedin.test/in/ada");
  });

  it("trie par sortOrder et non par ordre d arrivee", () => {
    const c = credits(projet({
      collaborators: [
        qui({ id: "b", firstName: "Grace", lastName: "Hopper", sortOrder: 5 }),
        qui({ id: "a", firstName: "Ada", lastName: "Lovelace", sortOrder: 0 }),
      ],
    }));
    expect(c.map((x) => x.cle)).toEqual(["a", "b"]);
  });

  it("ne modifie pas le tableau recu", () => {
    const liste = [
      qui({ id: "b", sortOrder: 5 }),
      qui({ id: "a", sortOrder: 0 }),
    ];
    credits(projet({ collaborators: liste }));
    expect(liste.map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("tolere un nom partiel sans laisser d espace en trop", () => {
    expect(credits(projet({ collaborators: [qui({ lastName: "" })] }))[0].nom)
      .toBe("Ada");
  });
});
```

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- parchemin`
Attendu : ECHEC, module `./parchemin` introuvable.

- [ ] **Etape 3 : Ecrire le module**

Creer `frontend/lib/parcours/parchemin.ts` :

```ts
import type { ProjectDto, ProjectCollaboratorDto } from "@portfolio/shared-types";

export type BlocParchemin =
  | "photos" | "description" | "public"
  | "technologies" | "collaborateurs" | "demonstration";

/** Vrai quand la chaine porte autre chose que des blancs. */
function renseigne(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim() !== "";
}

/**
 * Les blocs du parchemin, dans l'ordre de lecture de la section 4 de la spec.
 * Un bloc dont la donnee manque n'est pas rendu : pas de titre orphelin, pas
 * d'espace vide. Une chaine de blancs compte comme une absence, le backoffice
 * pouvant enregistrer un champ efface sans le mettre a nul.
 */
export function blocsPresents(projet: ProjectDto): BlocParchemin[] {
  const blocs: BlocParchemin[] = [];
  if (renseigne(projet.photo1Path) || renseigne(projet.photo2Path)) blocs.push("photos");
  if (renseigne(projet.description)) blocs.push("description");
  if (renseigne(projet.targetAudience)) blocs.push("public");
  if (projet.technologies.length > 0) blocs.push("technologies");
  if (projet.collaborators.length > 0) blocs.push("collaborateurs");
  if (renseigne(projet.demoUrl)) blocs.push("demonstration");
  return blocs;
}

export type Credit = { cle: string; nom: string; lien: string | null };

/**
 * Les personnes creditees, triees par `sortOrder` et non par ordre d'arrivee.
 * Un `linkedinUrl` nul ou blanc rend un nom SANS lien, et non un lien mort :
 * c'est la difference entre crediter quelqu'un et donner une adresse fausse.
 * Les courriels ne sortent pas d'ici : la demande ne porte que sur LinkedIn, et
 * exposer une adresse en clair invite les moissonneurs.
 */
export function credits(projet: ProjectDto): Credit[] {
  return [...projet.collaborators]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c: ProjectCollaboratorDto) => ({
      cle: c.id,
      nom: [c.firstName, c.lastName].filter((p) => renseigne(p)).join(" "),
      lien: renseigne(c.linkedinUrl) ? c.linkedinUrl!.trim() : null,
    }));
}
```

- [ ] **Etape 4 : Lancer les tests et le typecheck**

Lancer : `npm run test -w frontend -- parchemin` puis
`npm run typecheck -w frontend`
Attendu : tous les tests passent.

- [ ] **Etape 5 : Commit**

```bash
git add frontend/lib/parcours/parchemin.ts frontend/lib/parcours/parchemin.test.ts
git commit -m "feat(parcours): les regles pures du parchemin, degradation bloc par bloc"
```

---

## Task 3 : La forme

**Files:**
- Modify: `frontend/app/globals.css`
- Test: `frontend/lib/parcours/parchemin.test.ts` (etendu)

**Interfaces:**
- Consomme : les jetons `--surface`, `--fond`, `--bordure-signifiante`,
  `--texte-secondaire`, `--accent`, `--espace-1` a `--espace-5`
- Produit : les classes `.parchemin`, `.parchemin-feuille`, `.parchemin-bande`,
  `.parchemin-corps`, `.parchemin-credits`, que la tache 4 emploie

**Pourquoi la feuille avant le composant.** La forme se verifie en lisant la
feuille, sans navigateur. L'ecrire d'abord fait exister les garde-fous
categoriques avant le code qui s'y appuie.

- [ ] **Etape 1 : Ecrire le test qui echoue**

Ajouter a `frontend/lib/parcours/parchemin.test.ts`, en important les
auxiliaires de lecture de feuille deja partages :

```ts
import { css } from "./feuille-test";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "@/lib/design/tokens";

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

describe("la forme du parchemin (spec section 2)", () => {
  const regles = () =>
    [...css.matchAll(/([^{}]*\.parchemin[a-z-]*[^{}]*)\{([^}]*)\}/g)];

  it("declare au moins la feuille et les bandes", () => {
    const noms = regles().map((m) => m[1]).join(" ");
    expect(noms).toContain(".parchemin-feuille");
    expect(noms).toContain(".parchemin-bande");
  });

  // Categorique : AUCUNE regle du parchemin ne bouge, quelle qu'elle soit.
  it("aucune regle du parchemin ne porte de mouvement", () => {
    const r = regles();
    expect(r.length, "aucune regle .parchemin").toBeGreaterThan(0);
    for (const [, sel, corps] of r) {
      expect(corps, sel.trim()).not.toMatch(/transition|transform|translate|scale\(|animate/);
    }
  });

  it("aucune regle du parchemin ne porte de degrade", () => {
    for (const [, sel, corps] of regles()) {
      expect(corps, sel.trim()).not.toMatch(/gradient/);
    }
  });

  it("la feuille est en surface et bordee de la bordure signifiante", () => {
    const f = blocs(/\.parchemin-feuille\s*\{/, css).join("\n");
    expect(f).toContain("var(--surface)");
    expect(f).toContain("var(--bordure-signifiante)");
  });

  it("les bandes d enroulement sont remplies a plat en fond", () => {
    const b = blocs(/\.parchemin-bande\s*\{/, css).join("\n");
    expect(b).toContain("var(--fond)");
    expect(b).not.toMatch(/gradient/);
  });

  it("le corps du parchemin se declare proprietaire de son defilement", () => {
    // La convention de la tache 1 : sans cet attribut, la molette dans le
    // parchemin paginerait la page derriere.
    const src = lire("components/parcours/parchemin-projet.tsx");
    expect(src).toContain("data-defilement-propre");
  });
});

describe("les contrastes du parchemin, calcules et non epingles", () => {
  for (const [nom, p] of [["clair", PALETTE_CLAIRE], ["sombre", PALETTE_SOMBRE]] as const) {
    it(`${nom} : bordure sur la feuille atteint 3:1`, () => {
      expect(ratio(p.bordureSignifiante, p.surface)).toBeGreaterThanOrEqual(3);
    });
    it(`${nom} : texte secondaire sur la feuille atteint 4,5:1`, () => {
      expect(ratio(p.texteSecondaire, p.surface)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${nom} : accent sur la feuille atteint 4,5:1`, () => {
      expect(ratio(p.accent, p.surface)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("le fond reste plus sombre que la surface, sinon la bande ne lit plus", () => {
    // C'est ce qui fait qu'une bande en `--fond` se lit comme un dessous
    // ombre dans les DEUX palettes, sans degrade.
    expect(lum(PALETTE_CLAIRE.fond)).toBeLessThan(lum(PALETTE_CLAIRE.surface));
    expect(lum(PALETTE_SOMBRE.fond)).toBeLessThan(lum(PALETTE_SOMBRE.surface));
  });
});
```

`lire`, `css`, `bloc` et `valeur` sont deja exportes par `./feuille-test` :
les importer de la, sans les reecrire.

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- parchemin`
Attendu : ECHEC, aucune regle `.parchemin` dans la feuille.

- [ ] **Etape 3 : Ecrire les regles dans `@layer components`**

Le layer ouvre vers la ligne 721. Ajouter :

```css
  /* Le parchemin : la forme porte le sens, jamais le mouvement. Meme
     raisonnement que le drapeau de disponibilite. Aucune de ces regles ne
     doit gagner de `transition` ni de `transform` : le budget du site est de
     deux mouvements et ce chantier n'en consomme aucun. */
  .parchemin::backdrop {
    background: rgb(0 0 0 / 0.55);
  }

  .parchemin {
    border: 0;
    padding: 0;
    max-width: min(66ch, calc(100vw - 2 * var(--espace-3)));
    max-height: calc(100dvh - 2 * var(--espace-3));
    background: transparent;
  }

  .parchemin-feuille {
    display: grid;
    grid-template-rows: auto 1fr auto;
    background: var(--surface);
    border-inline: 1px solid var(--bordure-signifiante);
    max-height: inherit;
  }

  /* Dessous ombre, pas un degrade : `--fond` est plus sombre que `--surface`
     dans les deux palettes, donc une bande remplie a plat suffit. La courbe
     vit dans le trace SVG. */
  .parchemin-bande {
    display: block;
    width: 100%;
    height: 24px;
    fill: var(--fond);
    stroke: var(--bordure-signifiante);
    stroke-width: 1;
  }

  .parchemin-corps {
    overflow-y: auto;
    padding: var(--espace-3);
  }

  .parchemin-credits {
    list-style: none;
    padding: 0;
    margin: 0;
  }
```

- [ ] **Etape 4 : Ajouter le bloc des couleurs forcees**

Dans le `@media (forced-colors: active)` existant, en suivant le motif du site :
donner aux bandes `fill: Canvas` et `stroke: CanvasText`, et a la feuille une
bordure en `CanvasText`. Ne pas employer `forced-color-adjust: none` : le
chantier precedent a corrige cet usage, parce qu'il rend la couleur de l'auteur
a qui a demande au systeme de choisir.

- [ ] **Etape 5 : Lancer les tests et verifier que la feuille compile**

Depuis `frontend/`, compiler par un script en ligne, faute de quoi Node resout
les modules au mauvais endroit :

```bash
node --input-type=module -e "
import postcss from 'postcss';
import tw from '@tailwindcss/postcss';
import { readFileSync } from 'node:fs';
const r = await postcss([tw()]).process(readFileSync('app/globals.css','utf8'), { from: 'app/globals.css' });
console.log('compile, ' + r.css.length + ' octets');
"
```

Attendu : les tests passent et la feuille compile.

- [ ] **Etape 6 : Commit**

```bash
git add frontend/app/globals.css frontend/lib/parcours/parchemin.test.ts
git commit -m "feat(parcours): la forme du parchemin, bandes plates et aucun mouvement"
```

---

## Task 4 : Le composant parchemin

**Files:**
- Create: `frontend/components/parcours/parchemin-projet.tsx`
- Modify: `frontend/lib/i18n/fr.json`, `en.json`, `de.json`
- Test: `frontend/lib/parcours/parchemin-dom.test.ts` (etendu)

**Interfaces:**
- Consomme : `blocsPresents`, `credits` (tache 2) ; `useChangerSurcouche`
  (tache 1) ; `ligneDateProjet` depuis `lib/parcours/journal.ts` ;
  `getFileUrl` depuis `lib/api`
- Produit : `ParcheminProjet` avec les props
  `{ projet: ProjectDto | null; surFermeture: () => void }`

- [ ] **Etape 1 : Ajouter la cle de fermeture**

Aucune cle de fermeture n'existe dans les dictionnaires. Ajouter, a plat :
`"parcours.fermerParchemin"` valant « Fermer le dossier du projet » en francais,
« Close the project file » en anglais, « Projektakte schliessen » en allemand.

Les six autres cles necessaires existent deja dans les trois langues, verifie :
`projects.clickForDetails`, `projects.ongoing`, `projects.targetAudience`,
`projects.technologies`, `projects.collaborators`, `projects.viewDemo`.

- [ ] **Etape 2 : Ecrire le test qui echoue**

Ajouter a `frontend/lib/parcours/parchemin-dom.test.ts` :

```ts
describe("le parchemin (spec sections 4, 5 et 6)", () => {
  // Point de vigilance 3 : `showModal` absente, cas de jsdom.
  it("s ouvre par l attribut open quand showModal manque", () => {
    expect(typeof HTMLDialogElement.prototype.showModal,
      "jsdom a gagne showModal : adapter ce test").not.toBe("function");
    const d = monterParchemin(projetComplet());
    expect(d.hasAttribute("open")).toBe(true);
  });

  it("porte un nom accessible par le titre du projet", () => {
    const d = monterParchemin(projetComplet());
    const lie = d.getAttribute("aria-labelledby");
    expect(lie).toBeTruthy();
    expect(d.querySelector(`#${lie}`)?.textContent).toContain("Projet complet");
  });

  it("le bouton de fermeture a un nom accessible explicite", () => {
    const d = monterParchemin(projetComplet());
    const b = d.querySelector("button[data-fermer]");
    expect(b?.getAttribute("aria-label") ?? b?.textContent).toMatch(/\S{4,}/);
  });

  it("le corps se declare proprietaire de son defilement", () => {
    const d = monterParchemin(projetComplet());
    expect(d.querySelector("[data-defilement-propre]")).not.toBeNull();
  });

  // Point de vigilance 1, cote rendu.
  it("un projet depouille ne rend aucun bloc vide", () => {
    const d = monterParchemin(projetNu());
    expect(d.querySelectorAll("img")).toHaveLength(0);
    expect(d.textContent).not.toContain("Public concerne");
    expect(d.textContent).not.toContain("Collaborateurs");
    expect(d.querySelectorAll("a")).toHaveLength(0);
  });

  // Point de vigilance 2, cote rendu.
  it("un collaborateur sans LinkedIn est nomme sans lien", () => {
    const d = monterParchemin(projetAvecCredits());
    const li = [...d.querySelectorAll("li")];
    const sansLien = li.find((e) => e.textContent?.includes("Grace Hopper"));
    expect(sansLien?.querySelector("a")).toBeNull();
    const avecLien = li.find((e) => e.textContent?.includes("Ada Lovelace"));
    expect(avecLien?.querySelector("a")?.getAttribute("href"))
      .toBe("https://linkedin.test/in/ada");
  });

  it("chaque lien LinkedIn porte le nom de la personne, pas LinkedIn seul", () => {
    const d = monterParchemin(projetAvecCredits());
    const a = d.querySelector("li a");
    const nom = a?.getAttribute("aria-label") ?? a?.textContent ?? "";
    expect(nom).toContain("Ada Lovelace");
  });

  it("les liens externes portent rel noopener noreferrer", () => {
    const d = monterParchemin(projetComplet());
    for (const a of d.querySelectorAll('a[target="_blank"]')) {
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("les photos portent un alt vide, le nom etant lu a cote", () => {
    const d = monterParchemin(projetComplet());
    for (const img of d.querySelectorAll("img")) {
      expect(img.getAttribute("alt")).toBe("");
    }
  });

  // Point de vigilance 5.
  it("fermer consomme l entree d historique", () => {
    const back = vi.spyOn(history, "back").mockImplementation(() => {});
    const d = monterParchemin(projetComplet());
    act(() => {
      (d.querySelector("button[data-fermer]") as HTMLButtonElement).click();
    });
    expect(back, "l entree resterait et un Retour fermerait un parchemin deja ferme")
      .toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  it("l ouverture pose une entree d historique", () => {
    const push = vi.spyOn(history, "pushState");
    monterParchemin(projetComplet());
    expect(push).toHaveBeenCalled();
    push.mockRestore();
  });
});
```

Ajouter en tete du meme fichier les fabriques et le monteur :

```ts
import type { ProjectDto } from "@portfolio/shared-types";
import { ParcheminProjet } from "@/components/parcours/parchemin-projet";

function fabrique(p: Partial<ProjectDto>): ProjectDto {
  return {
    id: "x", name: "Projet", description: null,
    photo1Path: null, photo2Path: null, demoUrl: null, targetAudience: null,
    startDate: null, endDate: null, technologies: [], collaborators: [],
    sortOrder: 0, ...p,
  } as ProjectDto;
}

const projetNu = () => fabrique({ name: "Projet nu" });

const projetComplet = () => fabrique({
  name: "Projet complet",
  description: "Une description.",
  targetAudience: "Les gens",
  photo1Path: "projects/a.webp",
  photo2Path: "projects/b.webp",
  demoUrl: "https://exemple.test",
  startDate: "2024-03-01",
  endDate: "2025-01-01",
  technologies: [{ id: "t1", label: "Angular", logoPath: null, sortOrder: 0 }],
  collaborators: [
    { id: "c1", firstName: "Ada", lastName: "Lovelace", email: null,
      linkedinUrl: "https://linkedin.test/in/ada", sortOrder: 0 },
  ],
});

/** Grace d'abord dans le tableau mais `sortOrder` plus grand : le tri doit
 *  donc remonter Ada, et Grace n'a pas de lien. */
const projetAvecCredits = () => fabrique({
  name: "Projet credite",
  collaborators: [
    { id: "c2", firstName: "Grace", lastName: "Hopper", email: null,
      linkedinUrl: null, sortOrder: 1 },
    { id: "c1", firstName: "Ada", lastName: "Lovelace", email: null,
      linkedinUrl: "https://linkedin.test/in/ada", sortOrder: 0 },
  ],
});

function monterParchemin(p: ProjectDto): HTMLDialogElement {
  racine = createRoot(hote);
  act(() => {
    racine!.render(
      createElement(
        Fournisseur,
        { defaultLocale: "fr" },
        createElement(ParcheminProjet, { projet: p, surFermeture: () => {} }),
      ),
    );
  });
  const d = hote.querySelector("dialog");
  if (!d) throw new Error("aucun <dialog> rendu");
  return d as HTMLDialogElement;
}
```

- [ ] **Etape 3 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- parchemin-dom`
Attendu : ECHEC, composant `parchemin-projet` introuvable.

- [ ] **Etape 4 : Ecrire le composant**

Creer `frontend/components/parcours/parchemin-projet.tsx`. Points a respecter,
chacun venant de la spec :

1. `"use client"`. Props `{ projet: ProjectDto | null; surFermeture: () => void }`.
   `projet` nul ne rend rien.
2. **Ouverture.** Dans un effet, si `dialogue.showModal` est une fonction,
   l'appeler ; sinon poser l'attribut `open`. Commenter que le repli existe
   parce que jsdom ne connait pas `showModal`, et que la version modale seule
   donne la capture du focus et l'inertie.
3. **Le drapeau.** Appeler `useChangerSurcouche()` a vrai a l'ouverture et a
   faux au nettoyage, pour que la pagination se suspende.
4. **L'historique.** `history.pushState` a l'ouverture. Un ecouteur `popstate`
   appelle `surFermeture`. La fermeture par Echap, par le bouton ou par le clic
   hors de la feuille appelle `history.back()` **puis** `surFermeture`, pour que
   l'entree soit consommee.
5. **Echap.** Le `<dialog>` emet `cancel` : l'intercepter, appeler
   `preventDefault` pour garder la main, puis suivre le chemin de fermeture du
   point 4, sinon l'entree d'historique resterait.
6. **Le nom accessible.** `aria-labelledby` vers l'identifiant du titre rendu
   dans la feuille.
7. **Le bouton de fermeture** porte `data-fermer`, un nom accessible par
   `t("parcours.fermerParchemin")`, et non une croix seule.
8. **Le corps** porte `data-defilement-propre` et `className="parchemin-corps"`.
9. **Les deux bandes** sont des `<svg className="parchemin-bande">` en haut et en
   bas de la feuille, avec un trace courbe. Celle du bas est le trace du haut
   retourne, par un `transform` **dans l'attribut SVG** et non en CSS : la regle
   CSS ne doit porter aucun `transform`, le test de la tache 3 l'interdit.
10. **Les huit blocs** dans l'ordre de la section 4, pilotes par
    `blocsPresents(projet)`, et les credits par `credits(projet)`. Les photos
    portent `alt=""`. Les liens externes portent `target="_blank"` et
    `rel="noopener noreferrer"`. Chaque lien LinkedIn porte le nom de la
    personne comme texte visible.
11. **Aucun mouvement.** Aucune classe d'animation, aucun `transition-`.

- [ ] **Etape 5 : Lancer les tests, le typecheck et le lint**

Lancer : `npm run test -w frontend`, `npm run typecheck -w frontend`,
`npm run lint -w frontend`.
Attendu : tous les tests passent et le lint reste a **exactement un probleme**.

- [ ] **Etape 6 : Commit**

```bash
git add frontend/components/parcours/parchemin-projet.tsx \
        frontend/lib/parcours/parchemin-dom.test.ts frontend/lib/i18n
git commit -m "feat(parcours): le parchemin en dialogue, avec repli sans showModal"
```

---

## Task 5 : Le declencheur dans le journal

**Files:**
- Modify: `frontend/components/parcours/journal-projets.tsx`
- Modify: `frontend/app/globals.css`
- Test: `frontend/lib/parcours/journal.test.ts` (etendu)

**Interfaces:**
- Consomme : `ParcheminProjet` (tache 4)
- Produit : rien de nouveau

- [ ] **Etape 1 : Ecrire le test qui echoue**

Ajouter a `frontend/lib/parcours/journal.test.ts`, en employant le motif de
rendu deja en place dans ce fichier :

```ts
describe("le declencheur du parchemin (spec section 3)", () => {
  it("le titre porte un bouton, et reste un titre", () => {
    const html = rendreArticle({ name: "Mon projet" });
    const h = /<h3[^>]*>([\s\S]*?)<\/h3>/.exec(html);
    expect(h, "le titre n est plus un h3").not.toBeNull();
    expect(h![1]).toMatch(/<button[\s>]/);
  });

  // Categorique : c'est l'invariant d'accessibilite, pas une orthographe.
  it("le bouton du titre ne contient AUCUN element interactif", () => {
    const html = rendreArticle({
      name: "Mon projet", demoUrl: "https://exemple.test",
    });
    const b = /<button[^>]*>([\s\S]*?)<\/button>/.exec(html);
    expect(b).not.toBeNull();
    expect(b![1]).not.toMatch(/<a[\s>]|<button[\s>]|<input[\s>]|<select[\s>]/);
  });

  it("le lien de demonstration reste frere du bouton, pas son enfant", () => {
    const html = rendreArticle({ demoUrl: "https://exemple.test" });
    const finBouton = html.indexOf("</button>");
    expect(html.indexOf('href="https://exemple.test"')).toBeGreaterThan(finBouton);
  });

  it("la photo de tete est aussi un declencheur", () => {
    const html = rendreArticle({ photo1Path: "a.webp" }, true);
    const avant = html.slice(0, html.indexOf("<img"));
    expect(avant).toMatch(/<button[^>]*$/);
  });

  it("l article lui-meme n est pas cliquable", () => {
    const html = rendreArticle({ name: "Mon projet" });
    const art = /<article[^>]*>/.exec(html)![0];
    expect(art).not.toMatch(/onclick|role="button"|tabindex/i);
  });
});
```

Ajouter l'auxiliaire de rendu au meme fichier. `Article` est deja exporte par
`journal-projets.tsx`, et `projet()` ainsi que le fournisseur caste existent
deja en tete de `journal.test.ts` :

```ts
function rendreArticle(p: Partial<ProjectDto>, tete = false): string {
  return renderToStaticMarkup(
    createElement(
      Fournisseur,
      { defaultLocale: "fr" },
      createElement(Article, {
        projet: projet(p),
        tete,
        surOuverture: () => {},
      }),
    ),
  );
}
```

`Article` gagne donc la prop `surOuverture: (p: ProjectDto) => void` a l'etape
suivante : l'inscrire dans son type.

- [ ] **Etape 2 : Lancer le test pour le voir echouer**

Lancer : `npm run test -w frontend -- journal`
Attendu : ECHEC, le titre ne porte pas de bouton.

- [ ] **Etape 3 : Transformer le titre en declencheur**

Dans `journal-projets.tsx`, le titre devient :

```tsx
      <h3 className="journal-titre">
        <button
          type="button"
          className="journal-declencheur"
          title={t("projects.clickForDetails")}
          onClick={() => surOuverture(projet)}
        >
          {projet.name}
        </button>
      </h3>
```

Un bouton **dans** le titre, et non a sa place : le titre garde sa semantique de
titre, et le lien de demonstration reste frere du bouton. Ne jamais rendre
l'`<article>` cliquable : il contient deja un lien, et un bouton qui contient un
lien est un defaut d'accessibilite, pas un detail de balisage.

Pour le projet de tete, envelopper l'`<Image>` dans un bouton de meme action,
avec `aria-hidden="true"` sur ce second bouton puisque le titre porte deja le
nom accessible, afin de ne pas doubler l'annonce.

- [ ] **Etape 4 : Tenir l'etat du projet ouvert**

`JournalProjets` devient client s'il ne l'est pas, tient
`const [ouvert, setOuvert] = useState<ProjectDto | null>(null)`, passe
`surOuverture` aux articles, et rend
`<ParcheminProjet projet={ouvert} surFermeture={() => setOuvert(null)} />`.

- [ ] **Etape 5 : Styler le declencheur**

Dans `globals.css`, `@layer components` : `.journal-declencheur` remet le bouton
au style du titre, `background: none`, `border: 0`, `padding: 0`, `font:
inherit`, `color: inherit`, `text-align: start`, `cursor: pointer`. Un contour
de focus visible, selon le motif du site : `outline: 2px solid var(--accent)` et
`outline-offset: 3px` sur `:focus-visible`.

**Aucune transition, aucun soulignement qui bouge au survol.** Le site
n'autorise que deux mouvements et ils sont pris.

- [ ] **Etape 6 : Lancer la suite, le typecheck et le lint**

Lancer : `npm run test -w frontend`, `npm run typecheck -w frontend`,
`npm run lint -w frontend`, qui doit rester a **exactement un probleme**.

- [ ] **Etape 7 : Eprouver le garde d'accessibilite par mutation**

Mettre a la main l'`<article>` entier dans un bouton : le test « le bouton du
titre ne contient aucun element interactif » doit tomber. Remettre. Rapporter le
message obtenu.

- [ ] **Etape 8 : Commit**

```bash
git add frontend/components/parcours/journal-projets.tsx \
        frontend/app/globals.css frontend/lib/parcours/journal.test.ts
git commit -m "feat(parcours): le titre d un projet ouvre son parchemin"
```

---

## Ce que ce plan ne contient pas

Trois chantiers restent ouverts, dans l'ordre que le proprietaire choisira :

- **La section contact,** dernier morceau reste a l'idiome d'avant la refonte :
  texte centre, variantes `dark:` de Tailwind, et un vert code en dur hors
  palette.
- **L'ampoule et le menu sur les pages de blog.**
- **L'horizon marin.** Avertissement conserve : le toast de section est ancre en
  bas a droite, a 28 px du coin, exactement ou l'horizon doit venir.

Et un quatrieme : **la mise au pas des mouvements** sur le reste du site, soit
21 regles, 4 jeux d'images-cles et 10 fichiers.

**Et ce que personne ne peut verifier ici**, inscrit a la section 7.2 de la
spec : la capture du focus et son retour, Echap, l'inertie du reste de la page
au lecteur d'ecran, et la lecture du parchemin comme un parchemin. jsdom
n'implementant pas `showModal`, ces quatre points reviennent a l'oeil du
proprietaire.
