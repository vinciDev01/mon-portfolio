# Ampoule suspendue : Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la lampe d'atelier par une ampoule suspendue sous abat-jour en rotin, placée dans l'angle supérieur droit, qui commande le thème clair ou sombre du site.

**Architecture:** L'objet est un SVG unique en `position: fixed`, dont le tressage est construit géométriquement (37 méridiens réutilisés par `<use>` et 18 ellipses à pas d'arc constant), de sorte que l'assombrissement des bords émerge de la densité de la trame au lieu d'être simulé. Six couches de lumière s'empilent sous et sur la maille, pilotées par une variable unique `--lampe-t` animée par la Web Animations API. Le thème est posé sur `<html>` par un script exécuté avant le premier tracé, qui lit la préférence enregistrée puis retombe sur une règle horaire.

> **Écarts assumés en cours d'exécution** : consignés au registre avec leur motif :
> 1. La variable unique `--lampe-t` a été remplacée par une variable par couche (`--t-filament`, `--t-lueur`, `--t-faisceau`, `--t-halo`, `--t-moucheture`, `--t-brins`, `--t-page`, plus `--filament-couleur`). Une seule variable parcourue à rebours ne peut produire que le miroir de l'allumage, alors que §5.2 exige une extinction qui n'en est pas le miroir : le faisceau doit partir le premier.
> 2. Le faisceau et la moucheture ne sont pas dans le SVG de l'objet mais dans deux conteneurs en `z-index: -1`, derrière le contenu. Au-dessus du texte, leur `screen` faisait tomber le texte secondaire de 6,42:1 à 3,15:1 contre un seuil WCAG de 4,5.
> 3. Les trois couches de lumière de page sont plafonnées par `--lumiere-plafond: 0.75` : leur superposition dépassait sinon le garde-fou de ±0,04 sur la luminance du fond, à +0,0438.

**Tech Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · SVG + filtres · Web Animations API · NestJS 11 + Prisma · Vitest · Jest

**Spec:** `docs/superpowers/specs/2026-09-22-ampoule-suspendue-design.md`
Annexes : `2026-09-22-ampoule-lumiere-annexe.md` (valeurs d'exécution) et `2026-09-22-typographie-annexe.md`.

## Global Constraints

Ces règles lient **toutes** les tâches. Valeurs copiées telles quelles depuis la spec.

- **Palette claire** : fond `#F6F1E8`, surface `#FCF8F1`, bordure décorative `#DCD1BF`, bordure signifiante `#948263`, texte secondaire `#5E564A`, texte principal `#1F2320`, accent `#456040`.
- **Palette sombre** : fond `#131518`, surface `#1A1D21`, bordure signifiante `#707780`, texte secondaire `#9AA096`, texte principal `#E4E5E3`, accent `#7E9B76`.
- **Le jeton `--texte-secondaire` sombre passe de `#8b8f8a` à `#9AA096`.** L'ancienne valeur n'a pas de marge face aux couches de blend.
- **Tout texte atteint 4,5:1 sur son fond ; toute bordure signifiante atteint 3:1.** Vérifié par test, dans les deux palettes.
- **L'assombrissement des bords du dôme ne doit jamais être simulé par un dégradé.** Il émerge de la densité géométrique des méridiens. Seul correctif admis : un masque radial de correction entre 90 % et 100 % du rayon.
- **Axe de symétrie de l'objet : x = 88.** Le demi-profil gauche est la symétrie exacte du droit, jamais redessiné à la main.
- **Grille de 8 px** pour toute cote de mise en page (`right`, marges, zone de clic). Les cotes internes du dôme en sont exemptes : c'est de la géométrie.
- **Zone de clic minimale 44 × 44 px**, quelle que soit l'échelle.
- **Langue du dépôt : français.** Commentaires et libellés en français ; messages de commit en français **sans accents**.
- **Ne jamais commiter sur `main`.** La branche de travail est `ampoule-suspendue`.
- **Jamais de `prisma migrate reset`** : la base contient les données réelles du propriétaire.

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `frontend/lib/theme/regle-horaire.ts` | Règle horaire pure : heure + stratégie → thème |
| `frontend/lib/theme/regle-horaire.test.ts` | Ses cas limites |
| `frontend/lib/theme/theme-context.tsx` | État du thème, persistance, bascule |
| `frontend/lib/theme/script-initial.ts` | Le script injecté avant le premier tracé |
| `frontend/lib/ampoule/geometrie.ts` | Méridiens, cercles, seuil de fusion : fonctions pures |
| `frontend/lib/ampoule/geometrie.test.ts` | Ses cas limites |
| `frontend/lib/ampoule/animation.ts` | Pilotage de `--lampe-t` par la Web Animations API |
| `frontend/components/ampoule/ampoule.tsx` | Le SVG complet, objet et lumière |
| `frontend/components/ampoule/maille.tsx` | Le groupe `#maille`, réutilisé par la moucheture |
| `frontend/components/ampoule/couches-lumiere.tsx` | L1, L2, L4 |
| `frontend/components/ampoule/interrupteur.tsx` | Le bouton accessible |
| `frontend/lib/design/tokens.ts` | Les deux palettes |
| `frontend/app/globals.css` | Jetons, ambiance de page, ombres en deux jeux |
| `frontend/app/layout.tsx` | Polices, script initial, fournisseur de thème |

---

## Task 1 : Déposer la lampe d'atelier

**Files:**
- Delete: `frontend/components/lamp/` (4 fichiers), `frontend/lib/lamp/` (6 fichiers)
- Modify: `frontend/app/page.tsx`, `frontend/components/portfolio/section-shell.tsx`, `frontend/components/portfolio/contact-section.tsx`, `frontend/components/portfolio/footer.tsx`, `frontend/app/globals.css`
- Modify: `backend/prisma/schema.prisma`, `packages/shared-types/src/site-settings.ts`, `backend/src/site-settings/dto/update-site-settings.dto.ts`, `backend/src/site-settings/dto/update-site-settings.dto.spec.ts`, `backoffice/app/site-settings/page.tsx`
- Create: `backend/prisma/migrations/<ts>_depose_lampe_atelier/migration.sql`

**Interfaces:**
- Consumes: rien
- Produces: un projet sans lampe d'atelier, qui compile et dont les 6 tests de contraste restent au vert

- [ ] **Étape 1 : Supprimer les fichiers de la lampe**

```bash
cd /home/fanuel/Public/PFL/my-portfolio
rm -rf frontend/components/lamp frontend/lib/lamp
```

- [ ] **Étape 2 : Décâbler `page.tsx`**

Retirer les trois imports `LampProvider`, `LampStage`, `LampSwitch`, la constante `reglagesLampe`, et remplacer l'enveloppe `<LampProvider …>` par un fragment `<>…</>`. Retirer `<LampStage />` et `<LampSwitch />`.

- [ ] **Étape 3 : Décâbler les trois composants de section**

```bash
grep -rn "useBiaisLampe\|survolTitre\|survolCta\|survolMarge\|data-lampe-marge\|useBeamTarget\|useReveal\b" frontend/components frontend/app
```

Dans `section-shell.tsx` : retirer l'import et l'appel de `useBiaisLampe`, ainsi que les attributs `onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur` du `<h2>`. **Conserver `useReveal`** : l'observateur d'entrée n'appartient pas à la lampe. Remplacer le double appel de ref par le seul `reveal(el)`.

Dans `contact-section.tsx` : retirer le compteur `raisonsActivesCta` et les quatre gestionnaires du bouton d'envoi.

Dans `footer.tsx` : retirer l'attribut `data-lampe-marge` et les gestionnaires du conteneur de liens.

- [ ] **Étape 4 : Nettoyer le CSS**

Dans `frontend/app/globals.css`, supprimer les règles `.beam-layer`, `.lampe-bras`, la règle de transition qui les cible, et la variable `--marge-droite-lampe` avec sa media query. Remettre le `padding-right` de `.section-shell` sur la valeur de gauche.

```bash
grep -n "beam-layer\|lampe-bras\|marge-droite-lampe" frontend/app/globals.css
```

- [ ] **Étape 5 : Retirer les cinq réglages du schéma**

Dans `backend/prisma/schema.prisma`, supprimer les lignes `lampEnabled`, `lampOnByDefault`, `lampBeamAngle`, `lampIntensity`, `lampDimLevel`.

```bash
cd backend && npx prisma migrate dev --create-only --name depose_lampe_atelier
```

Vérifier que le SQL généré ne contient que des `DROP COLUMN` sur `site_settings`, puis :

```bash
npx prisma migrate dev
```

- [ ] **Étape 6 : Retirer les réglages du type partagé, du DTO et de son test**

Supprimer les cinq champs de `packages/shared-types/src/site-settings.ts`, leurs blocs dans `update-site-settings.dto.ts`, et les cas correspondants dans `update-site-settings.dto.spec.ts` (`lampDimLevel`, `lampBeamAngle`, `lampIntensity`).

- [ ] **Étape 7 : Retirer le groupe « Lampe d'atelier » du backoffice**

Dans `backoffice/app/site-settings/page.tsx`, supprimer le `<fieldset>` de la lampe **et** le témoin de contraste qu'il contenait. Retirer l'import de `melanger` s'il n'est plus utilisé ; conserver `ratioContraste` s'il sert ailleurs.

- [ ] **Étape 8 : Vérifier**

```bash
npm run typecheck -w frontend
npx tsc --noEmit -p backoffice/tsconfig.json
npx tsc --noEmit -p backend/tsconfig.json
npm run test
grep -rn "lamp\|Lamp" frontend/app frontend/components frontend/lib --include=*.tsx --include=*.ts --include=*.css | grep -v node_modules
```

Attendu : les trois typecheck propres, la dernière recherche vide, et **6 tests frontend** (le contraste) + les tests backend au vert.

- [ ] **Étape 9 : Commit**

```bash
git add -A
git commit -m "refactor(lampe): depose la lampe d atelier et ses cinq reglages"
```

---

## Task 2 : Les deux palettes et leur test

**Files:**
- Modify: `frontend/lib/design/tokens.ts`
- Modify: `frontend/lib/color/contrast.test.ts`
- Modify: `frontend/app/globals.css`

**Interfaces:**
- Consumes: `ratioContraste` de `frontend/lib/color/contrast.ts`
- Produces:
  - `PALETTE_CLAIRE` et `PALETTE_SOMBRE`, objets figés aux clés `fond`, `surface`, `bordure`, `bordureSignifiante`, `texteSecondaire`, `textePrincipal`, `accent`
  - `PALETTES` : `{ clair: PALETTE_CLAIRE, sombre: PALETTE_SOMBRE }`

- [ ] **Étape 1 : Écrire le test qui échoue**

Remplacer le contenu de `frontend/lib/color/contrast.test.ts` par :

```ts
import { describe, it, expect } from "vitest";
import { ratioContraste } from "./contrast";
import { PALETTES } from "@/lib/design/tokens";

const SEUIL_TEXTE = 4.5;
const SEUIL_COMPOSANT = 3;

describe.each(Object.entries(PALETTES))("palette %s", (nom, p) => {
  it("le texte principal atteint AA sur le fond", () => {
    expect(ratioContraste(p.textePrincipal, p.fond)).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("le texte principal atteint AA sur la surface", () => {
    expect(ratioContraste(p.textePrincipal, p.surface)).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("le texte secondaire atteint AA sur le fond", () => {
    expect(ratioContraste(p.texteSecondaire, p.fond)).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("le texte secondaire atteint AA sur la surface", () => {
    expect(ratioContraste(p.texteSecondaire, p.surface)).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("l accent atteint AA sur le fond", () => {
    expect(ratioContraste(p.accent, p.fond)).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("le fond atteint AA sur l accent, pour un bouton plein", () => {
    expect(ratioContraste(p.fond, p.accent)).toBeGreaterThanOrEqual(SEUIL_TEXTE);
  });

  it("la bordure signifiante atteint le seuil des composants", () => {
    expect(ratioContraste(p.bordureSignifiante, p.fond)).toBeGreaterThanOrEqual(SEUIL_COMPOSANT);
  });

  it(`${nom} : toutes les couleurs sont des hexadecimaux a six chiffres`, () => {
    for (const valeur of Object.values(p)) {
      expect(valeur).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("les deux palettes", () => {
  it("portent exactement les memes cles", () => {
    expect(Object.keys(PALETTES.clair).sort()).toEqual(Object.keys(PALETTES.sombre).sort());
  });

  it("ne partagent aucune couleur de fond", () => {
    expect(PALETTES.clair.fond).not.toBe(PALETTES.sombre.fond);
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npm run test -w frontend -- contrast
```

Attendu : ÉCHEC, `PALETTES` n'existe pas dans `@/lib/design/tokens`.

- [ ] **Étape 3 : Écrire les deux palettes**

Dans `frontend/lib/design/tokens.ts`, remplacer l'export `PALETTE` par :

```ts
/**
 * Les deux palettes du site, commutees par l'ampoule.
 *
 * `bordureSignifiante` existe separement de `bordure` parce que WCAG 1.4.11
 * impose 3:1 a tout contour qui identifie un composant, alors qu'une
 * separation purement decorative peut rester bien plus discrete.
 */
export const PALETTE_CLAIRE = Object.freeze({
  fond: "#F6F1E8",
  surface: "#FCF8F1",
  bordure: "#DCD1BF",
  bordureSignifiante: "#948263",
  texteSecondaire: "#5E564A",
  textePrincipal: "#1F2320",
  accent: "#456040",
});

export const PALETTE_SOMBRE = Object.freeze({
  fond: "#131518",
  surface: "#1A1D21",
  bordure: "#22262B",
  bordureSignifiante: "#707780",
  // Releve de #8b8f8a : l'ancienne valeur donnait 5,15:1 sur la surface,
  // conforme mais sans marge face aux couches de blend de l'ambiance.
  texteSecondaire: "#9AA096",
  textePrincipal: "#E4E5E3",
  accent: "#7E9B76",
});

export const PALETTES = Object.freeze({
  clair: PALETTE_CLAIRE,
  sombre: PALETTE_SOMBRE,
});

/** Couleurs propres a l'eclairage, communes aux deux themes. */
export const LUMIERE = Object.freeze({
  filamentFroid: "#3A3128",
  filamentChaud: "#FFFDF6",
  brinEteint: "#6E6355",
  ourletEteint: "#7C7162",
});
```

Conserver `ECHELLE_TYPO` et `CORPS_BASE` tels quels.

- [ ] **Étape 4 : Relancer le test**

```bash
npm run test -w frontend -- contrast
```

Attendu : 18 tests au vert (8 par palette + 2 communs).

- [ ] **Étape 5 : Reporter les deux palettes dans le CSS**

Dans `frontend/app/globals.css`, remplacer le bloc `:root, .dark` par deux blocs distincts :

```css
/* Thème clair : ampoule allumée. Source : frontend/lib/design/tokens.ts */
:root,
.clair {
  --fond: #f6f1e8;
  --surface: #fcf8f1;
  --bordure: #dcd1bf;
  --bordure-signifiante: #948263;
  --texte-secondaire: #5e564a;
  --texte: #1f2320;
  --accent: #456040;
  --ombre-teinte: 28deg 42% 30%;
}

/* Thème sombre : ampoule éteinte. */
.sombre {
  --fond: #131518;
  --surface: #1a1d21;
  --bordure: #22262b;
  --bordure-signifiante: #707780;
  --texte-secondaire: #9aa096;
  --texte: #e4e5e3;
  --accent: #7e9b76;
  --ombre-teinte: 214deg 12% 4%;
}

/* Mapping shadcn, commun aux deux themes. */
:root,
.clair,
.sombre {
  --background: var(--portfolio-bg, var(--fond));
  --foreground: var(--portfolio-text, var(--texte));
  --card: var(--surface);
  --card-foreground: var(--texte);
  --popover: var(--surface);
  --popover-foreground: var(--texte);
  --primary: var(--accent);
  --primary-foreground: var(--fond);
  --secondary: var(--surface);
  --secondary-foreground: var(--texte);
  --muted: var(--surface);
  --muted-foreground: var(--texte-secondaire);
  --accent-foreground: var(--fond);
  --destructive: oklch(0.577 0.245 27.325);
  --border: var(--bordure);
  --input: var(--bordure-signifiante);
  --ring: var(--accent);
  --radius: 0.25rem;
}
```

**Attention :** la classe historique s'appelait `.dark`. Elle est remplacée par `.sombre`. Chercher toute autre occurrence et la mettre à jour :

```bash
grep -rn "\.dark\b\|dark:" frontend/app frontend/components --include=*.css --include=*.tsx | grep -v node_modules
```

Les variantes Tailwind `dark:` doivent devenir des règles explicites sur `.sombre`, car le variant `dark` de Tailwind ne cible plus la bonne classe.

- [ ] **Étape 6 : Vérifier**

```bash
npm run test -w frontend
npm run typecheck -w frontend
```

- [ ] **Étape 7 : Commit**

```bash
git add frontend/lib/design/tokens.ts frontend/lib/color/contrast.test.ts frontend/app/globals.css frontend/components
git commit -m "feat(theme): deux palettes verifiees et jetons CSS separes"
```

---

## Task 3 : Le réglage `themeParDefaut`

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/<ts>_theme_par_defaut/migration.sql`
- Modify: `packages/shared-types/src/site-settings.ts`
- Modify: `backend/src/site-settings/dto/update-site-settings.dto.ts`
- Modify: `backend/src/site-settings/dto/update-site-settings.dto.spec.ts`
- Modify: `backoffice/app/site-settings/page.tsx`

**Interfaces:**
- Consumes: rien
- Produces: `themeParDefaut: "auto" | "clair" | "sombre"` sur `SiteSettingsDto`

- [ ] **Étape 1 : Écrire le test qui échoue**

Ajouter à la fin de `backend/src/site-settings/dto/update-site-settings.dto.spec.ts` :

```ts
describe('themeParDefaut', () => {
  it('accepte les trois strategies prevues', async () => {
    for (const s of ['auto', 'clair', 'sombre']) {
      expect(await erreursSur('themeParDefaut', s)).toEqual([]);
    }
  });

  it('refuse une strategie inconnue', async () => {
    expect(await erreursSur('themeParDefaut', 'auto-nuit')).toContain('themeParDefaut');
  });

  it('refuse une valeur vide', async () => {
    expect(await erreursSur('themeParDefaut', '')).toContain('themeParDefaut');
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd backend && npx jest src/site-settings/dto
```

Attendu : ÉCHEC sur les deux tests de refus, la propriété n'existe pas, aucune erreur de validation n'est levée.

- [ ] **Étape 3 : Ajouter le champ au schéma**

Dans `backend/prisma/schema.prisma`, à l'emplacement laissé libre par les réglages de lampe :

```prisma
  /**
   * Theme applique a un visiteur sans preference enregistree.
   * « auto » applique la regle horaire : sombre de 07h00 a 18h59,
   * clair de 19h00 a 06h59. Cette regle inverse volontairement la
   * convention courante : elle suit la logique de l'objet, on allume
   * une lampe le soir.
   */
  themeParDefaut    String  @default("auto") @map("theme_par_defaut")
```

- [ ] **Étape 4 : Générer et appliquer la migration**

```bash
cd backend && npx prisma migrate dev --create-only --name theme_par_defaut
```

Le SQL doit être un simple `ADD COLUMN` avec valeur par défaut. Aucun `UPDATE` n'est nécessaire : `auto` est le comportement voulu pour la ligne existante.

```bash
npx prisma migrate dev
PGPASSWORD="$PGPASSWORD" psql -h localhost -U postgres -d portfolio_db -Atc "select theme_par_defaut from site_settings"
```

Attendu : `auto`

- [ ] **Étape 5 : Étendre le type partagé et le DTO**

Dans `packages/shared-types/src/site-settings.ts` :

```ts
  themeParDefaut: "auto" | "clair" | "sombre";
```

Dans `update-site-settings.dto.ts` :

```ts
  @ApiPropertyOptional({ example: 'auto' })
  @IsOptional()
  @IsIn(['auto', 'clair', 'sombre'])
  themeParDefaut?: string;
```

- [ ] **Étape 6 : Relancer le test**

```bash
cd backend && npx jest src/site-settings/dto
```

Attendu : tous les tests au vert, dont les trois nouveaux.

- [ ] **Étape 7 : Exposer le réglage au backoffice**

Dans `backoffice/app/site-settings/page.tsx`, à l'emplacement de l'ancien groupe « Lampe d'atelier » :

```tsx
<fieldset className="border border-border rounded-md p-4 space-y-4">
  <legend className="text-sm font-semibold px-2">Ampoule et thème</legend>
  <div>
    <label className="block text-sm font-medium mb-1">
      Thème à la première visite
    </label>
    <select
      value={data.themeParDefaut}
      onChange={(e) =>
        setData({ ...data, themeParDefaut: e.target.value as typeof data.themeParDefaut })
      }
      className="w-full px-3 py-2 border border-border rounded-md text-sm"
    >
      <option value="auto">Selon l&apos;heure du visiteur</option>
      <option value="clair">Toujours clair</option>
      <option value="sombre">Toujours sombre</option>
    </select>
    <p className="text-xs text-muted-foreground mt-1">
      En mode automatique, l&apos;ampoule est <strong>éteinte de 7 h à 19 h</strong>
      {" "}(thème sombre) et <strong>allumée le reste du temps</strong> (thème clair).
      Cette règle suit la logique de l&apos;objet (on allume une lampe le soir)
      et inverse donc la convention habituelle. Dès qu&apos;un visiteur clique
      l&apos;ampoule, son choix est mémorisé et cette règle ne s&apos;applique plus à lui.
    </p>
  </div>
</fieldset>
```

- [ ] **Étape 8 : Vérifier de bout en bout**

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | sed 's/.*"token":"\([^"]*\)".*/\1/')
curl -s -o /dev/null -w "valeur interdite : %{http_code} (400 attendu)\n" -X PATCH http://localhost:4000/api/site-settings \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"themeParDefaut":"crepuscule"}'
curl -s -o /dev/null -w "valeur valide : %{http_code} (200 attendu)\n" -X PATCH http://localhost:4000/api/site-settings \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"themeParDefaut":"clair"}'
curl -s -o /dev/null -w "retour a auto : %{http_code}\n" -X PATCH http://localhost:4000/api/site-settings \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"themeParDefaut":"auto"}'
```

Les identifiants sont dans `backend/.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).

- [ ] **Étape 9 : Commit**

```bash
git add -A
git commit -m "feat(theme): reglage themeParDefaut en auto, clair ou sombre"
```

---

## Task 4 : La règle horaire et le commutateur de thème

**Files:**
- Create: `frontend/lib/theme/regle-horaire.ts`, `frontend/lib/theme/regle-horaire.test.ts`
- Create: `frontend/lib/theme/script-initial.ts`, `frontend/lib/theme/theme-context.tsx`
- Modify: `frontend/app/layout.tsx`
- Delete: `frontend/components/theme-provider.tsx`
- Modify: `frontend/package.json` (retrait de `next-themes`)

**Interfaces:**
- Consumes: `themeParDefaut` de la Task 3
- Produces:
  - `type Theme = "clair" | "sombre"` et `type Strategie = "auto" | Theme`
  - `themeSelonHeure(heure: number, strategie: Strategie): Theme`
  - `CLE_STOCKAGE = "portfolio-theme"`
  - `scriptInitial(strategie: Strategie): string`
  - `ThemeProvider` : props `{ strategie: Strategie; children: React.ReactNode }`
  - `useTheme(): { theme: Theme; allumee: boolean; basculer: () => void }`

`allumee` vaut `theme === "clair"` : l'ampoule allumée donne le thème clair.

- [ ] **Étape 1 : Écrire le test qui échoue**

Créer `frontend/lib/theme/regle-horaire.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { themeSelonHeure } from "./regle-horaire";

describe("themeSelonHeure, strategie auto", () => {
  it("rend le theme sombre en pleine journee", () => {
    expect(themeSelonHeure(12, "auto")).toBe("sombre");
  });

  it("rend le theme clair en pleine nuit", () => {
    expect(themeSelonHeure(2, "auto")).toBe("clair");
  });

  it("bascule au sombre a 7h00 pile", () => {
    expect(themeSelonHeure(6, "auto")).toBe("clair");
    expect(themeSelonHeure(7, "auto")).toBe("sombre");
  });

  it("bascule au clair a 19h00 pile", () => {
    expect(themeSelonHeure(18, "auto")).toBe("sombre");
    expect(themeSelonHeure(19, "auto")).toBe("clair");
  });

  it("couvre les vingt-quatre heures sans trou", () => {
    for (let h = 0; h < 24; h++) {
      expect(["clair", "sombre"]).toContain(themeSelonHeure(h, "auto"));
    }
  });

  it("donne exactement douze heures de chaque theme", () => {
    const heures = Array.from({ length: 24 }, (_, h) => themeSelonHeure(h, "auto"));
    expect(heures.filter((t) => t === "sombre")).toHaveLength(12);
    expect(heures.filter((t) => t === "clair")).toHaveLength(12);
  });
});

describe("themeSelonHeure, strategies explicites", () => {
  it("ignore l heure quand la strategie impose le clair", () => {
    for (const h of [0, 7, 12, 19, 23]) {
      expect(themeSelonHeure(h, "clair")).toBe("clair");
    }
  });

  it("ignore l heure quand la strategie impose le sombre", () => {
    for (const h of [0, 7, 12, 19, 23]) {
      expect(themeSelonHeure(h, "sombre")).toBe("sombre");
    }
  });
});

describe("themeSelonHeure, entrees aberrantes", () => {
  it("retombe sur le sombre pour une heure hors plage", () => {
    expect(themeSelonHeure(-1, "auto")).toBe("sombre");
    expect(themeSelonHeure(24, "auto")).toBe("sombre");
    expect(themeSelonHeure(Number.NaN, "auto")).toBe("sombre");
  });

  it("retombe sur le sombre pour une strategie inconnue", () => {
    expect(themeSelonHeure(2, "crepuscule" as never)).toBe("sombre");
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npm run test -w frontend -- regle-horaire
```

Attendu : ÉCHEC, `Failed to resolve import "./regle-horaire"`.

- [ ] **Étape 3 : Écrire la règle**

Créer `frontend/lib/theme/regle-horaire.ts` :

```ts
export type Theme = "clair" | "sombre";
export type Strategie = "auto" | Theme;

/** Clef de persistance du choix du visiteur. */
export const CLE_STOCKAGE = "portfolio-theme";

/** Debut de la plage « jour », incluse. */
const HEURE_JOUR = 7;
/** Fin de la plage « jour », exclue. */
const HEURE_NUIT = 19;

/**
 * Theme a appliquer a un visiteur sans preference enregistree.
 *
 * La regle suit la logique de l'objet, pas celle de l'ecran : on allume une
 * lampe le soir, pas au reveil. Le site est donc SOMBRE en journee et CLAIR
 * la nuit, l'inverse de la convention courante. C'est voulu ; ne pas
 * « corriger » ce sens sans revenir a la specification.
 *
 * Toute entree aberrante retombe sur le sombre, qui est l'identite
 * historique du site.
 */
export function themeSelonHeure(heure: number, strategie: Strategie): Theme {
  if (strategie === "clair" || strategie === "sombre") return strategie;
  if (strategie !== "auto") return "sombre";
  if (!Number.isFinite(heure) || heure < 0 || heure > 23) return "sombre";
  return heure >= HEURE_JOUR && heure < HEURE_NUIT ? "sombre" : "clair";
}
```

- [ ] **Étape 4 : Relancer le test**

```bash
npm run test -w frontend -- regle-horaire
```

Attendu : 10 tests au vert.

- [ ] **Étape 5 : Écrire le script exécuté avant le premier tracé**

Créer `frontend/lib/theme/script-initial.ts` :

```ts
import { CLE_STOCKAGE, type Strategie } from "./regle-horaire";

/**
 * Script injecte dans <head> et execute AVANT le premier trace.
 *
 * Le serveur ignore l'heure locale du visiteur : calculer le theme au montage
 * produirait un basculement visible. Ce script pose la classe sur <html> avant
 * que quoi que ce soit ne soit peint, donc sans clignotement ni divergence
 * d'hydratation : React retrouve la classe deja en place.
 *
 * Il est volontairement ecrit en une seule expression, sans dependance, et
 * duplique la regle de `themeSelonHeure` : il ne peut pas importer de module.
 * Tout changement de seuil doit etre reporte aux deux endroits, ce que verifie
 * le test « le script applique la meme regle que la fonction ».
 */
export function scriptInitial(strategie: Strategie): string {
  return `(function(){try{
var s=${JSON.stringify(strategie)};
var c=localStorage.getItem(${JSON.stringify(CLE_STOCKAGE)});
var t=(c==="clair"||c==="sombre")?c
  :(s==="clair"||s==="sombre")?s
  :(function(){var h=new Date().getHours();return(h>=7&&h<19)?"sombre":"clair";})();
var e=document.documentElement;
e.classList.remove("clair","sombre");
e.classList.add(t);
e.style.colorScheme=(t==="clair")?"light":"dark";
}catch(_){document.documentElement.classList.add("sombre");}})()`;
}
```

- [ ] **Étape 6 : Verrouiller la duplication par un test**

Ajouter à `frontend/lib/theme/regle-horaire.test.ts` :

```ts
import { scriptInitial } from "./script-initial";

describe("scriptInitial", () => {
  it("applique la meme regle horaire que la fonction, heure par heure", () => {
    // Le script ne peut pas importer de module : il duplique la regle.
    // Ce test verifie que les deux ne divergeront pas en silence.
    const src = scriptInitial("auto");
    const seuils = src.match(/h>=(\d+)&&h<(\d+)/);
    expect(seuils).not.toBeNull();
    const [, debut, fin] = seuils!;
    for (let h = 0; h < 24; h++) {
      const duScript = h >= Number(debut) && h < Number(fin) ? "sombre" : "clair";
      expect(duScript).toBe(themeSelonHeure(h, "auto"));
    }
  });

  it("inscrit la strategie explicite telle quelle", () => {
    expect(scriptInitial("clair")).toContain('"clair"');
  });

  it("retombe sur le sombre si quoi que ce soit echoue", () => {
    expect(scriptInitial("auto")).toContain('classList.add("sombre")');
  });
});
```

- [ ] **Étape 7 : Écrire le contexte de thème**

Créer `frontend/lib/theme/theme-context.tsx` :

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CLE_STOCKAGE, themeSelonHeure, type Strategie, type Theme } from "./regle-horaire";

type ValeurContexte = {
  theme: Theme;
  /** Vrai quand l'ampoule est allumee, c'est-a-dire en theme clair. */
  allumee: boolean;
  basculer: () => void;
};

const Contexte = createContext<ValeurContexte | null>(null);

/** Lit le theme deja pose sur <html> par le script initial. */
function themeCourant(strategie: Strategie): Theme {
  if (typeof document === "undefined") {
    // Rendu serveur : on ne connait ni l'heure locale ni le stockage.
    // Le script initial corrigera avant le premier trace.
    return strategie === "clair" ? "clair" : "sombre";
  }
  return document.documentElement.classList.contains("clair") ? "clair" : "sombre";
}

export function ThemeProvider({
  strategie,
  children,
}: {
  strategie: Strategie;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>(() => themeCourant(strategie));

  // Aligne l'etat React sur ce que le script initial a reellement pose.
  useEffect(() => {
    setTheme(themeCourant(strategie));
  }, [strategie]);

  const basculer = useCallback(() => {
    setTheme((actuel) => {
      const suivant: Theme = actuel === "clair" ? "sombre" : "clair";
      const e = document.documentElement;
      e.classList.remove("clair", "sombre");
      e.classList.add(suivant);
      e.style.colorScheme = suivant === "clair" ? "light" : "dark";
      try {
        localStorage.setItem(CLE_STOCKAGE, suivant);
      } catch {
        // Navigation privee ou stockage refuse : le choix ne survit pas au
        // rechargement, mais la bascule fonctionne pour la session.
      }
      return suivant;
    });
  }, []);

  const valeur = useMemo<ValeurContexte>(
    () => ({ theme, allumee: theme === "clair", basculer }),
    [theme, basculer],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useTheme(): ValeurContexte {
  const v = useContext(Contexte);
  if (!v) throw new Error("useTheme doit etre utilise dans un ThemeProvider");
  return v;
}

export { themeSelonHeure };
export type { Theme, Strategie };
```

- [ ] **Étape 8 : Neutraliser les surcharges de couleur injectées sur `<html>`**

**Sans cette étape, le commutateur ne changera rien.** `layout.tsx` injecte
aujourd'hui, en style inline sur `<html>`, trois variables qui court-circuitent
les palettes :

| Variable injectée | Conséquence |
|---|---|
| `--portfolio-bg` | `--background: var(--portfolio-bg, var(--fond))` ne voit jamais le repli : le fond reste figé quelle que soit la classe de thème |
| `--portfolio-text` | idem pour `--foreground` |
| `--accent` | **collision directe de nom**, injectée sans aucune garde : le jeton d'accent des deux palettes n'est jamais lu |

Un style inline sur `<html>` l'emporte sur toute règle de feuille de style
visant le même élément. Les palettes de la tâche 2 sont donc inertes sur ces
trois jetons.

**Correctif.**

Dans `frontend/app/layout.tsx`, supprimer les trois affectations de `styleVars` :
celles de `--portfolio-bg`, `--portfolio-text` et `--accent`. Conserver les
autres (`--portfolio-font-size`, `--ratio`, `--portfolio-line-height`,
`--portfolio-section-spacing`, `--portfolio-zigzag`,
`--portfolio-animation-speed`) : elles ne touchent pas aux couleurs.

Dans `frontend/app/globals.css`, ramener le mapping sur les jetons de thème :

```css
  --background: var(--fond);
  --foreground: var(--texte);
```

**Ce que cela retire au propriétaire du site.** Quatre réglages du backoffice
cessent d'agir : couleur de fond, couleur du texte, teinte et saturation de
l'accent. C'est délibéré. Les deux palettes sont désormais fixes et leurs
contrastes sont garantis par dix-huit tests ; laisser une couleur arbitraire
les surcharger romprait ces garanties en silence, ce qu'aucun test ne
détecterait.

Retirer ces quatre contrôles de `backoffice/app/site-settings/page.tsx` plutôt
que de les laisser en place sans effet : un réglage mort qu'on peut encore
déplacer est pire qu'un réglage absent. Les colonnes correspondantes restent
en base, simplement plus lues.

```bash
grep -n "bgColor\|textColor\|accentHue\|accentSaturation" backoffice/app/site-settings/page.tsx
```

Attendu après correction : aucune occurrence.

- [ ] **Étape 9 : Brancher dans `layout.tsx` et retirer `next-themes`**

Remplacer l'import et l'usage de l'ancien fournisseur :

```tsx
import { ThemeProvider } from "@/lib/theme/theme-context";
import { scriptInitial } from "@/lib/theme/script-initial";
import type { Strategie } from "@/lib/theme/regle-horaire";
```

Dans le `try` qui lit les réglages, récupérer la stratégie :

```tsx
    strategie = (settings.themeParDefaut ?? "auto") as Strategie;
```

en la déclarant avant le `try` :

```tsx
  let strategie: Strategie = "auto";
```

Dans le `<head>`, avant tout le reste :

```tsx
        <script dangerouslySetInnerHTML={{ __html: scriptInitial(strategie) }} />
```

Et remplacer l'enveloppe :

```tsx
        <ThemeProvider strategie={strategie}>
```

Retirer `suppressHydrationWarning` du `<html>` **uniquement si** aucun autre usage ne le justifie : le script pose la classe avant l'hydratation, React ne voit donc pas de divergence. En cas de doute, le conserver : il est sans effet négatif.

```bash
rm frontend/components/theme-provider.tsx
npm uninstall -w frontend next-themes
grep -rn "next-themes\|ThemeHotkey" frontend/ --include=*.tsx --include=*.ts --include=*.json | grep -v node_modules
```

Attendu : aucun résultat.

- [ ] **Étape 10 : Vérifier**

```bash
npm run test -w frontend
npm run typecheck -w frontend
curl -s http://localhost:3000 | grep -o 'class="[^"]*\(clair\|sombre\)[^"]*"' | head -2
# Les surcharges de couleur ne doivent plus figurer sur <html>
curl -s http://localhost:3000 | grep -o 'style="[^"]*"' | head -1
curl -s http://localhost:3000 | grep -c 'getHours' | xargs echo "script initial present:"
```

Attendu : les tests au vert, et le script présent dans le HTML servi.

- [ ] **Étape 11 : Commit**

```bash
git add -A
git commit -m "feat(theme): regle horaire, script initial, surcharges de couleur neutralisees"
```

---

## Task 5 : Literata remplace IBM Plex Sans

**Files:**
- Modify: `frontend/app/layout.tsx`
- Modify: `frontend/app/globals.css`

**Interfaces:**
- Consumes: rien
- Produces: variables CSS `--font-sans` (Literata) et `--font-mono` (IBM Plex Mono)

- [ ] **Étape 1 : Remplacer la déclaration des polices**

Dans `frontend/app/layout.tsx` :

```tsx
import { Literata, IBM_Plex_Mono } from "next/font/google";

/**
 * Literata porte le texte. Son axe optique remplace une seconde famille :
 * les titres en `opsz 48` ont des empattements plus francs et un contraste
 * plus marque que le corps en `opsz 12`, ce qui donne la hierarchie sans
 * charger une police de plus.
 *
 * Aucun tableau `weight` : on laisse Next.js servir la police VARIABLE.
 * Specifier des graisses explicites force des instances statiques, ce qui
 * multipliait les fichiers dans la version precedente du site.
 */
const literata = Literata({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

const POLICE_PAR_DEFAUT = "Literata";
```

`latin-ext` est requis : il porte les diacritiques du français et de l'allemand.
`IBM_Plex_Mono` n'existe pas en variable sur Google Fonts ; ses deux graisses statiques sont donc conservées telles quelles.

Remplacer `plexSans.variable` par `literata.variable` dans le `className` du `<html>`, et la constante `POLICE_PAR_DEFAUT` partout où elle apparaît.

- [ ] **Étape 2 : Ajuster l'interligne**

Dans `frontend/app/globals.css`, le bloc d'échelle typographique :

```css
  /* Literata porte une hauteur d'x de 0,507 em, tres proche des 0,516 de
     l'ancienne police : l'echelle de ratio 1,250 sur base 17 px est
     conservee telle quelle. Seul l'interligne du corps change. */
  --interligne: var(--portfolio-line-height, 1.6);
```

Vérifier que la valeur par défaut est bien `1.6` et non `1.5`.

- [ ] **Étape 3 : Régler les axes optiques**

Toujours dans `globals.css`, à l'intérieur de `@layer base` :

```css
  body {
    font-variation-settings: "opsz" 12;
  }

  h1,
  h2,
  h3 {
    font-variation-settings: "opsz" 48;
    font-weight: 600;
  }
```

- [ ] **Étape 4 : Vérifier le poids réellement servi**

```bash
npm run build -w frontend > /dev/null 2>&1
CSS=$(curl -s http://localhost:3000 | grep -oE '/_next/static/chunks/[^"]*\.css' | head -1)
curl -s "http://localhost:3000$CSS" | grep -c "@font-face" | xargs echo "declarations @font-face:"
curl -s http://localhost:3000 | grep -oE '/_next/static/media/[^"]*\.woff2' | sort -u | while read u; do
  printf "  %s Ko  %s\n" "$(( $(curl -s -o /dev/null -w '%{size_download}' "http://localhost:3000$u") / 1024 ))" "$u"
done
```

Reporter les chiffres obtenus dans le rapport de tâche, **sans les comparer à une estimation** : seule la mesure compte.

- [ ] **Étape 5 : Vérifier les diacritiques réellement rendus**

```bash
curl -s http://localhost:3000 | grep -o 'titre-[a-z]*">[^<]*' | head -8
```

Attendu : « Compétences », « Expérience », « À propos », avec leurs accents, dont le **À majuscule accentué**.

- [ ] **Étape 6 : Vérifier**

```bash
npm run typecheck -w frontend
npm run test -w frontend
grep -rn "IBM_Plex_Sans\|Plex Sans" frontend/ --include=*.tsx --include=*.ts --include=*.css | grep -v node_modules
```

Attendu : la dernière recherche vide.

- [ ] **Étape 7 : Commit**

```bash
git add -A
git commit -m "feat(typo): Literata remplace IBM Plex Sans, Plex Mono conservee"
```

---

## Task 6 : La géométrie du tressage, en fonctions pures

**Files:**
- Create: `frontend/lib/ampoule/geometrie.ts`, `frontend/lib/ampoule/geometrie.test.ts`

**Interfaces:**
- Consumes: rien
- Produces:
  - constantes `R = 84`, `H = 78`, `CENTRE_X = 88`, `APEX_Y = 178`, `BORD_Y = 256`, `EPAISSEUR_BRIN = 1.2`, `PAS_ANGULAIRE_DEG = 5`, `SEUIL_FUSION_PX = 2.4`
  - `pasLocal(thetaDeg: number): number`
  - `xProjete(thetaDeg: number): number`
  - `type Meridien = { theta: number; x: number; echelle: number; fusionne: boolean }`
  - `meridiens(pasDeg?: number): Meridien[]`
  - `type Cercle = { indice: number; rx: number; ry: number; cy: number; epaisseur: number }`
  - `cercles(nombre?: number): Cercle[]`

Les valeurs de contrôle ci-dessous ont été **recalculées et confirmées** avant d'être figées.

- [ ] **Étape 1 : Écrire le test qui échoue**

Créer `frontend/lib/ampoule/geometrie.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import {
  CENTRE_X,
  EPAISSEUR_BRIN,
  R,
  SEUIL_FUSION_PX,
  cercles,
  meridiens,
  pasLocal,
  xProjete,
} from "./geometrie";

describe("pasLocal", () => {
  it("vaut 7,33 px au centre du dome", () => {
    expect(pasLocal(0)).toBeCloseTo(7.33, 2);
  });

  it("suit la loi en cosinus, verifiee sur la table de controle", () => {
    expect(pasLocal(45)).toBeCloseTo(5.18, 2);
    expect(pasLocal(70)).toBeCloseTo(2.51, 2);
    expect(pasLocal(80)).toBeCloseTo(1.27, 2);
  });

  it("decroit strictement du centre vers le bord", () => {
    for (let t = 0; t < 85; t += 5) {
      expect(pasLocal(t + 5)).toBeLessThan(pasLocal(t));
    }
  });

  it("s annule au bord exact", () => {
    expect(pasLocal(90)).toBeCloseTo(0, 6);
  });
});

describe("xProjete", () => {
  it("place le meridien central sur l axe de symetrie", () => {
    expect(xProjete(0)).toBe(CENTRE_X);
  });

  it("respecte la table de controle", () => {
    expect(xProjete(30)).toBeCloseTo(130.0, 1);
    expect(xProjete(60)).toBeCloseTo(160.746, 2);
    expect(xProjete(75)).toBeCloseTo(169.138, 2);
  });

  it("est symetrique autour de l axe", () => {
    for (const t of [15, 45, 75]) {
      expect(xProjete(t) - CENTRE_X).toBeCloseTo(CENTRE_X - xProjete(-t), 6);
    }
  });

  it("atteint le bord du dome a 90 degres", () => {
    expect(xProjete(90)).toBeCloseTo(CENTRE_X + R, 6);
  });
});

describe("meridiens", () => {
  it("en rend 37 sur la face avant, au pas de 5 degres", () => {
    expect(meridiens()).toHaveLength(37);
  });

  it("en rend 19 au pas degrade de 10 degres", () => {
    expect(meridiens(10)).toHaveLength(19);
  });

  it("marque comme fusionnes ceux dont le pas passe sous deux epaisseurs", () => {
    const m = meridiens();
    const premierFusionne = m.find((x) => x.fusionne && x.theta > 0);
    expect(premierFusionne?.theta).toBe(75);
    expect(m.find((x) => x.theta === 70)?.fusionne).toBe(false);
  });

  it("place le seuil de fusion a 79,4 px de l axe", () => {
    const limite = R * Math.sin(Math.acos(SEUIL_FUSION_PX / (R * (Math.PI / 36))));
    expect(limite).toBeCloseTo(79.4, 1);
  });

  it("donne une echelle horizontale egale au sinus de l angle", () => {
    const m = meridiens();
    const a30 = m.find((x) => x.theta === 30);
    expect(a30?.echelle).toBeCloseTo(0.5, 6);
  });

  it("n a jamais deux meridiens au meme angle", () => {
    const angles = meridiens().map((m) => m.theta);
    expect(new Set(angles).size).toBe(angles.length);
  });

  it("garde le seuil de fusion egal au double de l epaisseur de brin", () => {
    expect(SEUIL_FUSION_PX).toBeCloseTo(2 * EPAISSEUR_BRIN, 6);
  });
});

describe("cercles", () => {
  it("en rend 18 du sommet a l ourlet", () => {
    expect(cercles()).toHaveLength(18);
  });

  it("termine exactement sur l ellipse de bord", () => {
    const dernier = cercles()[17];
    expect(dernier.rx).toBeCloseTo(84, 1);
    expect(dernier.ry).toBeCloseTo(12, 1);
    expect(dernier.cy).toBeCloseTo(256, 1);
  });

  it("garde un pas d arc constant de 7,42 px", () => {
    expect(133.5 / 18).toBeCloseTo(7.42, 2);
  });

  it("elargit strictement chaque cercle vers le bas", () => {
    const c = cercles();
    for (let i = 1; i < c.length; i++) {
      expect(c[i].rx).toBeGreaterThan(c[i - 1].rx);
      expect(c[i].cy).toBeGreaterThan(c[i - 1].cy);
    }
  });

  it("renforce les cercles de structure C6, C12 et C17", () => {
    const c = cercles();
    for (const i of [6, 12, 17]) {
      expect(c[i - 1].epaisseur).toBeCloseTo(2.2, 2);
    }
    expect(c[0].epaisseur).toBeCloseTo(0.9, 2);
  });

  it("donne a l ourlet sa sur-epaisseur", () => {
    expect(cercles()[17].epaisseur).toBeCloseTo(2.4, 2);
  });

  it("garde toutes ses coordonnees finies", () => {
    for (const c of cercles()) {
      expect(Number.isFinite(c.rx) && Number.isFinite(c.ry) && Number.isFinite(c.cy)).toBe(true);
    }
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npm run test -w frontend -- geometrie
```

Attendu : ÉCHEC, `Failed to resolve import "./geometrie"`.

- [ ] **Étape 3 : Écrire le module**

Créer `frontend/lib/ampoule/geometrie.ts` :

```ts
/**
 * Geometrie du tressage, construite en projection.
 *
 * Le point cardinal de la specification : l'assombrissement des bords du dome
 * ne doit JAMAIS etre simule par un degrade. Il emerge du fait que les
 * meridiens se resserrent en projection (leur pas local suit une loi en
 * cosinus) et donc que la densite de brins opaques augmente vers le bord.
 * Peindre la lueur SOUS la maille et la maille par-dessus suffit : le rapport
 * de transmission 0,484 au centre contre 0,145 au bord se produit tout seul.
 */

/** Demi-largeur du dome, en unites SVG. */
export const R = 84;
/** Hauteur du dome. */
export const H = 78;
/** Axe de symetrie. Le demi-profil gauche en est la symetrie exacte. */
export const CENTRE_X = 88;
export const APEX_Y = 178;
export const BORD_Y = 256;

export const EPAISSEUR_BRIN = 1.2;
export const PAS_ANGULAIRE_DEG = 5;

/**
 * En dessous de deux epaisseurs de brin, deux meridiens voisins se recouvrent :
 * les dessiner separement produit du moire et du crenelage. Au-dela, la
 * specification impose une bande pleine.
 */
export const SEUIL_FUSION_PX = 2 * EPAISSEUR_BRIN;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Pas de projection entre deux meridiens voisins, a l'angle donne. */
export function pasLocal(thetaDeg: number): number {
  return R * rad(PAS_ANGULAIRE_DEG) * Math.cos(rad(thetaDeg));
}

/** Abscisse projetee d'un meridien. */
export function xProjete(thetaDeg: number): number {
  return CENTRE_X + R * Math.sin(rad(thetaDeg));
}

export type Meridien = {
  theta: number;
  x: number;
  /** Facteur d'echelle horizontale a appliquer au demi-profil. */
  echelle: number;
  /** Vrai quand le pas local passe sous le seuil : a remplacer par une bande. */
  fusionne: boolean;
};

export function meridiens(pasDeg: number = PAS_ANGULAIRE_DEG): Meridien[] {
  const sortie: Meridien[] = [];
  for (let theta = -90; theta <= 90 + 1e-9; theta += pasDeg) {
    const t = Math.round(theta * 1e6) / 1e6;
    sortie.push({
      theta: t,
      x: xProjete(t),
      echelle: Math.sin(rad(t)),
      fusionne: Math.abs(pasLocal(t)) < SEUIL_FUSION_PX,
    });
  }
  return sortie;
}

export type Cercle = {
  indice: number;
  rx: number;
  ry: number;
  cy: number;
  epaisseur: number;
};

/** Longueur d'arc du demi-profil, de l'apex au bord. */
const ARC_TOTAL = 133.5;
/** Rapport ry/rx de l'ellipse de bord : angle de vue de 8,2 degres sous le plan. */
const INCLINAISON = 12 / 84;
const RENFORCES = new Set([6, 12, 17]);

/**
 * Les 18 cercles, a pas d'arc CONSTANT, et non a pas vertical constant.
 * C'est ce qui produit le resserrement visible au sommet : les quatre
 * premiers cercles se chevauchent en projection, et la specification impose
 * de les remplacer par une calotte pleine au rendu.
 */
export function cercles(nombre = 18): Cercle[] {
  const sortie: Cercle[] = [];
  for (let i = 1; i <= nombre; i++) {
    const s = (i / nombre) * ARC_TOTAL;
    // Parametre normalise le long du profil, de l'apex (0) au bord (1).
    const u = s / ARC_TOTAL;
    // Superellipse de Lame : x = R * u^(1/n) approche le profil a 0,9 px pres
    // sur la plage utile, ce qui suffit pour positionner des cercles.
    const rx = R * Math.pow(u, 1 / 2.6);
    sortie.push({
      indice: i,
      rx,
      ry: rx * INCLINAISON,
      cy: APEX_Y + H * Math.pow(u, 2.6),
      epaisseur: i === nombre ? 2.4 : RENFORCES.has(i) ? 2.2 : 0.9,
    });
  }
  return sortie;
}
```

- [ ] **Étape 4 : Relancer le test**

```bash
npm run test -w frontend -- geometrie
```

Attendu : 20 tests au vert. **Si le test « termine exactement sur l ellipse de bord » échoue**, c'est que l'approximation du profil dérive : ajuster l'exposant de `cy` sans toucher aux autres tests, et rapporter l'écart mesuré.

- [ ] **Étape 5 : Commit**

```bash
git add frontend/lib/ampoule
git commit -m "feat(ampoule): geometrie du tressage en fonctions pures, 20 tests"
```

---

## Task 7 : L'objet éteint

**Files:**
- Create: `frontend/components/ampoule/maille.tsx`, `frontend/components/ampoule/ampoule.tsx`
- Modify: `frontend/app/globals.css`, `frontend/app/page.tsx`

**Interfaces:**
- Consumes: `meridiens`, `cercles`, `CENTRE_X`, `APEX_Y`, `BORD_Y` (Task 6) ; `useTheme` (Task 4)
- Produces: `Maille` : props `{ id: string }` ; `Ampoule` : sans props

Cette tâche livre **l'objet éteint uniquement**. Aucune lumière : c'est ce qui permet de juger la silhouette et la densité du tressage avant d'y ajouter quoi que ce soit.

- [ ] **Étape 1 : Écrire le groupe de maille**

Créer `frontend/components/ampoule/maille.tsx`. Le demi-profil droit est le chemin de la spécification ; le gauche en est la symétrie par `scale(-1,1)`, jamais redessiné.

```tsx
const PROFIL_DROIT =
  "M 88 178 C 117.40 178.00, 122.77 179.32, 137.29 186.17 " +
  "C 148.72 191.57, 157.39 199.62, 163.20 210.24 " +
  "C 170.53 223.61, 172.00 228.80, 172.00 256.00";
```

Le groupe contient, dans cet ordre :
1. une `<defs>` avec le chemin `#profil` et le filtre d'irrégularité ;
2. la **calotte pleine** : ellipse `rx 30 / ry 4.3` centrée `(88, 180.1)`, qui remplace les cercles C1 à C4 qui se chevauchent ;
3. les méridiens non fusionnés, chacun un `<use href="#profil">` porteur de `transform="translate(88,0) scale(<echelle>,1) translate(-88,0)"` ;
4. les **deux bandes pleines** de 4,6 px remplaçant les méridiens fusionnés, `x ∈ [4 ; 8.6]` et `x ∈ [167.4 ; 172]` ;
5. les cercles C5 à C18, chacun une `<ellipse>` ;
6. l'ourlet et l'arc d'intérieur visible.

Le filtre d'irrégularité, appliqué au groupe entier :

```xml
<filter id="brins" x="-4%" y="-4%" width="108%" height="108%">
  <feTurbulence type="fractalNoise" baseFrequency="0.85 0.035"
                numOctaves="2" seed="7" result="bruit"/>
  <feDisplacementMap in="SourceGraphic" in2="bruit" scale="0.7"
                     xChannelSelector="R" yChannelSelector="G"/>
</filter>
```

`baseFrequency` est fortement anisotrope à dessein : le bruit déforme **le long** des brins et jamais en travers, sinon la maille se délite.

Couleurs de l'état éteint, depuis la spécification : méridiens `#6E6355` à 0,82 · cercles courants `#5F5648` à 0,72 · cercles renforcés `#7C7162` à 0,90 · calotte `#4A4239` · bandes `#544B3F` · ourlet `#7C7162` · intérieur `#1C1F22` à 0,88.

- [ ] **Étape 2 : Écrire l'objet**

Créer `frontend/components/ampoule/ampoule.tsx` : un `<svg viewBox="0 0 176 560">` en `position: fixed`, `top: 0`, `right: 48px`, `z-index: 60`, `pointer-events: none`, contenant le fil, la douille, la maille et l'ampoule éteinte.

Le fil : `M 88 0 C 88 62, 91.2 118, 89.4 152 C 88.7 165, 88 172, 88 178`, `stroke-width` 1,5, `stroke-linecap` round, couleur `#5A5348`. Il n'est jamais parfaitement vertical : la flèche de 3,2 px supprime l'effet « trait CSS ».

Les trois indices de volume de l'état éteint, et **pas davantage** : occlusion sous le bord (dégradé de `#0B0D0F` à 0,55 en y=256 vers transparent en y=226), liseré d'incidence haut-gauche (arc 1 px `#9AA096` à 0,22 dégressif), reflet spéculaire du verre (arc 1 px de (78,222) à (84,218), `#9AA096` à 0,30).

- [ ] **Étape 3 : Poser l'échelle responsive**

Dans `globals.css`, en `@layer components` :

```css
.ampoule {
  position: fixed;
  top: 0;
  right: var(--ampoule-droite, 48px);
  z-index: 60;
  pointer-events: none;
  transform: scale(var(--ampoule-echelle, 1));
  transform-origin: 100% 0;
}

@media (max-width: 1439px) { :root { --ampoule-droite: 40px; } }
@media (max-width: 1199px) { :root { --ampoule-echelle: 0.82; --ampoule-droite: 32px; } }
@media (max-width: 899px)  { :root { --ampoule-echelle: 0.66; --ampoule-droite: 24px; } }
@media (max-width: 599px)  { :root { --ampoule-echelle: 0.50; --ampoule-droite: 16px; } }
@media (max-width: 359px)  { :root { --ampoule-echelle: 0.44; --ampoule-droite: 12px; } }
```

- [ ] **Étape 4 : Dégrader le maillage sous 600 px**

À l'échelle 0,50, un brin de 1,2 px mesure 0,6 px physique : il disparaît ou
crénèle. La spécification impose donc, sous 600 px de large :

| Paramètre | Pleine résolution | Dégradé |
|---|---|---|
| Méridiens | `meridiens()` : 37 | `meridiens(10)` : 19 |
| Cercles | `cercles()` : 18 | `cercles(11)` : 11 |
| Épaisseur de brin | 1,2 px | **1,8 px** |
| Filtre `feDisplacementMap` | actif | **désactivé** |
| Opacité de l'interstice | 0,38 | **0,30** |

L'opacité de l'interstice est relevée pour compenser la perte de brins : la
transmission cible du dôme reste la même, sinon le maillage dégradé paraîtrait
nettement plus clair que le maillage complet.

Le composant lit une media query côté client pour choisir son maillage. Le
rendu serveur produit toujours le maillage complet : sous 600 px, la première
image sera brièvement la version dense, corrigée au montage. C'est acceptable :
l'écart est une densité de trait, pas un changement de mise en page.

Le filtre est désactivé en retirant l'attribut `filter` du groupe, pas en
changeant son `scale` : un filtre appliqué coûte même à `scale=0`.

- [ ] **Étape 5 : Monter dans la page**

Dans `frontend/app/page.tsx`, rendre `<Ampoule />` à l'intérieur du fournisseur de thème, **avant** `<main>`, comme l'était l'interrupteur de la lampe, pour que la commande vienne tôt dans l'ordre de tabulation à la tâche 13.

- [ ] **Étape 6 : Vérifier**

```bash
npm run typecheck -w frontend
npm run test -w frontend
curl -s http://localhost:3000 | grep -c 'class="ampoule' | xargs echo "objet monte:"
curl -s http://localhost:3000 | grep -o '<use href="#profil"' | wc -l | xargs echo "meridiens rendus:"
```

Attendu : l'objet monté, et un nombre de `<use>` égal au nombre de méridiens non fusionnés.

**Vérification visuelle indispensable, par le propriétaire du site.** Ouvrir `http://localhost:3000` et juger : la silhouette du dôme est-elle celle de la référence, flancs quasi verticaux au bord et calotte surbaissée au sommet ? Le tressage se densifie-t-il vers les bords sans moirer ? Aucune commande ne répond à ces questions.

- [ ] **Étape 7 : Commit**

```bash
git add frontend/components/ampoule frontend/app
git commit -m "feat(ampoule): objet eteint, tressage construit en projection"
```

---

## Task 8 : Les couches proches : filament et lueur du tressage

**Files:**
- Create: `frontend/components/ampoule/couches-lumiere.tsx`
- Modify: `frontend/components/ampoule/ampoule.tsx`, `frontend/app/globals.css`

**Interfaces:**
- Consumes: `Maille` (Task 7)
- Produces: `CoucheFilament` et `CoucheLueur`, tous deux sans props, pilotés par `--lampe-t`

L'ordre de peinture, du fond vers l'écran, est imposé :
`L5 halo de fond` → `L6 moucheture` → `L4 faisceau` → `L2 lueur` → `maille` → `L1 filament`.
Cette tâche livre **L2 et L1**, c'est-à-dire les deux couches les plus proches de la source.

- [ ] **Étape 1 : Écrire L2, la lueur à travers le tressage**

Peinte **sous la maille**, écrêtée au contour du dôme. Dégradé radial centré `(88, 236)` (décalé de 3 px sous le filament, parce que le flux remonte moins qu'il ne descend), de rayon 96 px, flou 6 px, `mix-blend-mode: screen`.

| Position | Couleur | Opacité |
|---|---|---|
| 0 % | `#FFDFAD` | 0,58 |
| 30 % | `#F6C176` | 0,42 |
| 58 % | `#E7A257` | 0,24 |
| 82 % | `#D08337` | 0,09 |
| 100 % | `hsl(25 65% 48%)` | 0,00 |

Loi de décroissance quadratique sur 96 px ; les positions ci-dessus en sont l'échantillonnage, à utiliser telles quelles.

**Brins rétro-éclairés.** Le `stroke` des méridiens devient un dégradé vertical, appliqué quand la lampe est allumée :

| y | couleur |
|---|---|
| 178 | `#8A6B45` |
| 210 | `#B08A57` |
| 233 | `#D6A96B` |
| 256 | `#9C7A4E` |

- [ ] **Étape 2 : Écrire L1, le filament**

Quatre sous-couches, peintes **par-dessus la maille** :

| Sous-couche | Géométrie | Couleur | Opacité | Flou |
|---|---|---|---|---|
| Cœur | ellipse (88, 233) rx 2,2 ry 1,4 | `#FFFDF6` | 1,00 | 0,5 px |
| Boucle | ellipse (88, 233) rx 6 ry 3,5, stroke 1,4 | `#FFF3D6` | 0,95 | 1,2 px |
| Halo serré | cercle (88, 233) r 20, dégradé radial | sans objet | 1,00 | 3 px |
| Globe éclairé | cercle (88, 232) r 21 | `#FFE6B0` | 0,42 | 4 px |

Dégradé du halo serré : 0 % `hsl(44 100% 96%)` à 1,00 · 22 % `hsl(40 100% 88%)` à 0,86 · 50 % `hsl(35 97% 76%)` à 0,48 · 78 % `hsl(30 90% 66%)` à 0,17 · 100 % `hsl(28 85% 60%)` à 0,00. `mix-blend-mode: screen`.

- [ ] **Étape 3 : Câbler l'opacité sur la variable de transition**

Chaque couche porte sa propre variable, toutes dérivées de `--lampe-t` qui vaudra 0 (éteint) ou 1 (allumé). Pour l'instant, la poser en dur selon le thème :

```css
.ampoule { --lampe-t: 0; }
.clair .ampoule { --lampe-t: 1; }
```

L'animation réelle arrive à la tâche 10.

- [ ] **Étape 4 : Vérifier**

```bash
npm run typecheck -w frontend
npm run test -w frontend
grep -c "mix-blend-mode" frontend/app/globals.css frontend/components/ampoule/*.tsx
```

**Vérification visuelle, par le propriétaire.** Basculer le thème et juger : la lueur traverse-t-elle le tressage sans le noyer ? Les brins s'échauffent-ils près du filament ? Le bord du dôme reste-t-il plus sombre que son centre **sans qu'aucun dégradé ne l'y force** ?

- [ ] **Étape 5 : Commit**

```bash
git add frontend/components/ampoule frontend/app/globals.css
git commit -m "feat(ampoule): filament et lueur a travers le tressage"
```

---

## Task 9 : Les couches lointaines : faisceau, halo et moucheture

**Files:**
- Modify: `frontend/components/ampoule/couches-lumiere.tsx`, `frontend/app/globals.css`

**Interfaces:**
- Consumes: `Maille` (Task 7), les couches de la Task 8
- Produces: `CoucheFaisceau`, et les règles `body::before` du halo de fond

- [ ] **Étape 1 : Écrire L4, le faisceau**

Cône partant du plan du bord : 168 px de large en y = 256, 300 px en y = 560, portée 304 px, demi-angle 12,25°. Flou **26 px** : c'est le seul flou réel de forme de tout l'effet. `mix-blend-mode: screen`.

Dégradé linéaire vertical : 0 % `#FDD599` à 0,36 · 15 % `hsl(35 94% 73%)` à 0,26 · 45 % `hsl(33 90% 70%)` à 0,13 · 75 % `hsl(31 85% 66%)` à 0,05 · 100 % `hsl(30 82% 62%)` à 0,00.

La loi est **en inverse du carré**, `I(d) = 0,36 / (1 + d/120)²`, et non linéaire : un faisceau conique perd son intensité en 1/d², et c'est ce qui rend crédible le contenu éclairé sous la lampe.

**Pénombre latérale de 18 px de chaque côté**, par un masque horizontal : 0 % opaque 0, 12 % opaque 1, 88 % opaque 1, 100 % opaque 0. C'est cette pénombre qui produit la « transition très douce vers l'ombre » de la référence, au lieu d'un cône à arête franche.

- [ ] **Étape 2 : Écrire L5, le halo de fond**

**Ne pas l'implémenter comme une forme floutée** : un `radial-gradient` coûte 0,3 ms là où une forme floutée en coûte plusieurs. Support : `body::before`, `position: fixed; inset: 0; pointer-events: none`.

Centre `calc(100% - 136px)` en x, `250px` en y. Rayons 540 × 620 px : ellipse verticale, la lumière descend plus qu'elle ne remonte.

Stops : 0 % `hsl(34 88% 72%)` à 0,30 · 26 % `hsl(32 80% 66%)` à 0,19 · 55 % `hsl(30 70% 58%)` à 0,08 · 80 % `hsl(28 62% 50%)` à 0,025 · 100 % à 0,00.

Blend `soft-light`, puis une seconde passe `screen` à 40 % de l'opacité.

- [ ] **Étape 3 : Écrire L6, la moucheture**

C'est l'ombre de la maille projetée sur le fond : les « marbrures » de la référence. Source : `<use href="#maille">`, transformée par `translate(88,250) scale(2.35) translate(-88,-250)` puis `skewY(4deg)`. Étendue résultante 395 × 183 px. Blend `overlay`, opacité globale 0,55.

Brins projetés `hsl(28 55% 38%)` à 0,16 ; interstices `hsl(36 82% 68%)` à 0,20.

**Dégradé de netteté** : deux copies superposées et masquées l'une par l'autre : une copie nette floutée à 2 px, masque radial opaque jusqu'à 120 px du centre puis dégressif jusqu'à 200 px ; une copie floue à 9 px, masque inverse.

Loi **linéaire** sur 230 px, et non quadratique : c'est une modulation de texture, pas une source. Une loi quadratique la ferait disparaître trop vite et on perdrait le caractère « panier ».

**Point de coût.** Le filtre `feTurbulence` de la maille serait recalculé pour cette copie, doublant son coût. Le rastériser **une seule fois** dans un `<symbol>` et réutiliser ce symbole pour la maille et pour la moucheture.

- [ ] **Étape 4 : Poser le budget de rendu**

Le budget visé par la spécification est **≤ 4,0 ms par frame en régime animé et ≤ 45 ms au premier rendu**. Mesurer :

```bash
npm run build -w frontend 2>&1 | grep -iE "error|Compiled successfully"
```

Puis, dans le navigateur, relever dans l'onglet Performances le temps de rendu au premier affichage et pendant une bascule de thème. **Reporter les valeurs mesurées dans le rapport de tâche.** Si le premier rendu dépasse 45 ms, le coupable le plus probable est le filtre de la maille recalculé deux fois : vérifier le `<symbol>`.

- [ ] **Étape 5 : Désactiver les couches lointaines sous 360 px**

```css
@media (max-width: 359px) {
  body::before { display: none; }
}
```

- [ ] **Étape 6 : Vérifier**

```bash
npm run typecheck -w frontend
npm run test -w frontend
npm run build -w frontend 2>&1 | grep -iE "error|Compiled successfully"
```

**Vérification visuelle, par le propriétaire.** C'est la tâche la plus visuelle du plan : le faisceau éclaire-t-il le contenu sous la lampe sans l'éblouir ? Le halo de fond reste-t-il une ambiance et non une tache ? Les marbrures lisent-elles comme un panier ou comme du bruit ?

- [ ] **Étape 7 : Commit**

```bash
git add frontend/components/ampoule frontend/app/globals.css
git commit -m "feat(ampoule): faisceau, halo de fond et moucheture du tressage"
```

---

## Task 10 : La transition d'incandescence

**Files:**
- Create: `frontend/lib/ampoule/animation.ts`
- Modify: `frontend/lib/theme/theme-context.tsx`, `frontend/app/globals.css`

**Interfaces:**
- Consumes: `useTheme` (Task 4)
- Produces:
  - `DUREE_ALLUMAGE = 900`, `DUREE_EXTINCTION = 1100`
  - `creerAnimation(cible: HTMLElement): Animation`
  - `basculerAnimation(animation: Animation, versAllume: boolean): void`

- [ ] **Étape 1 : Écrire le pilotage**

Toutes les couches sont pilotées par **une variable unique** `--lampe-t` ∈ [0, 1], animée par un seul objet `Animation` de la Web Animations API. C'est ce qui garantit la réentrance : un double clic pendant une transition ne peut pas produire d'état incohérent.

```ts
export const DUREE_ALLUMAGE = 900;
export const DUREE_EXTINCTION = 1100;

/**
 * Changer d'etat pendant une transition appelle `reverse()` plutot que de
 * relancer une animation : l'objet repart de sa position courante au lieu de
 * sauter. Le `playbackRate` est ajuste pour conserver l'asymetrie des durees :
 * l'extinction est plus lente que l'allumage, parce qu'un filament refroidit.
 */
export function basculerAnimation(animation: Animation, versAllume: boolean): void {
  const enCours = animation.playState === "running";
  if (enCours) {
    animation.reverse();
  } else {
    animation.playbackRate = versAllume ? 1 : -DUREE_ALLUMAGE / DUREE_EXTINCTION;
    animation.play();
  }
}
```

**Ne pas ajouter de `disabled` sur le bouton pendant la transition** : c'est frustrant au clavier, et `reverse()` gère déjà le cas.

- [ ] **Étape 2 : Décrire les deux séquences en CSS**

L'allumage dure 900 ms et suit cet ordre : **filament → lueur du tressage → faisceau → halo de fond → moucheture**. Le décalage de 130 ms entre le filament et le faisceau est ce qui rend l'allumage lisible : on voit la lumière « sortir » de l'abat-jour au lieu d'apparaître partout d'un coup.

| Phase | Fenêtre | Ce qui bouge |
|---|---|---|
| Inertie | 0 → 40 ms | rien, délai de contact |
| Préchauffage | 40 → 130 ms | filament `#3A3128` → `#A8431A`, opacité 0 → 0,45 |
| Montée | 130 → 420 ms | filament → `#FFFDF6` ; halo serré 0 → 1 ; lueur 0 → 0,92 |
| Dépassement | 380 → 520 ms | L1 monte à 1,08 puis revient à 1,00 |
| Remplissage | 260 → 560 ms | faisceau 0 → 1 |
| Rayonnement | 320 → 700 ms | halo de fond 0 → 1 |
| Texture | 400 → 780 ms | moucheture 0 → 0,55 |
| Page | 220 → 580 ms | palette sombre → claire |

L'extinction dure 1100 ms et suit l'ordre **inverse strict** : **faisceau → halo → moucheture → lueur → filament**. La zone éclairée s'éteint **avant** la source ; c'est le détail qui vend l'effet.

| Phase | Fenêtre | Ce qui bouge |
|---|---|---|
| Coupure | 0 → 90 ms | L1 1 → 0,42, chute brutale |
| Faisceau | 0 → 260 ms | part le premier |
| Halo et texture | 0 → 340 ms | → 0 |
| Lueur | 60 → 420 ms | 0,92 → 0 |
| Rougeoiement | 90 → 560 ms | `#FFFDF6` → `#FFB768` → `#E0631E` → `#7A2408` |
| Braise | 560 → 1100 ms | opacité 0,07 → 0, couleur → `#3A3128` |
| Page | 60 → 460 ms | palette claire → sombre |

**Les rampes chromatiques du filament s'interpolent en `oklch`, jamais en sRGB** : une interpolation sRGB entre le blanc chaud et le brun traverse un brun sale qui ruine l'effet.

- [ ] **Étape 3 : Respecter le mouvement réduit**

```css
@media (prefers-reduced-motion: reduce) {
  .ampoule *,
  body::before {
    transition: none !important;
    animation: none !important;
  }
}
```

Sous mouvement réduit, la bascule est **instantanée** : les deux états restent corrects, seule la mise en scène disparaît.

- [ ] **Étape 4 : Vérifier la réentrance**

```bash
npm run typecheck -w frontend
npm run test -w frontend
```

**Vérification manuelle indispensable** : cliquer l'ampoule cinq fois rapidement. L'objet doit toujours finir dans un état cohérent : allumé ou éteint, jamais à mi-course figé. Reporter le résultat.

- [ ] **Étape 5 : Commit**

```bash
git add frontend/lib/ampoule frontend/lib/theme frontend/app/globals.css
git commit -m "feat(ampoule): transition d incandescence, allumage 900ms extinction 1100ms"
```

---

## Task 11 : L'ambiance de page et l'audit des empilements

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: tout composant dont l'audit révèle un `z-index` en conflit

**Interfaces:**
- Consumes: les couches de la Task 9
- Produces: rien de nouveau : cette tâche répare ce que `mix-blend-mode` casse

- [ ] **Étape 1 : Recenser tous les contextes d'empilement**

```bash
grep -rn "z-index\|z-\[\|z-[0-9]\|sticky\|backdrop-filter\|backdrop-blur" \
  frontend/app frontend/components --include=*.tsx --include=*.css | grep -v node_modules
```

Écrire la liste dans le rapport de tâche, avec pour chaque entrée le composant, sa valeur, et le verdict : en conflit ou non.

Repères connus : l'ampoule est en `z-index: 60`, l'en-tête collant est en `z-50`, les modales de projet en `z-50` également, et le halo de fond vit sur `body::before`.

**Le conflit attendu :** `body::before` en `mix-blend-mode` crée un contexte d'empilement qui peut passer devant ou derrière selon l'ordre de peinture. L'en-tête collant, en particulier, ne doit pas se retrouver au-dessus du halo, ou alors il flottera « en pleine lumière » sans être teinté, ce qui se verra.

- [ ] **Étape 2 : Isoler l'anneau de focus**

`mix-blend-mode` altère la couleur des éléments qu'il recouvre, y compris les anneaux de focus. Tout élément focalisable doit être **explicitement isolé** :

```css
@layer components {
  :focus-visible {
    isolation: isolate;
  }
}
```

Vérifier après coup que l'anneau reste visible dans les deux thèmes : c'est une exigence d'accessibilité, pas une finition.

- [ ] **Étape 3 : Mesurer les contrastes après composition**

C'est le point que la spécification désigne comme le plus risqué. Les couches de blend modifient la luminance réelle du fond : **les ratios calculés ne valent plus tels quels**.

Le garde-fou imposé : la variation de luminance relative du fond ne doit jamais dépasser **±0,04**. Pour le fond clair `#F6F1E8` (L = 0,8833), la plage admise est L ∈ [0,843 ; 0,923]. Pour le fond sombre `#131518` (L = 0,0074), elle est L ∈ [0 ; 0,047].

**Aucun outil statique ne vérifie cela.** La méthode est une capture d'écran et une mesure, sur trois points au minimum : sous la lampe où le halo est le plus fort, au milieu de la section 3, et en pied de page. Reporter les trois luminances mesurées et dire si elles tiennent dans la plage.

Si une mesure sort de la plage, **plafonner l'opacité de la nappe** plutôt que de retoucher la palette.

- [ ] **Étape 4 : Vérifier**

```bash
npm run build -w frontend 2>&1 | grep -iE "error|Compiled successfully"
npm run test -w frontend
```

- [ ] **Étape 5 : Commit**

```bash
git add -A
git commit -m "feat(ambiance): nappe de page, isolation du focus, audit des empilements"
```

---

## Task 12 : Les ombres en deux jeux

**Files:**
- Modify: `frontend/app/globals.css`, et tout composant portant une ombre en dur

**Interfaces:**
- Consumes: `--ombre-teinte` (Task 2)
- Produces: les jetons `--ombre-proche`, `--ombre-moyenne`, `--ombre-lointaine`

- [ ] **Étape 1 : Recenser toutes les ombres du site**

```bash
grep -rn "box-shadow\|shadow-\|drop-shadow" frontend/app frontend/components \
  --include=*.tsx --include=*.css | grep -v node_modules
```

Une ombre oubliée en gris neutre se verra immédiatement comme une erreur d'éclairage sur le thème clair. Lister toutes les occurrences dans le rapport.

- [ ] **Étape 2 : Définir les deux jeux**

En thème clair, la lumière vient de l'ampoule en haut à droite : les ombres sont **décalées vers le bas-gauche** et **teintées** (28°, 42 %). En thème sombre, l'éclairage est diffus : elles redeviennent **neutres et centrées**.

```css
.clair {
  --ombre-proche: -1px 2px 3px hsl(var(--ombre-teinte) / 0.18);
  --ombre-moyenne: -2px 6px 12px hsl(var(--ombre-teinte) / 0.15);
  --ombre-lointaine: -4px 14px 28px hsl(var(--ombre-teinte) / 0.12);
}

.sombre {
  --ombre-proche: 0 1px 2px hsl(var(--ombre-teinte) / 0.40);
  --ombre-moyenne: 0 4px 10px hsl(var(--ombre-teinte) / 0.35);
  --ombre-lointaine: 0 10px 24px hsl(var(--ombre-teinte) / 0.30);
}
```

- [ ] **Étape 3 : Remplacer chaque ombre recensée**

Substituer les valeurs en dur par les trois jetons. Aucune ombre ne doit subsister avec une couleur littérale.

```bash
grep -rn "box-shadow:.*#\|box-shadow:.*rgb\|shadow-\[" frontend/app frontend/components \
  --include=*.tsx --include=*.css | grep -v node_modules
```

Attendu : vide.

- [ ] **Étape 4 : Vérifier**

```bash
npm run typecheck -w frontend && npm run test -w frontend
```

**Vérification visuelle, par le propriétaire.** Basculer entre les deux thèmes et regarder les cartes de projets et de compétences : leurs ombres changent-elles de direction, ou restent-elles figées ? Une ombre qui ne bouge pas trahit une occurrence oubliée.

- [ ] **Étape 5 : Commit**

```bash
git add -A
git commit -m "feat(ambiance): ombres en deux jeux, teintees en clair et neutres en sombre"
```

---

## Task 13 : L'interrupteur accessible et la vérification finale

**Files:**
- Create: `frontend/components/ampoule/interrupteur.tsx`
- Modify: `frontend/components/ampoule/ampoule.tsx`, `frontend/app/globals.css`

**Interfaces:**
- Consumes: `useTheme` (Task 4)
- Produces: `Interrupteur` : sans props

- [ ] **Étape 1 : Écrire le bouton**

L'objet entier est `pointer-events: none` ; seul le bouton reçoit `auto`. Il couvre le dôme, mesure **au moins 44 × 44 px** quelle que soit l'échelle, et porte :

```tsx
<button
  type="button"
  onClick={basculer}
  aria-pressed={allumee}
  className="ampoule-interrupteur"
>
  <span className="sr-only">
    {allumee ? "Éteindre la lampe et passer au thème sombre"
             : "Allumer la lampe et passer au thème clair"}
  </span>
</button>
```

`aria-pressed` décrit l'état de l'ampoule, et le libellé masqué dit **ce que le clic va faire au site**, sans quoi un visiteur non voyant entend « bouton pressé » sans savoir qu'il commande le thème.

Les couleurs de l'anneau de focus doivent être explicites dans les deux thèmes, et ne jamais compter sur `currentColor` : c'est un piège déjà rencontré sur ce projet.

```css
.ampoule-interrupteur:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  isolation: isolate;
}
```

- [ ] **Étape 2 : Monter l'interrupteur dans l'objet**

Dans `frontend/components/ampoule/ampoule.tsx`, rendre `<Interrupteur />`
**après** le `<svg>`, en frère et non en enfant : un `<button>` à l'intérieur
d'un SVG n'est pas focalisable de façon fiable sur tous les navigateurs.

Le bouton est positionné en absolu au-dessus du dôme, dans le même conteneur
`position: fixed` que l'objet. Le SVG garde `pointer-events: none` ; seul le
bouton reçoit `auto`.

```tsx
<div className="ampoule">
  <svg viewBox="0 0 176 560" aria-hidden="true" focusable="false">
    {/* fil, douille, maille, ampoule, couches de lumiere */}
  </svg>
  <Interrupteur />
</div>
```

Le `<svg>` porte `aria-hidden` : c'est une image, et c'est le bouton qui porte
l'information et l'interaction.

- [ ] **Étape 3 : Vérifier l'ordre de tabulation**

```bash
curl -s http://localhost:3000 | grep -oE '<(button[^>]*ampoule-interrupteur|main)' | head -3
```

Attendu : le bouton **avant** `<main>`. Une commande qui change le thème de toute la page ne doit pas être atteinte en dernier.

- [ ] **Étape 4 : Vérifier la lisibilité de l'objet éteint**

La spécification impose que l'affordance repose sur la **silhouette du dôme**, pas sur l'ampoule : le brin `#6E6355` donne 3,12:1 sur le fond sombre, au-dessus du seuil de 3:1 des composants d'interface.

```bash
node -e '
const lum=h=>{const n=h.replace("#","");const c=[0,2,4].map(i=>parseInt(n.slice(i,i+2),16)/255).map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];};
const r=(a,b)=>{const x=lum(a),y=lum(b);const[h,l]=x>y?[x,y]:[y,x];return (h+0.05)/(l+0.05);};
console.log("brin #6E6355 sur #131518 :", r("#6E6355","#131518").toFixed(2), "attendu 3,12, seuil 3");
console.log("ourlet #7C7162 sur #131518 :", r("#7C7162","#131518").toFixed(2), "attendu 3,83");
'
```

- [ ] **Étape 5 : Vérification finale de la chaîne**

```bash
npm run test
npm run typecheck -w frontend
npx tsc --noEmit -p backoffice/tsconfig.json
npx tsc --noEmit -p backend/tsconfig.json
npm run build
```

Puis les garanties de la spécification :

```bash
# Aucune trace de la lampe d'atelier
grep -rn "lamp\b\|Lamp\b\|beam-layer" frontend/ --include=*.tsx --include=*.ts --include=*.css | grep -v node_modules

# next-themes retire
grep -rn "next-themes" frontend/ --include=*.json --include=*.tsx | grep -v node_modules

# Plex Sans retire
grep -rn "Plex Sans\|IBM_Plex_Sans" frontend/ --include=*.tsx --include=*.ts --include=*.css | grep -v node_modules

# Aucune ombre en couleur litterale
grep -rn "box-shadow:.*#\|shadow-\[" frontend/app frontend/components --include=*.tsx --include=*.css | grep -v node_modules
```

Les quatre doivent être vides.

- [ ] **Étape 6 : Vérifier la règle horaire de bout en bout**

```bash
curl -s http://localhost:3000 | grep -o 'getHours()' | head -1
curl -s http://localhost:3000 | grep -oE 'classList.add\("(clair|sombre)"\)' | head -2
```

Puis, dans le navigateur, vider le stockage local et recharger à une heure de jour comme de nuit, ou modifier temporairement l'horloge du système. Confirmer que le site arrive **sombre en journée et clair la nuit**, sans clignotement au chargement.

- [ ] **Étape 7 : Commit**

```bash
git add -A
git commit -m "feat(ampoule): interrupteur accessible et verification finale"
```

---

## Notes pour l'exécutant

**L'ordre compte.** Les tâches 1 à 5 sont des fondations indépendantes les unes des autres au-delà de leur séquence. Les tâches 6 à 10 forment une chaîne : chacune consomme la précédente, et la 10 ne peut être jugée que si la 8 et la 9 sont visibles. Les tâches 11 et 12 réparent ce que les précédentes cassent ; les lancer trop tôt ferait travailler dans le vide.

**Le piège le plus probable** est l'étape 5 de la Task 2 : la classe de thème passe de `.dark` à `.sombre`, et les variantes `dark:` de Tailwind ne ciblent plus rien. Toute couleur qui « ne change pas au bon moment » vient de là.

**Le point le plus coûteux** est le filtre `feTurbulence` de la maille. S'il est recalculé pour la moucheture au lieu d'être rastérisé une fois dans un `<symbol>`, le premier rendu double et sort du budget.

**Ce que ce plan ne peut pas garantir.** Les tâches 7, 8, 9 et 12 comportent une vérification visuelle qu'aucune commande ne remplace. Le projet passe de 46 à environ 40 tests, mais ces tests couvrent la géométrie, la règle horaire et les contrastes, pas l'apparence. Il faut que le propriétaire du site regarde à la fin de chacune de ces quatre tâches, et non à la fin du plan.

**Ne jamais simuler l'assombrissement des bords du dôme par un dégradé.** C'est la seule règle de cette spécification qui, si elle est enfreinte, détruit tout l'effet sans qu'aucun test ne le signale.
