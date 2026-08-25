# Refonte frontend et lampe d'atelier — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le système visuel kaki du portfolio par une identité sombre et sobre, resserrer le parcours à six sections en zigzag, et construire une lampe d'atelier dont le faisceau révèle la section lue.

**Architecture:** Les réglages vivent dans le singleton `SiteSettings` et descendent en variables CSS au rendu serveur. La lampe est un SVG fixe piloté par deux modules purs (géométrie, ressort) et une unique boucle `requestAnimationFrame` qui écrit dans le DOM par `ref`, sans re-rendu React. Le faisceau est un scrim assombrissant percé par un masque SVG : le contenu n'est jamais dupliqué ni recoloré, sauf les titres de section.

**Tech Stack:** NestJS 11 · Prisma 6 · PostgreSQL · Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · Vitest · Jest (backend)

**Spec:** `docs/superpowers/specs/2026-08-25-refonte-frontend-lampe-design.md`

## Global Constraints

Ces règles s'appliquent à **toutes** les tâches. Elles viennent de la spec, valeurs copiées telles quelles.

- **Palette, cinq valeurs, aucune autre.** Fond `#131518`, surface `#1A1D21`, bordure `#22262B`, texte secondaire `#8B8F8A`, texte principal `#E4E5E3`, accent `#7E9B76`.
- **Aucun dégradé nulle part.** Pas de `linear-gradient`, `radial-gradient`, `conic-gradient`. La seule exception est le voile de lumière du faisceau, qui est un aplat à faible opacité, pas un dégradé.
- **Aucune couleur vive.** La saturation de l'accent est plafonnée à 30 dans le DTO. Cette borne est la garantie structurelle, elle ne doit jamais être relâchée.
- **Noir jamais pur.** `#000000` est interdit comme couleur de fond ou de texte.
- **Deux mouvements sur tout le site** : l'entrée d'un bloc (opacité + 8 px, 400 ms, `cubic-bezier(0.22, 1, 0.36, 1)`) et la lampe. Rien d'autre ne bouge. Pas de parallaxe, pas d'agrandissement au survol, pas de rotation, pas de compteur incrémental, pas d'apparition lettre par lettre.
- **Grille de 8 px sans exception** pour tous les espacements.
- **Mesure de texte plafonnée à 66 caractères** (`max-width: 66ch`) sur tout bloc de texte courant.
- **Aucune hauteur fixe sur un conteneur de texte** — WCAG 2.2 critère 1.4.12.
- **`prefers-reduced-motion: reduce`** neutralise les deux mouvements, sauf si `respectReducedMotion` vaut `false`.
- **Langue de l'interface : français.** Libellés, messages et commentaires de code en français, comme le reste du dépôt.
- **Branche de travail : `refonte-frontend-lampe`.** Ne jamais commiter sur `main`.

---

## Structure des fichiers

**Backend**
| Fichier | Responsabilité |
|---|---|
| `backend/prisma/schema.prisma` | 15 champs ajoutés à `SiteSettings` |
| `backend/prisma/migrations/<ts>_add_lamp_and_typography_settings/migration.sql` | colonnes + `UPDATE` de la ligne existante |
| `backend/src/site-settings/dto/update-site-settings.dto.ts` | bornes de validation |
| `backend/src/site-settings/dto/update-site-settings.dto.spec.ts` | tests des bornes |

**Types partagés**
| Fichier | Responsabilité |
|---|---|
| `packages/shared-types/src/site-settings.ts` | `SiteSettingsDto` étendu |

**Backoffice**
| Fichier | Responsabilité |
|---|---|
| `backoffice/app/site-settings/page.tsx` | quatre groupes de réglages |
| `backoffice/lib/contrast.ts` | ratio de contraste affiché en direct |

**Frontend — fondations**
| Fichier | Responsabilité |
|---|---|
| `frontend/vitest.config.ts` | harnais de test |
| `frontend/lib/design/tokens.ts` | source unique de la palette et de l'échelle typographique |
| `frontend/lib/color/contrast.ts` | luminance relative et ratio WCAG |
| `frontend/lib/color/contrast.test.ts` | vérifie les seuils de la palette |
| `frontend/app/globals.css` | jetons CSS, rythme, typographie |
| `frontend/app/layout.tsx` | polices Plex, injection des réglages en variables CSS |

**Frontend — moteur de la lampe**
| Fichier | Responsabilité |
|---|---|
| `frontend/lib/lamp/geometry.ts` | fonctions pures de géométrie du faisceau |
| `frontend/lib/lamp/geometry.test.ts` | cas limites d'angle |
| `frontend/lib/lamp/spring.ts` | intégration du ressort amorti |
| `frontend/lib/lamp/spring.test.ts` | convergence, dépassement, immobilisation |
| `frontend/lib/lamp/lamp-context.tsx` | état partagé, cible active, focus clavier |
| `frontend/lib/lamp/use-lamp-engine.ts` | la boucle rAF et les trois ressorts |

**Frontend — composants**
| Fichier | Responsabilité |
|---|---|
| `frontend/components/lamp/work-lamp.tsx` | le SVG de l'objet |
| `frontend/components/lamp/beam-layer.tsx` | le scrim masqué et le voile de lumière |
| `frontend/components/lamp/lamp-switch.tsx` | l'interrupteur |
| `frontend/lib/use-reveal.ts` | observateur d'entrée unique et partagé |
| `frontend/components/portfolio/section-shell.tsx` | zigzag, titre double-ton, déclaration de cible |
| `frontend/app/page.tsx` | composition des six sections |

---

## Task 1 : Migration du schéma et types partagés

**Files:**
- Modify: `backend/prisma/schema.prisma:1-45` (bloc `model SiteSettings`)
- Create: `backend/prisma/migrations/<timestamp>_add_lamp_and_typography_settings/migration.sql` (généré)
- Modify: `packages/shared-types/src/site-settings.ts:1-30`

**Interfaces:**
- Consumes: rien
- Produces: 15 champs sur `SiteSettings` et sur `SiteSettingsDto` — `lampEnabled`, `lampOnByDefault`, `lampBeamAngle`, `lampIntensity`, `lampDimLevel`, `showStats`, `typeScale`, `lineHeight`, `zigzagAmplitude`, `sectionSpacing`, `animationsEnabled`, `animationSpeed`, `respectReducedMotion`, `accentHue`, `accentSaturation`

- [ ] **Étape 1 : Ajouter les champs au schéma Prisma**

Dans `backend/prisma/schema.prisma`, à l'intérieur de `model SiteSettings`, juste avant la ligne `createdAt` :

```prisma
  // Lampe d'atelier
  lampEnabled       Boolean @default(true)  @map("lamp_enabled")
  lampOnByDefault   Boolean @default(false) @map("lamp_on_by_default")
  lampBeamAngle     Int     @default(28)    @map("lamp_beam_angle")
  lampIntensity     Int     @default(70)    @map("lamp_intensity")
  lampDimLevel      Int     @default(40)    @map("lamp_dim_level")

  // Visibilité manquante : StatsSection était rendue sans condition
  showStats         Boolean @default(false) @map("show_stats")

  // Rythme typographique
  typeScale         String  @default("normal") @map("type_scale")
  lineHeight        Float   @default(1.6)      @map("line_height")
  zigzagAmplitude   Int     @default(50)       @map("zigzag_amplitude")
  sectionSpacing    Int     @default(120)      @map("section_spacing")

  // Mouvement
  animationsEnabled    Boolean @default(true) @map("animations_enabled")
  animationSpeed       Float   @default(1.0)  @map("animation_speed")
  respectReducedMotion Boolean @default(true) @map("respect_reduced_motion")

  // Accent
  accentHue         Int     @default(128) @map("accent_hue")
  accentSaturation  Int     @default(18)  @map("accent_saturation")
```

- [ ] **Étape 2 : Changer les valeurs par défaut de l'identité visuelle**

Toujours dans `model SiteSettings`, remplacer les quatre lignes existantes :

```prisma
  bgColor     String   @default("#131518") @map("bg_color")
  textColor   String   @default("#E4E5E3") @map("text_color")
  fontSize    Int      @default(17) @map("font_size")
  fontFamily  String   @default("IBM Plex Sans") @map("font_family")
```

- [ ] **Étape 3 : Générer la migration**

```bash
cd backend && npx prisma migrate dev --name add_lamp_and_typography_settings
```

- [ ] **Étape 4 : Ajouter la mise à jour de la ligne existante**

`prisma migrate dev` ne modifie que les valeurs par défaut des futures insertions. La ligne déjà en base garde ses valeurs kaki. Ouvrir le `migration.sql` qui vient d'être généré et **ajouter à la fin** :

```sql
-- Bascule de l'enregistrement existant vers la nouvelle identité visuelle
UPDATE "site_settings"
SET "bg_color"    = '#131518',
    "text_color"  = '#E4E5E3',
    "font_size"   = 17,
    "font_family" = 'IBM Plex Sans',
    "show_services"     = false,
    "show_testimonials" = false,
    "show_stats"        = false;
```

- [ ] **Étape 5 : Rejouer la migration sur la base**

```bash
cd backend && npx prisma migrate reset --skip-seed --force && npx prisma migrate deploy && npx prisma db seed
```

Vérifier que la ligne a bien basculé :

```bash
PGPASSWORD="$PGPASSWORD" psql -h localhost -U postgres -d portfolio_db \
  -Atc "select bg_color, font_family, show_stats, lamp_dim_level from site_settings"
```

Attendu : `#131518|IBM Plex Sans|f|40`

- [ ] **Étape 6 : Étendre le type partagé**

Dans `packages/shared-types/src/site-settings.ts`, ajouter avant l'accolade fermante de `SiteSettingsDto` :

```ts
  lampEnabled: boolean;
  lampOnByDefault: boolean;
  lampBeamAngle: number;
  lampIntensity: number;
  lampDimLevel: number;
  showStats: boolean;
  typeScale: "compact" | "normal" | "airy";
  lineHeight: number;
  zigzagAmplitude: number;
  sectionSpacing: number;
  animationsEnabled: boolean;
  animationSpeed: number;
  respectReducedMotion: boolean;
  accentHue: number;
  accentSaturation: number;
```

- [ ] **Étape 7 : Vérifier que tout compile**

```bash
cd backend && npm run build
```

Attendu : compilation sans erreur.

- [ ] **Étape 8 : Commit**

```bash
git add backend/prisma packages/shared-types/src/site-settings.ts
git commit -m "feat(settings): ajoute les reglages lampe, rythme, mouvement et accent"
```

---

## Task 2 : Bornes de validation et tests

**Files:**
- Modify: `backend/src/site-settings/dto/update-site-settings.dto.ts`
- Create: `backend/src/site-settings/dto/update-site-settings.dto.spec.ts`

**Interfaces:**
- Consumes: `SiteSettingsDto` de la Task 1
- Produces: `UpdateSiteSettingsDto` refusant toute valeur hors plage

Le plafond `@Max(30)` sur `accentSaturation` est la garantie structurelle du « pas de couleurs vives ». Il ne doit jamais être relâché.

- [ ] **Étape 1 : Écrire le test qui échoue**

Créer `backend/src/site-settings/dto/update-site-settings.dto.spec.ts` :

```ts
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateSiteSettingsDto } from './update-site-settings.dto';

async function erreursSur(champ: string, valeur: unknown): Promise<string[]> {
  const dto = plainToInstance(UpdateSiteSettingsDto, { [champ]: valeur });
  const erreurs = await validate(dto);
  return erreurs.map((e) => e.property);
}

describe('UpdateSiteSettingsDto', () => {
  it('refuse une saturation d accent au-dela de 30', async () => {
    expect(await erreursSur('accentSaturation', 80)).toContain('accentSaturation');
  });

  it('accepte une saturation d accent dans la plage', async () => {
    expect(await erreursSur('accentSaturation', 18)).toEqual([]);
  });

  it('refuse un assombrissement au-dela de 65', async () => {
    expect(await erreursSur('lampDimLevel', 90)).toContain('lampDimLevel');
  });

  it('refuse un interligne inferieur a 1.3', async () => {
    expect(await erreursSur('lineHeight', 0)).toContain('lineHeight');
  });

  it('refuse une vitesse d animation aberrante', async () => {
    expect(await erreursSur('animationSpeed', 50)).toContain('animationSpeed');
  });

  it('refuse une echelle typographique inconnue', async () => {
    expect(await erreursSur('typeScale', 'enorme')).toContain('typeScale');
  });

  it('accepte les trois echelles typographiques', async () => {
    for (const echelle of ['compact', 'normal', 'airy']) {
      expect(await erreursSur('typeScale', echelle)).toEqual([]);
    }
  });

  it('refuse une ouverture de faisceau hors plage', async () => {
    expect(await erreursSur('lampBeamAngle', 120)).toContain('lampBeamAngle');
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd backend && npx jest src/site-settings/dto/update-site-settings.dto.spec.ts
```

Attendu : ÉCHEC. Les propriétés n'existent pas encore sur le DTO, donc aucune erreur de validation n'est levée et les assertions `toContain` échouent.

- [ ] **Étape 3 : Ajouter les bornes au DTO**

Dans `backend/src/site-settings/dto/update-site-settings.dto.ts`, compléter l'import de `class-validator` avec `IsIn` et `IsNumber`, puis ajouter avant l'accalade fermante de la classe :

```ts
  // --- Lampe d'atelier ---

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  lampEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  lampOnByDefault?: boolean;

  @ApiPropertyOptional({ example: 28, description: 'Ouverture totale du faisceau en degres' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(8)
  @Max(45)
  lampBeamAngle?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  lampIntensity?: number;

  @ApiPropertyOptional({ example: 40, description: 'Au-dela de 40, le contraste hors faisceau passe sous le seuil AA' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65)
  lampDimLevel?: number;

  // --- Visibilite ---

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showStats?: boolean;

  // --- Rythme typographique ---

  @ApiPropertyOptional({ example: 'normal' })
  @IsOptional()
  @IsIn(['compact', 'normal', 'airy'])
  typeScale?: string;

  @ApiPropertyOptional({ example: 1.6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1.3)
  @Max(2.0)
  lineHeight?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  zigzagAmplitude?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(64)
  @Max(240)
  sectionSpacing?: number;

  // --- Mouvement ---

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  animationsEnabled?: boolean;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  animationSpeed?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  respectReducedMotion?: boolean;

  // --- Accent ---

  @ApiPropertyOptional({ example: 128 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(360)
  accentHue?: number;

  @ApiPropertyOptional({ example: 18, description: 'Plafonne a 30 : interdit structurellement toute couleur vive' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  accentSaturation?: number;
```

- [ ] **Étape 4 : Relancer le test**

```bash
cd backend && npx jest src/site-settings/dto/update-site-settings.dto.spec.ts
```

Attendu : 8 tests au vert.

- [ ] **Étape 5 : Vérifier le refus de bout en bout sur l'API**

Le backend doit tourner. Récupérer un jeton puis tenter une valeur interdite :

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"benyofanuel@gmail.com","password":"MOTDEPASSE_ADMIN"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:4000/api/site-settings \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"accentSaturation": 95}'
```

Attendu : `400`.

- [ ] **Étape 6 : Commit**

```bash
git add backend/src/site-settings/dto
git commit -m "feat(settings): borne les nouveaux reglages et couvre la validation"
```

---

## Task 3 : Réglages dans le backoffice

**Files:**
- Create: `backoffice/lib/contrast.ts`
- Modify: `backoffice/app/site-settings/page.tsx`

**Interfaces:**
- Consumes: `SiteSettingsDto` étendu (Task 1)
- Produces: `ratioContraste(avant: string, arriere: string): number` dans `backoffice/lib/contrast.ts`

- [ ] **Étape 1 : Créer le calcul de contraste**

Créer `backoffice/lib/contrast.ts` :

```ts
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
```

- [ ] **Étape 2 : Ajouter les quatre groupes de réglages**

Dans `backoffice/app/site-settings/page.tsx`, importer en tête :

```tsx
import { ratioContraste, melanger } from "@/lib/contrast";
```

Puis insérer dans le `<form>`, juste avant le bouton de soumission :

```tsx
{/* --- Lampe d'atelier --- */}
<fieldset className="border border-border rounded-md p-4 space-y-4">
  <legend className="text-sm font-semibold px-2">Lampe d&apos;atelier</legend>

  <label className="flex items-center gap-3 text-sm">
    <input
      type="checkbox"
      checked={data.lampEnabled}
      onChange={(e) => setData({ ...data, lampEnabled: e.target.checked })}
    />
    Lampe activée sur le site
  </label>

  <label className="flex items-center gap-3 text-sm">
    <input
      type="checkbox"
      checked={data.lampOnByDefault}
      onChange={(e) => setData({ ...data, lampOnByDefault: e.target.checked })}
    />
    Allumée dès l&apos;arrivée du visiteur
  </label>

  <div>
    <label className="block text-sm font-medium mb-1">
      Ouverture du faisceau : {data.lampBeamAngle}°
    </label>
    <input
      type="range" min={8} max={45}
      value={data.lampBeamAngle}
      onChange={(e) => setData({ ...data, lampBeamAngle: Number(e.target.value) })}
      className="w-full"
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">
      Intensité : {data.lampIntensity}%
    </label>
    <input
      type="range" min={0} max={100}
      value={data.lampIntensity}
      onChange={(e) => setData({ ...data, lampIntensity: Number(e.target.value) })}
      className="w-full"
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">
      Assombrissement hors faisceau : {data.lampDimLevel}%
    </label>
    <input
      type="range" min={0} max={65}
      value={data.lampDimLevel}
      onChange={(e) => setData({ ...data, lampDimLevel: Number(e.target.value) })}
      className="w-full"
    />
    {(() => {
      const taux = data.lampDimLevel / 100;
      const texte = melanger(data.textColor, "#0D0F11", taux);
      const fond = melanger(data.bgColor, "#0D0F11", taux);
      const ratio = ratioContraste(texte, fond);
      const conforme = ratio >= 4.5;
      return (
        <p className={`text-xs mt-1 ${conforme ? "text-muted-foreground" : "text-red-600"}`}>
          Contraste du texte hors faisceau : {ratio.toFixed(2)}:1 —{" "}
          {conforme ? "conforme AA" : "sous le seuil AA de 4.5:1"}
        </p>
      );
    })()}
  </div>
</fieldset>

{/* --- Rythme --- */}
<fieldset className="border border-border rounded-md p-4 space-y-4">
  <legend className="text-sm font-semibold px-2">Rythme</legend>

  <div>
    <label className="block text-sm font-medium mb-1">Échelle typographique</label>
    <select
      value={data.typeScale}
      onChange={(e) => setData({ ...data, typeScale: e.target.value as typeof data.typeScale })}
      className="w-full px-3 py-2 border border-border rounded-md text-sm"
    >
      <option value="compact">Compacte (ratio 1.200)</option>
      <option value="normal">Normale (ratio 1.250)</option>
      <option value="airy">Aérée (ratio 1.333)</option>
    </select>
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">
      Interligne du corps : {data.lineHeight.toFixed(2)}
    </label>
    <input
      type="range" min={1.3} max={2} step={0.05}
      value={data.lineHeight}
      onChange={(e) => setData({ ...data, lineHeight: Number(e.target.value) })}
      className="w-full"
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">
      Amplitude du zigzag : {data.zigzagAmplitude}%
    </label>
    <input
      type="range" min={0} max={100}
      value={data.zigzagAmplitude}
      onChange={(e) => setData({ ...data, zigzagAmplitude: Number(e.target.value) })}
      className="w-full"
    />
    <p className="text-xs text-muted-foreground mt-1">
      0 = colonne unique centrée · 100 = décalage maximal
    </p>
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">
      Espace entre sections : {data.sectionSpacing} px
    </label>
    <input
      type="range" min={64} max={240} step={8}
      value={data.sectionSpacing}
      onChange={(e) => setData({ ...data, sectionSpacing: Number(e.target.value) })}
      className="w-full"
    />
  </div>
</fieldset>

{/* --- Mouvement --- */}
<fieldset className="border border-border rounded-md p-4 space-y-4">
  <legend className="text-sm font-semibold px-2">Mouvement</legend>

  <label className="flex items-center gap-3 text-sm">
    <input
      type="checkbox"
      checked={data.animationsEnabled}
      onChange={(e) => setData({ ...data, animationsEnabled: e.target.checked })}
    />
    Animations activées
  </label>

  <div>
    <label className="block text-sm font-medium mb-1">
      Vitesse globale : {data.animationSpeed.toFixed(2)}×
    </label>
    <input
      type="range" min={0.5} max={2} step={0.05}
      value={data.animationSpeed}
      onChange={(e) => setData({ ...data, animationSpeed: Number(e.target.value) })}
      className="w-full"
    />
  </div>

  <label className="flex items-center gap-3 text-sm">
    <input
      type="checkbox"
      checked={data.respectReducedMotion}
      onChange={(e) => setData({ ...data, respectReducedMotion: e.target.checked })}
    />
    Respecter les préférences système de mouvement réduit
  </label>
</fieldset>

{/* --- Accent --- */}
<fieldset className="border border-border rounded-md p-4 space-y-4">
  <legend className="text-sm font-semibold px-2">Accent</legend>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium mb-1">Teinte : {data.accentHue}°</label>
      <input
        type="range" min={0} max={360}
        value={data.accentHue}
        onChange={(e) => setData({ ...data, accentHue: Number(e.target.value) })}
        className="w-full"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">
        Saturation : {data.accentSaturation}%
      </label>
      <input
        type="range" min={0} max={30}
        value={data.accentSaturation}
        onChange={(e) => setData({ ...data, accentSaturation: Number(e.target.value) })}
        className="w-full"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Plafonnée à 30 : aucune couleur vive possible
      </p>
    </div>
  </div>

  <div className="flex items-center gap-3">
    <span
      className="h-8 w-16 rounded border border-border"
      style={{ background: `hsl(${data.accentHue} ${data.accentSaturation}% 54%)` }}
    />
    <code className="text-xs text-muted-foreground">
      hsl({data.accentHue} {data.accentSaturation}% 54%)
    </code>
  </div>
</fieldset>

{/* --- Visibilité de la section Stats --- */}
<label className="flex items-center gap-3 text-sm">
  <input
    type="checkbox"
    checked={data.showStats}
    onChange={(e) => setData({ ...data, showStats: e.target.checked })}
  />
  Afficher la section Statistiques
</label>
```

- [ ] **Étape 3 : Vérifier dans le navigateur**

```bash
npm run dev:backoffice
```

Ouvrir `http://localhost:3001/site-settings`. Vérifier successivement :
- les quatre groupes apparaissent ;
- pousser « Assombrissement » à 65 fait passer la ligne de contraste en rouge, avec un ratio sous 4.5 ;
- le redescendre à 40 la repasse en gris avec un ratio d'environ 5.7 ;
- la saturation de l'accent refuse d'aller au-delà de 30 ;
- l'enregistrement renvoie le toast de succès.

- [ ] **Étape 4 : Commit**

```bash
git add backoffice/lib/contrast.ts backoffice/app/site-settings/page.tsx
git commit -m "feat(backoffice): expose les reglages lampe, rythme, mouvement et accent"
```

---

## Task 4 : Harnais de test frontend et jetons de couleur

**Files:**
- Create: `frontend/vitest.config.ts`
- Create: `frontend/lib/design/tokens.ts`
- Create: `frontend/lib/color/contrast.ts`
- Create: `frontend/lib/color/contrast.test.ts`
- Modify: `frontend/package.json` (scripts et devDependencies)

**Interfaces:**
- Consumes: rien
- Produces:
  - `PALETTE` — objet figé exposant `fond`, `surface`, `bordure`, `texteSecondaire`, `textePrincipal`, `accent`, `ombre`, `lumiere`
  - `ECHELLE_TYPO` — objet figé des ratios `{ compact: 1.2, normal: 1.25, airy: 1.333 }`
  - `luminanceRelative(hex: string): number`
  - `ratioContraste(avant: string, arriere: string): number`
  - `melanger(source: string, cible: string, taux: number): string`

- [ ] **Étape 1 : Installer Vitest**

```bash
npm install -D -w frontend vitest
```

- [ ] **Étape 2 : Configurer Vitest**

Créer `frontend/vitest.config.ts` :

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Les modules testes sont purs : aucun DOM necessaire.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
});
```

- [ ] **Étape 3 : Ajouter les scripts**

Dans `frontend/package.json`, ajouter aux `scripts` :

```json
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
```

- [ ] **Étape 4 : Écrire le test qui échoue**

Créer `frontend/lib/color/contrast.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { ratioContraste, melanger } from "./contrast";
import { PALETTE } from "@/lib/design/tokens";

describe("contraste de la palette", () => {
  it("le texte principal atteint le niveau AAA", () => {
    expect(ratioContraste(PALETTE.textePrincipal, PALETTE.fond)).toBeGreaterThanOrEqual(7);
  });

  it("le texte secondaire atteint le niveau AA", () => {
    expect(ratioContraste(PALETTE.texteSecondaire, PALETTE.fond)).toBeGreaterThanOrEqual(4.5);
  });

  it("l accent atteint le niveau AA", () => {
    expect(ratioContraste(PALETTE.accent, PALETTE.fond)).toBeGreaterThanOrEqual(4.5);
  });

  it("le texte reste conforme AA a 40% d assombrissement", () => {
    const texte = melanger(PALETTE.textePrincipal, PALETTE.ombre, 0.4);
    const fond = melanger(PALETTE.fond, PALETTE.ombre, 0.4);
    expect(ratioContraste(texte, fond)).toBeGreaterThanOrEqual(4.5);
  });

  it("le ratio d une couleur avec elle-meme vaut 1", () => {
    expect(ratioContraste("#131518", "#131518")).toBeCloseTo(1, 5);
  });

  it("le ratio noir sur blanc vaut 21", () => {
    expect(ratioContraste("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
});
```

- [ ] **Étape 5 : Lancer le test pour vérifier qu'il échoue**

```bash
npm run test -w frontend
```

Attendu : ÉCHEC — les modules `./contrast` et `@/lib/design/tokens` n'existent pas.

- [ ] **Étape 6 : Créer les jetons**

Créer `frontend/lib/design/tokens.ts` :

```ts
/**
 * Source unique de verite de l'identite visuelle.
 * Toute valeur de `globals.css` doit correspondre a ce fichier.
 */
export const PALETTE = Object.freeze({
  fond: "#131518",
  surface: "#1A1D21",
  bordure: "#22262B",
  texteSecondaire: "#8B8F8A",
  textePrincipal: "#E4E5E3",
  accent: "#7E9B76",
  /** Couleur du scrim de la lampe. */
  ombre: "#0D0F11",
  /** Voile chaud pose a l'interieur du faisceau. */
  lumiere: "#F2EFE6",
});

/** Ratios de l'echelle modulaire, indexes par le reglage `typeScale`. */
export const ECHELLE_TYPO = Object.freeze({
  compact: 1.2,
  normal: 1.25,
  airy: 1.333,
});

/** Corps de reference en pixels, avant application du reglage `fontSize`. */
export const CORPS_BASE = 17;
```

- [ ] **Étape 7 : Créer le module de contraste**

Créer `frontend/lib/color/contrast.ts` avec exactement le même contenu que `backoffice/lib/contrast.ts` créé en Task 3 :

```ts
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
```

Les deux copies sont volontaires : `backoffice` et `frontend` sont deux applications indépendantes, et `packages/shared-types` ne contient que des types, pas de code exécutable. Extraire ce module dans un paquet partagé serait une restructuration du monorepo, hors périmètre.

- [ ] **Étape 8 : Relancer le test**

```bash
npm run test -w frontend
```

Attendu : 6 tests au vert. Le quatrième est le plus important — il verrouille le plancher d'accessibilité du mode lampe.

- [ ] **Étape 9 : Commit**

```bash
git add frontend/vitest.config.ts frontend/package.json frontend/lib/design frontend/lib/color package-lock.json
git commit -m "feat(frontend): harnais Vitest et jetons de couleur verifies"
```

---

## Task 5 : Géométrie du faisceau

**Files:**
- Create: `frontend/lib/lamp/geometry.ts`
- Create: `frontend/lib/lamp/geometry.test.ts`

**Interfaces:**
- Consumes: rien
- Produces:
  - `type Point = { x: number; y: number }`
  - `type Viewport = { width: number; height: number }`
  - `angleVers(pivot: Point, cible: Point): number` — radians
  - `sommetsFaisceau(pivot, angleTete, angleMeneur, angleSuiveur, longueurTete, rayonOuverture, viewport): [Point, Point, Point, Point]`
  - `formaterSommets(sommets): string` — la chaîne de l'attribut `points`

**Convention de repère :** coordonnées écran, `y` croît vers le bas. Les angles sont en radians, `0` pointe vers la droite, `+π/2` vers le bas.

- [ ] **Étape 1 : Écrire le test qui échoue**

Créer `frontend/lib/lamp/geometry.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { angleVers, sommetsFaisceau, formaterSommets } from "./geometry";

const VIEWPORT = { width: 1440, height: 900 };
const PIVOT = { x: 1400, y: 450 };

describe("angleVers", () => {
  it("pointe vers la gauche quand la cible est a gauche", () => {
    expect(angleVers(PIVOT, { x: 200, y: 450 })).toBeCloseTo(Math.PI, 5);
  });

  it("pointe vers le haut quand la cible est au-dessus", () => {
    expect(angleVers(PIVOT, { x: 1400, y: 0 })).toBeCloseTo(-Math.PI / 2, 5);
  });

  it("pointe vers le bas quand la cible est en dessous", () => {
    expect(angleVers(PIVOT, { x: 1400, y: 900 })).toBeCloseTo(Math.PI / 2, 5);
  });

  it("renvoie un angle fini quand la cible est confondue avec le pivot", () => {
    expect(Number.isFinite(angleVers(PIVOT, PIVOT))).toBe(true);
  });
});

describe("sommetsFaisceau", () => {
  const phi = (28 / 2) * (Math.PI / 180);
  const tete = Math.PI;

  function sommets(angleTete = tete) {
    return sommetsFaisceau(
      PIVOT, angleTete, angleTete - phi, angleTete + phi, 40, 26, VIEWPORT,
    );
  }

  it("renvoie exactement quatre sommets", () => {
    expect(sommets()).toHaveLength(4);
  });

  it("projette les bords au-dela de la diagonale du viewport", () => {
    const [, C, D] = sommets();
    const diagonale = Math.hypot(VIEWPORT.width, VIEWPORT.height);
    expect(Math.hypot(C.x - PIVOT.x, C.y - PIVOT.y)).toBeGreaterThan(diagonale);
    expect(Math.hypot(D.x - PIVOT.x, D.y - PIVOT.y)).toBeGreaterThan(diagonale);
  });

  it("separe les deux bords de l ouverture de la tete", () => {
    const [A, , , B] = sommets();
    expect(Math.hypot(A.x - B.x, A.y - B.y)).toBeCloseTo(52, 5);
  });

  it("place l ouverture devant le pivot, pas dessus", () => {
    const [A, , , B] = sommets();
    const milieu = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
    expect(Math.hypot(milieu.x - PIVOT.x, milieu.y - PIVOT.y)).toBeCloseTo(40, 5);
    // tete pointant vers la gauche : l'ouverture est a gauche du pivot
    expect(milieu.x).toBeLessThan(PIVOT.x);
  });

  it("produit un quadrilatere simple, sans croisement", () => {
    const [A, C, D, B] = sommets();
    expect(segmentsSeCroisent(A, C, D, B)).toBe(false);
  });

  it("suit la tete quand elle pivote vers le haut", () => {
    const bas = sommets(Math.PI + 0.4);
    const haut = sommets(Math.PI - 0.4);
    expect(haut[1].y).toBeLessThan(bas[1].y);
  });

  it("renvoie des coordonnees finies pour tout angle", () => {
    for (let a = -Math.PI; a <= Math.PI; a += Math.PI / 8) {
      for (const p of sommets(a)) {
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
      }
    }
  });
});

describe("formaterSommets", () => {
  it("produit la chaine attendue par l attribut points", () => {
    const s = formaterSommets([
      { x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }, { x: 7, y: 8 },
    ]);
    expect(s).toBe("1,2 3,4 5,6 7,8");
  });

  it("arrondit au dixieme pour limiter la taille de l attribut", () => {
    const s = formaterSommets([
      { x: 1.23456, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }, { x: 7, y: 8 },
    ]);
    expect(s.startsWith("1.2,2 ")).toBe(true);
  });
});

/** Test d'intersection de segments, utilise pour verifier la simplicite du quadrilatere. */
function segmentsSeCroisent(
  p1: { x: number; y: number }, p2: { x: number; y: number },
  p3: { x: number; y: number }, p4: { x: number; y: number },
): boolean {
  const d = (a: typeof p1, b: typeof p1, c: typeof p1) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2);
  const d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npm run test -w frontend -- geometry
```

Attendu : ÉCHEC — `Failed to resolve import "./geometry"`.

- [ ] **Étape 3 : Écrire l'implémentation**

Créer `frontend/lib/lamp/geometry.ts` :

```ts
export type Point = { x: number; y: number };
export type Viewport = { width: number; height: number };

/** Marge appliquee a la diagonale pour garantir que le faisceau sort du cadre. */
const FACTEUR_PORTEE = 1.2;

/**
 * Angle en radians du pivot vers la cible, en coordonnees ecran (y vers le bas).
 * Renvoie Math.PI quand la cible est confondue avec le pivot : la lampe garde
 * alors son orientation neutre vers la gauche plutot que de produire NaN.
 */
export function angleVers(pivot: Point, cible: Point): number {
  const dx = cible.x - pivot.x;
  const dy = cible.y - pivot.y;
  if (dx === 0 && dy === 0) return Math.PI;
  return Math.atan2(dy, dx);
}

/**
 * Les quatre sommets du trapeze lumineux, dans l'ordre A, C, D, B :
 *   A -> C  bord meneur
 *   C -> D  bord lointain, hors cadre
 *   D -> B  bord suiveur
 *   B -> A  ouverture de la tete
 *
 * Les bords meneur et suiveur ont leur propre angle : c'est ce qui permet au
 * trapeze de changer de forme pendant une transition au lieu de se translater.
 */
export function sommetsFaisceau(
  pivot: Point,
  angleTete: number,
  angleMeneur: number,
  angleSuiveur: number,
  longueurTete: number,
  rayonOuverture: number,
  viewport: Viewport,
): [Point, Point, Point, Point] {
  const portee = Math.hypot(viewport.width, viewport.height) * FACTEUR_PORTEE;

  // Centre de l'ouverture, avance de `longueurTete` dans l'axe de la tete.
  const centre: Point = {
    x: pivot.x + Math.cos(angleTete) * longueurTete,
    y: pivot.y + Math.sin(angleTete) * longueurTete,
  };

  // Normale a l'axe de la tete, orientee du cote du bord meneur.
  const nx = Math.sin(angleTete);
  const ny = -Math.cos(angleTete);

  const A: Point = { x: centre.x + nx * rayonOuverture, y: centre.y + ny * rayonOuverture };
  const B: Point = { x: centre.x - nx * rayonOuverture, y: centre.y - ny * rayonOuverture };

  const C: Point = {
    x: pivot.x + Math.cos(angleMeneur) * portee,
    y: pivot.y + Math.sin(angleMeneur) * portee,
  };
  const D: Point = {
    x: pivot.x + Math.cos(angleSuiveur) * portee,
    y: pivot.y + Math.sin(angleSuiveur) * portee,
  };

  return [A, C, D, B];
}

/** Serialise les sommets pour l'attribut `points` d'un <polygon>. */
export function formaterSommets(sommets: readonly Point[]): string {
  return sommets
    .map((p) => `${Math.round(p.x * 10) / 10},${Math.round(p.y * 10) / 10}`)
    .join(" ");
}
```

- [ ] **Étape 4 : Relancer les tests**

```bash
npm run test -w frontend -- geometry
```

Attendu : 14 tests au vert.

- [ ] **Étape 5 : Commit**

```bash
git add frontend/lib/lamp/geometry.ts frontend/lib/lamp/geometry.test.ts
git commit -m "feat(lampe): geometrie du faisceau, couverte par ses cas limites"
```

---

## Task 6 : Ressort amorti

**Files:**
- Create: `frontend/lib/lamp/spring.ts`
- Create: `frontend/lib/lamp/spring.test.ts`

**Interfaces:**
- Consumes: rien
- Produces:
  - `type EtatRessort = { valeur: number; vitesse: number }`
  - `DT_MAX: number` — pas de temps maximal, `1/30`
  - `pasRessort(etat: EtatRessort, cible: number, omega: number, zeta: number, dt: number): EtatRessort`
  - `estImmobile(etat: EtatRessort, cible: number): boolean`
  - `differenceAngulaire(depuis: number, vers: number): number`

`differenceAngulaire` existe pour une raison précise : sans elle, quand l'angle de la tête franchit ±π, le ressort part vers la cible par le chemin long et la lampe fait un tour complet sur elle-même.

- [ ] **Étape 1 : Écrire le test qui échoue**

Créer `frontend/lib/lamp/spring.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { pasRessort, estImmobile, differenceAngulaire, DT_MAX } from "./spring";

const OMEGA = 9;
const ZETA = 0.9;
const DT = 1 / 60;

/** Fait tourner le ressort et renvoie la trace complete des valeurs. */
function simuler(cible: number, pas: number, dt = DT) {
  let etat = { valeur: 0, vitesse: 0 };
  const trace = [etat.valeur];
  for (let i = 0; i < pas; i++) {
    etat = pasRessort(etat, cible, OMEGA, ZETA, dt);
    trace.push(etat.valeur);
  }
  return { etat, trace };
}

describe("pasRessort", () => {
  it("converge vers la cible en moins d une seconde", () => {
    const { etat } = simuler(1, 60);
    expect(etat.valeur).toBeCloseTo(1, 2);
  });

  it("ne depasse pas la cible de plus de 2 pour cent", () => {
    const { trace } = simuler(1, 240);
    expect(Math.max(...trace)).toBeLessThan(1.02);
  });

  it("accelere au demarrage plutot que de bondir", () => {
    const { trace } = simuler(1, 240);
    // le premier pas ne couvre qu'une fraction infime du trajet
    expect(trace[1]).toBeLessThan(0.05);
    // et le mouvement s'amplifie ensuite
    expect(trace[2] - trace[1]).toBeGreaterThan(trace[1] - trace[0]);
  });

  it("reste stable quand l onglet a ete masque longtemps", () => {
    // dt de 5 secondes : sans bornage, l integration explose
    let etat = { valeur: 0, vitesse: 0 };
    etat = pasRessort(etat, 1, OMEGA, ZETA, 5);
    expect(Number.isFinite(etat.valeur)).toBe(true);
    expect(Math.abs(etat.valeur)).toBeLessThan(2);
  });

  it("borne le pas de temps a DT_MAX", () => {
    const grand = pasRessort({ valeur: 0, vitesse: 0 }, 1, OMEGA, ZETA, 10);
    const borne = pasRessort({ valeur: 0, vitesse: 0 }, 1, OMEGA, ZETA, DT_MAX);
    expect(grand.valeur).toBeCloseTo(borne.valeur, 10);
  });

  it("ne bouge pas quand il est deja sur sa cible", () => {
    const etat = pasRessort({ valeur: 1, vitesse: 0 }, 1, OMEGA, ZETA, DT);
    expect(etat.valeur).toBeCloseTo(1, 10);
    expect(etat.vitesse).toBeCloseTo(0, 10);
  });
});

describe("estImmobile", () => {
  it("est faux tant que le ressort voyage", () => {
    expect(estImmobile({ valeur: 0, vitesse: 0 }, 1)).toBe(false);
  });

  it("devient vrai apres convergence", () => {
    const { etat } = simuler(1, 300);
    expect(estImmobile(etat, 1)).toBe(true);
  });

  it("est faux si la valeur est arrivee mais que la vitesse subsiste", () => {
    expect(estImmobile({ valeur: 1, vitesse: 0.5 }, 1)).toBe(false);
  });
});

describe("differenceAngulaire", () => {
  it("prend le chemin court au passage de pi", () => {
    expect(differenceAngulaire(3.0, -3.0)).toBeCloseTo(0.2832, 3);
  });

  it("prend le chemin court dans l autre sens", () => {
    expect(differenceAngulaire(-3.0, 3.0)).toBeCloseTo(-0.2832, 3);
  });

  it("renvoie une difference simple loin des bords", () => {
    expect(differenceAngulaire(0.5, 1.0)).toBeCloseTo(0.5, 10);
  });

  it("ne renvoie jamais plus d un demi-tour", () => {
    for (let a = -Math.PI; a <= Math.PI; a += 0.3) {
      for (let b = -Math.PI; b <= Math.PI; b += 0.3) {
        expect(Math.abs(differenceAngulaire(a, b))).toBeLessThanOrEqual(Math.PI + 1e-9);
      }
    }
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npm run test -w frontend -- spring
```

Attendu : ÉCHEC — `Failed to resolve import "./spring"`.

- [ ] **Étape 3 : Écrire l'implémentation**

Créer `frontend/lib/lamp/spring.ts` :

```ts
export type EtatRessort = { valeur: number; vitesse: number };

/**
 * Pas de temps maximal, en secondes. Un onglet masse puis revele produit un dt
 * de plusieurs secondes ; sans ce plafond l'integration d'Euler diverge et la
 * lampe part a l'infini.
 */
export const DT_MAX = 1 / 30;

const EPSILON_VALEUR = 1e-3;
const EPSILON_VITESSE = 1e-3;

/**
 * Un pas d'integration semi-implicite d'un ressort amorti.
 *
 *   a = -omega^2 * (x - cible) - 2 * zeta * omega * v
 *
 * zeta = 0.9 place le systeme juste sous l'amortissement critique : acceleration
 * au depart, arret net, aucun rebond visible.
 */
export function pasRessort(
  etat: EtatRessort,
  cible: number,
  omega: number,
  zeta: number,
  dt: number,
): EtatRessort {
  const pas = Math.min(dt, DT_MAX);
  const acceleration =
    -(omega * omega) * (etat.valeur - cible) - 2 * zeta * omega * etat.vitesse;
  const vitesse = etat.vitesse + acceleration * pas;
  const valeur = etat.valeur + vitesse * pas;
  return { valeur, vitesse };
}

/**
 * Vrai quand le ressort est arrive et ne bouge plus. C'est la condition d'arret
 * de la boucle rAF : sans elle, la boucle tourne indefiniment et vide la
 * batterie sur une page immobile.
 */
export function estImmobile(etat: EtatRessort, cible: number): boolean {
  return (
    Math.abs(etat.valeur - cible) < EPSILON_VALEUR &&
    Math.abs(etat.vitesse) < EPSILON_VITESSE
  );
}

/**
 * Ecart angulaire le plus court entre deux angles, ramene dans (-pi, pi].
 * Sans cela, une tete a 3.0 rad visant -3.0 rad ferait presque un tour complet
 * au lieu des 0.28 rad qui les separent reellement.
 */
export function differenceAngulaire(depuis: number, vers: number): number {
  let d = (vers - depuis) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}
```

- [ ] **Étape 4 : Relancer les tests**

```bash
npm run test -w frontend
```

Attendu : l'ensemble des suites au vert — contraste, géométrie, ressort.

- [ ] **Étape 5 : Commit**

```bash
git add frontend/lib/lamp/spring.ts frontend/lib/lamp/spring.test.ts
git commit -m "feat(lampe): ressort amorti avec bornage du pas et chemin angulaire court"
```

---

## Task 7 : Système visuel dans la feuille de style

**Files:**
- Modify: `frontend/app/globals.css:52-124` (blocs `:root` et `.dark`)
- Modify: `frontend/app/globals.css` (ajout d'un bloc typographie et rythme en fin de fichier)

**Interfaces:**
- Consumes: `PALETTE` et `ECHELLE_TYPO` de `frontend/lib/design/tokens.ts` (Task 4) — les valeurs doivent correspondre exactement
- Produces: variables CSS `--fond`, `--surface`, `--bordure`, `--texte-secondaire`, `--texte`, `--accent`, `--ombre`, `--lumiere`, `--ratio`, `--corps`, `--meta`, `--chapo`, `--h3`, `--h2`, `--h1`, `--espace-section`, `--duree`, et les classes `.mesure`, `.meta`, `.section-shell`

- [ ] **Étape 1 : Remplacer les deux blocs de palette**

Dans `frontend/app/globals.css`, remplacer intégralement le bloc `:root { … }` commençant ligne 52 **et** le bloc `.dark { … }` par :

```css
/* Identite sombre. Source de verite : frontend/lib/design/tokens.ts */
:root,
.dark {
  /* Jetons bruts */
  --fond: #131518;
  --surface: #1a1d21;
  --bordure: #22262b;
  --texte-secondaire: #8b8f8a;
  --texte: #e4e5e3;
  --accent: #7e9b76;
  --ombre: #0d0f11;
  --lumiere: #f2efe6;

  /* Mapping shadcn : conserve pour les composants existants */
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
  --input: var(--bordure);
  --ring: var(--accent);
  --radius: 0.25rem;
}
```

Le rayon passe de `0.625rem` à `0.25rem` : des angles très arrondis lisent comme « aimable », pas comme « précis ».

- [ ] **Étape 2 : Ajouter le bloc typographie et rythme**

Ajouter à la fin de `frontend/app/globals.css` :

```css
/* ---------------------------------------------------------------
   Echelle typographique
   Ratio par defaut 1.250. Surcharge par le reglage `typeScale`,
   injecte sur <html> par app/layout.tsx.
   --------------------------------------------------------------- */
:root {
  --ratio: 1.25;
  --corps: var(--portfolio-font-size, 17px);
  --interligne: var(--portfolio-line-height, 1.6);

  --meta: calc(var(--corps) / var(--ratio));
  --chapo: calc(var(--corps) * var(--ratio));
  --h3: calc(var(--corps) * var(--ratio) * var(--ratio));
  --h2: calc(var(--corps) * var(--ratio) * var(--ratio) * var(--ratio));
  --h1: calc(
    var(--corps) * var(--ratio) * var(--ratio) * var(--ratio) * var(--ratio) *
      var(--ratio)
  );

  /* Rythme vertical, grille de 8 px */
  --espace-1: 8px;
  --espace-2: 16px;
  --espace-3: 24px;
  --espace-4: 40px;
  --espace-5: 64px;
  --espace-section: var(--portfolio-section-spacing, 120px);

  /* Mouvement */
  --duree: calc(400ms * var(--portfolio-animation-speed, 1));
  --courbe: cubic-bezier(0.22, 1, 0.36, 1);
}

/* Le mobile applique les deux tiers de l'espace inter-sections. */
@media (max-width: 899px) {
  :root {
    --espace-section: calc(var(--portfolio-section-spacing, 120px) * 0.667);
  }
}

body {
  font-size: var(--corps);
  line-height: var(--interligne);
  font-variant-numeric: tabular-nums;
}

/* Mesure de lecture : 66 caracteres, l'optimum de Bringhurst. */
.mesure {
  max-width: 66ch;
}

/* Metadonnees : dates, versions, etiquettes techniques. */
.meta {
  font-family: var(--font-mono);
  font-size: var(--meta);
  line-height: 1.4;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--texte-secondaire);
}

h1 {
  font-size: var(--h1);
  line-height: 1.1;
  letter-spacing: -0.02em;
}
h2 {
  font-size: var(--h2);
  line-height: 1.25;
  letter-spacing: -0.01em;
}
h3 {
  font-size: var(--h3);
  line-height: 1.35;
}

/* ---------------------------------------------------------------
   Entree des blocs : le seul mouvement du contenu.
   --------------------------------------------------------------- */
.reveal {
  opacity: 0;
  transform: translateY(8px);
}
.reveal-visible {
  opacity: 1;
  transform: none;
  transition:
    opacity var(--duree) var(--courbe),
    transform var(--duree) var(--courbe);
}

@media (prefers-reduced-motion: reduce) {
  :root:not([data-mouvement="force"]) .reveal {
    opacity: 1;
    transform: none;
  }
  :root:not([data-mouvement="force"]) .reveal-visible {
    transition: none;
  }
}

/* ---------------------------------------------------------------
   Couche lumineuse. Inerte : ne recoit jamais d'evenement.
   --------------------------------------------------------------- */
.beam-layer {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 40;
}

/* Le titre eclaire, superpose au titre en retrait. */
.titre-double {
  position: relative;
  display: inline-block;
}
.titre-eclaire {
  position: absolute;
  inset: 0;
  color: var(--texte);
  pointer-events: none;
}
.titre-retrait {
  color: var(--bordure);
}
```

- [ ] **Étape 3 : Retirer l'ancienne règle de séparation**

Chercher `section-separator` dans `frontend/app/globals.css` et supprimer sa définition : le rythme vertical remplace les filets de séparation.

```bash
grep -n "section-separator" frontend/app/globals.css frontend/components/portfolio/*.tsx
```

Supprimer chaque occurrence trouvée, dans le CSS comme dans les composants.

- [ ] **Étape 4 : Vérifier**

```bash
npm run dev:frontend
```

Ouvrir `http://localhost:3000`. Le fond doit être `#131518`, le texte blanc cassé. La mise en page est encore l'ancienne — c'est attendu, seules les couleurs et l'échelle ont changé.

- [ ] **Étape 5 : Commit**

```bash
git add frontend/app/globals.css frontend/components/portfolio
git commit -m "feat(frontend): identite sombre, echelle modulaire et rythme de 8px"
```

---

## Task 8 : Polices Plex et injection des réglages

**Files:**
- Modify: `frontend/app/layout.tsx:1-20` (imports de polices)
- Modify: `frontend/app/layout.tsx:57-120` (construction des variables et rendu)
- Modify: `frontend/components/portfolio/header.tsx` (retrait du sélecteur de thème)
- Delete: `frontend/components/portfolio/theme-toggle.tsx`

**Interfaces:**
- Consumes: `SiteSettingsDto` étendu (Task 1), `ECHELLE_TYPO` (Task 4)
- Produces: variables CSS sur `<body>` — `--portfolio-bg`, `--portfolio-text`, `--portfolio-font-size`, `--portfolio-line-height`, `--portfolio-section-spacing`, `--portfolio-zigzag`, `--portfolio-animation-speed`, `--ratio`, `--accent` ; attribut `data-mouvement` sur `<html>`

Le site n'a plus qu'un thème. Le sélecteur clair/sombre disparaît : maintenir deux thèmes obligerait à calibrer deux fois chaque état du faisceau, pour un bénéfice nul sur une identité qui est sombre par nature.

- [ ] **Étape 1 : Remplacer les imports de polices**

Dans `frontend/app/layout.tsx`, remplacer la ligne d'import de `next/font/google` et les deux déclarations de police par :

```tsx
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { ECHELLE_TYPO } from "@/lib/design/tokens";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const POLICE_PAR_DEFAUT = "IBM Plex Sans";
```

Puis remplacer `fontMono.variable, figtree.variable` dans le `className` de `<html>` par `plexMono.variable, plexSans.variable`.

Et remplacer la constante `DEFAULT_FONT` par `POLICE_PAR_DEFAUT` partout où elle apparaît.

- [ ] **Étape 2 : Étendre la construction des variables**

Dans `RootLayout`, à l'intérieur du `try`, après le bloc existant qui remplit `styleVars`, ajouter :

```tsx
    // Echelle typographique
    styleVars["--ratio"] = String(ECHELLE_TYPO[settings.typeScale] ?? ECHELLE_TYPO.normal);
    styleVars["--portfolio-line-height"] = String(settings.lineHeight);
    styleVars["--portfolio-section-spacing"] = `${settings.sectionSpacing}px`;
    styleVars["--portfolio-zigzag"] = String(settings.zigzagAmplitude / 100);

    // Mouvement
    styleVars["--portfolio-animation-speed"] = String(
      settings.animationsEnabled ? settings.animationSpeed : 0.001,
    );

    // Accent, borne par le DTO a 30% de saturation
    styleVars["--accent"] = `hsl(${settings.accentHue} ${settings.accentSaturation}% 54%)`;
```

Et déclarer avant le `try`, à côté de `defaultLanguage` :

```tsx
  let respecterMouvementReduit = true;
```

puis dans le `try`, après `defaultLanguage` :

```tsx
    respecterMouvementReduit = settings.respectReducedMotion;
```

- [ ] **Étape 3 : Poser l'attribut de mouvement sur `<html>`**

Sur la balise `<html>`, ajouter :

```tsx
      data-mouvement={respecterMouvementReduit ? undefined : "force"}
```

La règle CSS `:root:not([data-mouvement="force"])` de la Task 7 neutralise donc les animations sous `prefers-reduced-motion`, sauf si l'administrateur a explicitement décoché le respect des préférences système.

- [ ] **Étape 4 : Forcer le thème unique**

Remplacer `<ThemeProvider>` par :

```tsx
        <ThemeProvider forcedTheme="dark">
```

- [ ] **Étape 5 : Retirer le sélecteur de thème**

```bash
grep -rn "ThemeToggle\|theme-toggle" frontend/components frontend/app
```

Supprimer chaque import et chaque usage trouvé, puis supprimer le fichier :

```bash
rm frontend/components/portfolio/theme-toggle.tsx
```

- [ ] **Étape 6 : Vérifier**

```bash
npm run dev:frontend
```

Sur `http://localhost:3000`, inspecter `<body>` dans les outils de développement : les variables `--ratio`, `--accent`, `--portfolio-section-spacing` doivent être présentes. La police doit être IBM Plex Sans.

Puis vérifier que les réglages descendent réellement : dans le backoffice, passer l'échelle typographique à « Aérée », enregistrer, recharger le frontend. Les titres doivent grossir.

```bash
npm run typecheck -w frontend
```

Attendu : aucune erreur.

- [ ] **Étape 7 : Commit**

```bash
git add frontend/app/layout.tsx frontend/components/portfolio
git commit -m "feat(frontend): polices Plex, injection des reglages et theme unique"
```

---

## Task 9 : Contexte de la lampe et déclaration des cibles

**Files:**
- Create: `frontend/lib/lamp/lamp-context.tsx`

**Interfaces:**
- Consumes: rien
- Produces:
  - `LampProvider` — props `{ reglages: ReglagesLampe; children: React.ReactNode }`
  - `type ReglagesLampe = { activee: boolean; allumeeParDefaut: boolean; ouverture: number; intensite: number; assombrissement: number }`
  - `useLampe(): { activee, allumee, basculer, cibleRef, cibles, reglages }`
  - `useBeamTarget(): (el: HTMLElement | null) => void` — callback ref à poser sur la zone éclairable d'une section

`cibleRef` est une `MutableRefObject<HTMLElement | null>` : le moteur d'animation la lit à chaque image sans provoquer de re-rendu.

- [ ] **Étape 1 : Créer le contexte**

Créer `frontend/lib/lamp/lamp-context.tsx` :

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

export type ReglagesLampe = {
  activee: boolean;
  allumeeParDefaut: boolean;
  /** Ouverture totale du faisceau en degres. */
  ouverture: number;
  /** 0 a 100. */
  intensite: number;
  /** 0 a 100. */
  assombrissement: number;
};

type ValeurContexte = {
  activee: boolean;
  allumee: boolean;
  basculer: () => void;
  cibleRef: MutableRefObject<HTMLElement | null>;
  /** Registre des zones eclairables declarees par les sections. */
  cibles: MutableRefObject<Set<HTMLElement>>;
  reglages: ReglagesLampe;
};

const Contexte = createContext<ValeurContexte | null>(null);

export function LampProvider({
  reglages,
  children,
}: {
  reglages: ReglagesLampe;
  children: React.ReactNode;
}) {
  const [allumee, setAllumee] = useState(reglages.allumeeParDefaut);
  const cibleRef = useRef<HTMLElement | null>(null);
  const cibles = useRef<Set<HTMLElement>>(new Set());

  const basculer = useCallback(() => setAllumee((v) => !v), []);

  // --- Cible visible ---
  // Une seule instance d'observateur pour toutes les sections. On retient
  // l'element dont le centre est le plus proche du centre du viewport.
  useEffect(() => {
    if (!reglages.activee) return;

    const choisir = () => {
      const centreEcran = window.innerHeight / 2;
      let meilleur: HTMLElement | null = null;
      let meilleureDistance = Infinity;
      for (const el of cibles.current) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        const distance = Math.abs(r.top + r.height / 2 - centreEcran);
        if (distance < meilleureDistance) {
          meilleureDistance = distance;
          meilleur = el;
        }
      }
      if (meilleur) cibleRef.current = meilleur;
    };

    choisir();
    window.addEventListener("scroll", choisir, { passive: true });
    window.addEventListener("resize", choisir);
    return () => {
      window.removeEventListener("scroll", choisir);
      window.removeEventListener("resize", choisir);
    };
  }, [reglages.activee]);

  // --- Cible focalisee ---
  // En navigation au clavier, le faisceau doit suivre le focus. Sans cela, la
  // lampe eclaire une section pendant que le focus est ailleurs, et le mode
  // devient inutilisable au Tab.
  useEffect(() => {
    if (!reglages.activee) return;
    const surFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && typeof el.getBoundingClientRect === "function") {
        cibleRef.current = el;
      }
    };
    document.addEventListener("focusin", surFocus);
    return () => document.removeEventListener("focusin", surFocus);
  }, [reglages.activee]);

  const valeur = useMemo<ValeurContexte>(
    () => ({ activee: reglages.activee, allumee, basculer, cibleRef, cibles, reglages }),
    [reglages, allumee, basculer],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useLampe(): ValeurContexte {
  const v = useContext(Contexte);
  if (!v) throw new Error("useLampe doit etre utilise dans un LampProvider");
  return v;
}

/**
 * Declare la zone eclairable d'une section. A poser en callback ref :
 *   const cible = useBeamTarget();
 *   <div ref={cible}>…</div>
 */
export function useBeamTarget() {
  const { cibleRef, cibles } = useLampe();
  const enregistre = useRef<HTMLElement | null>(null);

  return useCallback(
    (el: HTMLElement | null) => {
      if (enregistre.current) cibles.current.delete(enregistre.current);
      enregistre.current = el;
      if (el) {
        cibles.current.add(el);
        if (!cibleRef.current) cibleRef.current = el;
      }
    },
    [cibleRef, cibles],
  );
}
```

Le registre passe par le contexte plutot que par une variable de module. Un
registre global fonctionnerait tant qu'il n'existe qu'un seul `LampProvider`,
mais il se remplirait silencieusement de doublons des qu'un test ou une seconde
page en monterait un deuxieme.

- [ ] **Étape 2 : Vérifier la compilation**

```bash
npm run typecheck -w frontend
```

Attendu : aucune erreur.

- [ ] **Étape 3 : Commit**

```bash
git add frontend/lib/lamp/lamp-context.tsx
git commit -m "feat(lampe): contexte, cible visible et suivi du focus clavier"
```

---

## Task 10 : Moteur d'animation et couche lumineuse

**Files:**
- Create: `frontend/lib/lamp/use-lamp-engine.ts`
- Create: `frontend/components/lamp/beam-layer.tsx`

**Interfaces:**
- Consumes: `sommetsFaisceau`, `formaterSommets`, `angleVers` (Task 5) ; `pasRessort`, `estImmobile`, `differenceAngulaire`, `DT_MAX` (Task 6) ; `useLampe` (Task 9)
- Produces:
  - `type RefsLampe = { trou: RefObject<SVGPolygonElement | null>; voile: RefObject<SVGPolygonElement | null>; tete: RefObject<SVGGElement | null> }`
  - `useLampEngine(refs: RefsLampe): void`
  - `BeamLayer` — props `{ trou, voile }`, ne possède pas le moteur

Trois ressorts, comme le prévoit la spec : la tête à ω₀ = 9, le bord meneur à 12, le bord suiveur à 7. Ce sont les deux dernières valeurs qui font changer le trapèze de forme pendant une transition au lieu de le translater.

- [ ] **Étape 1 : Écrire le moteur**

Créer `frontend/lib/lamp/use-lamp-engine.ts` :

```ts
"use client";

import { useEffect, type RefObject } from "react";
import { useLampe } from "./lamp-context";
import { angleVers, formaterSommets, sommetsFaisceau } from "./geometry";
import { differenceAngulaire, estImmobile, pasRessort } from "./spring";

export type RefsLampe = {
  trou: RefObject<SVGPolygonElement | null>;
  voile: RefObject<SVGPolygonElement | null>;
  tete: RefObject<SVGGElement | null>;
};

const OMEGA_TETE = 9;
const OMEGA_MENEUR = 12;
const OMEGA_SUIVEUR = 7;
const ZETA = 0.9;

/** Distance du pivot a l'ouverture de la tete, en pixels. */
const LONGUEUR_TETE = 44;
/** Demi-hauteur de l'ouverture, en pixels. */
const RAYON_OUVERTURE = 26;
/** Largeur du rail occupe par le bras, en pixels. */
const RAIL = 48;

export function useLampEngine(refs: RefsLampe) {
  const { activee, allumee, cibleRef, reglages } = useLampe();

  useEffect(() => {
    if (!activee || !allumee) return;

    const mouvementReduit = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const phi = ((reglages.ouverture / 2) * Math.PI) / 180;

    let tete = { valeur: Math.PI, vitesse: 0 };
    let meneur = { valeur: Math.PI - phi, vitesse: 0 };
    let suiveur = { valeur: Math.PI + phi, vitesse: 0 };

    let image = 0;
    let dernierTemps = 0;
    let enCours = true;

    const pivot = () => ({
      x: window.innerWidth - RAIL / 2,
      y: window.innerHeight / 2,
    });

    const cible = () => {
      const el = cibleRef.current;
      if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    const peindre = () => {
      const p = pivot();
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const sommets = sommetsFaisceau(
        p, tete.valeur, meneur.valeur, suiveur.valeur,
        LONGUEUR_TETE, RAYON_OUVERTURE, viewport,
      );
      const points = formaterSommets(sommets);
      refs.trou.current?.setAttribute("points", points);
      refs.voile.current?.setAttribute("points", points);
      refs.tete.current?.setAttribute(
        "transform",
        `rotate(${(tete.valeur * 180) / Math.PI} ${p.x} ${p.y})`,
      );
    };

    const boucle = (temps: number) => {
      if (!enCours) return;
      const dt = dernierTemps ? (temps - dernierTemps) / 1000 : 1 / 60;
      dernierTemps = temps;

      const p = pivot();
      const brut = angleVers(p, cible());
      // On vise par le chemin angulaire le plus court, sinon la tete peut
      // faire un tour complet au passage de +/-pi.
      const viseeTete = tete.valeur + differenceAngulaire(tete.valeur, brut);

      tete = pasRessort(tete, viseeTete, OMEGA_TETE, ZETA, dt);
      meneur = pasRessort(meneur, viseeTete - phi, OMEGA_MENEUR, ZETA, dt);
      suiveur = pasRessort(suiveur, viseeTete + phi, OMEGA_SUIVEUR, ZETA, dt);

      peindre();

      const arrive =
        estImmobile(tete, viseeTete) &&
        estImmobile(meneur, viseeTete - phi) &&
        estImmobile(suiveur, viseeTete + phi);

      if (arrive) {
        image = 0;
        dernierTemps = 0;
        return; // la boucle s'arrete : rien ne bouge, rien ne consomme
      }
      image = requestAnimationFrame(boucle);
    };

    const relancer = () => {
      if (!enCours) return;
      if (mouvementReduit) {
        // Pas d'animation : on saute directement a la position finale.
        const brut = angleVers(pivot(), cible());
        tete = { valeur: brut, vitesse: 0 };
        meneur = { valeur: brut - phi, vitesse: 0 };
        suiveur = { valeur: brut + phi, vitesse: 0 };
        peindre();
        return;
      }
      if (!image) {
        dernierTemps = 0;
        image = requestAnimationFrame(boucle);
      }
    };

    const surVisibilite = () => {
      if (document.hidden) {
        cancelAnimationFrame(image);
        image = 0;
      } else {
        relancer();
      }
    };

    relancer();
    window.addEventListener("scroll", relancer, { passive: true });
    window.addEventListener("resize", relancer);
    document.addEventListener("focusin", relancer);
    document.addEventListener("visibilitychange", surVisibilite);

    return () => {
      enCours = false;
      cancelAnimationFrame(image);
      window.removeEventListener("scroll", relancer);
      window.removeEventListener("resize", relancer);
      document.removeEventListener("focusin", relancer);
      document.removeEventListener("visibilitychange", surVisibilite);
    };
  }, [activee, allumee, reglages.ouverture, cibleRef, refs]);
}
```

- [ ] **Étape 2 : Écrire la couche lumineuse**

Créer `frontend/components/lamp/beam-layer.tsx` :

```tsx
"use client";

import type { RefObject } from "react";
import { useLampe } from "@/lib/lamp/lamp-context";
import { PALETTE } from "@/lib/design/tokens";

export function BeamLayer({
  trou,
  voile,
}: {
  trou: RefObject<SVGPolygonElement | null>;
  voile: RefObject<SVGPolygonElement | null>;
}) {
  const { activee, allumee, reglages } = useLampe();

  if (!activee || !allumee) return null;

  return (
    <svg className="beam-layer" aria-hidden="true" focusable="false">
      <defs>
        <mask id="faisceau">
          <rect width="100%" height="100%" fill="white" />
          {/* Noir = perce le scrim. Bords parfaitement nets, aucun flou. */}
          <polygon ref={trou} points="0,0 0,0 0,0 0,0" fill="black" />
        </mask>
      </defs>

      {/* L'ombre */}
      <rect
        width="100%"
        height="100%"
        fill={PALETTE.ombre}
        opacity={reglages.assombrissement / 100}
        mask="url(#faisceau)"
      />

      {/* La lumiere chaude, posee a l'interieur du faisceau */}
      <polygon
        ref={voile}
        points="0,0 0,0 0,0 0,0"
        fill={PALETTE.lumiere}
        opacity={(reglages.intensite / 100) * 0.12}
        style={{ mixBlendMode: "plus-lighter" }}
      />
    </svg>
  );
}
```

`BeamLayer` ne possède ni les refs ni le moteur : il reçoit les deux polygones à peindre et se contente de les rendre. La ref de la tête vit dans `WorkLamp`, et les trois sont réunies par `LampStage` en Task 11, seul endroit qui appelle `useLampEngine`. Sans cette séparation, deux composants frères se disputeraient la propriété des mêmes refs.

- [ ] **Étape 3 : Vérifier la compilation**

```bash
npm run typecheck -w frontend
```

Attendu : aucune erreur.

- [ ] **Étape 4 : Commit**

```bash
git add frontend/lib/lamp/use-lamp-engine.ts frontend/components/lamp/beam-layer.tsx
git commit -m "feat(lampe): moteur a trois ressorts et couche lumineuse masquee"
```

---

## Task 11 : L'objet lampe et sa scène

**Files:**
- Create: `frontend/components/lamp/work-lamp.tsx`
- Create: `frontend/components/lamp/lamp-stage.tsx`

**Interfaces:**
- Consumes: `RefsLampe`, `useLampEngine` (Task 10) ; `BeamLayer` (Task 10) ; `useLampe` (Task 9)
- Produces:
  - `WorkLamp` — props `{ tete: RefObject<SVGGElement | null> }`
  - `LampStage` — sans props ; possède les trois refs et appelle `useLampEngine`

`LampStage` est le seul propriétaire des refs. C'est lui qu'on monte dans la page.

Les cotes du SVG correspondent aux constantes du moteur : `LONGUEUR_TETE = 44`, `RAYON_OUVERTURE = 26`, `RAIL = 48`. Toute modification ici doit être reportée dans `use-lamp-engine.ts`, sinon le faisceau ne sortira plus de l'ouverture.

- [ ] **Étape 1 : Écrire l'objet**

Créer `frontend/components/lamp/work-lamp.tsx` :

```tsx
"use client";

import type { RefObject } from "react";
import { useLampe } from "@/lib/lamp/lamp-context";

const CORPS = "#16191D";      // noir mat
const PIVOT_CORPS = "#1E2126"; // bouton molete
const INTERIEUR = "#EDEAE3";   // blanc poli mat du diffuseur
const BISEAU = "#3A3F45";      // fin lisere clair du bord

export function WorkLamp({ tete }: { tete: RefObject<SVGGElement | null> }) {
  const { activee, allumee } = useLampe();
  if (!activee) return null;

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      {/* --- Groupe fixe : le bras est un axe de reference, il ne pivote pas --- */}
      <g>
        {/* Bras tubulaire, colle au bord droit, sortant du cadre en bas */}
        <rect
          x="calc(100% - 30px)" y="0" width="12" height="100%"
          fill={CORPS}
        />
        {/* Levier de verrouillage */}
        <rect
          x="calc(100% - 40px)" y="calc(50% - 4px)" width="10" height="8"
          rx="2" fill={PIVOT_CORPS}
        />
        {/* Bouton molete : le pivot visuel, 14 crans */}
        <g>
          <circle
            cx="calc(100% - 24px)" cy="50%" r="11"
            fill={PIVOT_CORPS} stroke={BISEAU} strokeWidth="1"
          />
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={`calc(100% - ${24 - Math.cos(a) * 7}px)`}
                y1={`calc(50% + ${Math.sin(a) * 7}px)`}
                x2={`calc(100% - ${24 - Math.cos(a) * 10}px)`}
                y2={`calc(50% + ${Math.sin(a) * 10}px)`}
                stroke={BISEAU} strokeWidth="1"
              />
            );
          })}
        </g>
        {/* Anneau guide-cable : le seul point colore de l'objet */}
        <circle
          cx="calc(100% - 24px)" cy="calc(50% - 28px)" r="7"
          fill="none" stroke="var(--accent)" strokeWidth="2.5"
        />
      </g>

      {/* --- Groupe tete : pivote autour du bouton molete --- */}
      {/* Le transform est ecrit par useLampEngine a chaque image. */}
      <g ref={tete}>
        {/* Corps du projecteur, pointant vers la gauche au repos */}
        <path
          d="M calc(100% - 24px) calc(50% - 14px)
             L calc(100% - 68px) calc(50% - 26px)
             L calc(100% - 68px) calc(50% + 26px)
             L calc(100% - 24px) calc(50% + 14px) Z"
          fill={CORPS}
        />
        {/* Interieur du diffuseur : visible seulement lampe allumee */}
        <line
          x1="calc(100% - 68px)" y1="calc(50% - 26px)"
          x2="calc(100% - 68px)" y2="calc(50% + 26px)"
          stroke={allumee ? INTERIEUR : BISEAU}
          strokeWidth={allumee ? 4 : 2}
        />
        {/* Biseau du bord */}
        <line
          x1="calc(100% - 69px)" y1="calc(50% - 27px)"
          x2="calc(100% - 69px)" y2="calc(50% + 27px)"
          stroke={BISEAU} strokeWidth="1"
        />
      </g>
    </svg>
  );
}
```

**Attention :** SVG n'accepte pas `calc()` dans les attributs de géométrie. Si le rendu est vide, c'est cette limite qui frappe. Le remède est de passer par un `viewBox` en coordonnées pixel et de positionner le SVG en `position: fixed` avec `width`/`height` réels, puis de calculer les coordonnées en JavaScript depuis `window.innerWidth`. Implémenter directement cette seconde forme :

```tsx
const [taille, setTaille] = useState({ w: 0, h: 0 });
useEffect(() => {
  const maj = () => setTaille({ w: window.innerWidth, h: window.innerHeight });
  maj();
  window.addEventListener("resize", maj);
  return () => window.removeEventListener("resize", maj);
}, []);
if (!taille.w) return null;
const px = taille.w - 24;  // centre du pivot
const py = taille.h / 2;
```

et remplacer chaque `calc(100% - Npx)` par `px - (N - 24)` et chaque `calc(50% ± Npx)` par `py ± N`. Le `<svg>` porte alors `viewBox={\`0 0 ${taille.w} ${taille.h}\`}`.

- [ ] **Étape 2 : Écrire la scène**

Créer `frontend/components/lamp/lamp-stage.tsx` :

```tsx
"use client";

import { useRef } from "react";
import { useLampEngine } from "@/lib/lamp/use-lamp-engine";
import { BeamLayer } from "./beam-layer";
import { WorkLamp } from "./work-lamp";

/**
 * Seul proprietaire des refs de la lampe et seul appelant du moteur.
 * Monte la couche lumineuse sous l'objet : le faisceau part de la tete.
 */
export function LampStage() {
  const trou = useRef<SVGPolygonElement | null>(null);
  const voile = useRef<SVGPolygonElement | null>(null);
  const tete = useRef<SVGGElement | null>(null);

  useLampEngine({ trou, voile, tete });

  return (
    <>
      <BeamLayer trou={trou} voile={voile} />
      <WorkLamp tete={tete} />
    </>
  );
}
```

- [ ] **Étape 3 : Vérifier la compilation**

```bash
npm run typecheck -w frontend
```

Attendu : aucune erreur.

- [ ] **Étape 4 : Commit**

```bash
git add frontend/components/lamp
git commit -m "feat(lampe): objet SVG articule et scene proprietaire des refs"
```

---

## Task 12 : Interrupteur et branchement dans la page

**Files:**
- Create: `frontend/components/lamp/lamp-switch.tsx`
- Modify: `frontend/app/page.tsx`

**Interfaces:**
- Consumes: `useLampe` (Task 9), `LampStage` (Task 11)
- Produces: `LampSwitch` — sans props

- [ ] **Étape 1 : Écrire l'interrupteur**

Créer `frontend/components/lamp/lamp-switch.tsx` :

```tsx
"use client";

import { useLampe } from "@/lib/lamp/lamp-context";

export function LampSwitch() {
  const { activee, allumee, basculer } = useLampe();
  if (!activee) return null;

  return (
    <button
      type="button"
      onClick={basculer}
      aria-pressed={allumee}
      className="meta fixed bottom-8 right-16 z-[60] rounded border px-4 py-2
                 transition-colors focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        borderColor: allumee ? "var(--accent)" : "var(--bordure)",
        color: allumee ? "var(--accent)" : "var(--texte-secondaire)",
        background: "var(--surface)",
      }}
    >
      {allumee ? "Éteindre la lampe" : "Allumer la lampe"}
    </button>
  );
}
```

- [ ] **Étape 2 : Brancher dans la page**

Dans `frontend/app/page.tsx`, ajouter les imports :

```tsx
import { LampProvider } from "@/lib/lamp/lamp-context";
import { LampStage } from "@/components/lamp/lamp-stage";
import { LampSwitch } from "@/components/lamp/lamp-switch";
```

Envelopper le contenu de `<main>` et retirer `<Confetti />` :

```tsx
  return (
    <LampProvider
      reglages={{
        activee: s.lampEnabled,
        allumeeParDefaut: s.lampOnByDefault,
        ouverture: s.lampBeamAngle,
        intensite: s.lampIntensity,
        assombrissement: s.lampDimLevel,
      }}
    >
      <main className="min-h-screen">
        <SectionToastObserver />
        <Header siteSettings={s} personalInfo={data.personalInfo} />

        {/* Conserver ici les blocs <ScrollAnimate> existants a l'identique.
            Ils sont remplaces par des <SectionShell> en Task 14 ; a ce stade on
            ne fait qu'envelopper la page pour brancher la lampe. */}

        <Footer personalInfo={data.personalInfo} />
        <ToastNotification message={s.toastMessage} delayMs={s.toastDelayMs} />
      </main>
      <LampStage />
      <LampSwitch />
    </LampProvider>
  );
```

Supprimer l'import de `Confetti` et le fichier :

```bash
rm frontend/components/portfolio/confetti.tsx
npm uninstall -w frontend canvas-confetti
```

- [ ] **Étape 3 : Vérifier dans le navigateur**

```bash
npm run dev:frontend
```

Sur `http://localhost:3000`, vérifier point par point :

- l'objet lampe apparaît collé au bord droit, à mi-hauteur ;
- l'anneau est vert lichen, c'est le seul élément coloré de l'objet ;
- le bouton « Allumer la lampe » est en bas à droite ;
- au clic, la page s'assombrit et un trapèze de lumière aux bords nets apparaît ;
- en faisant défiler, la tête pivote et le faisceau suit la section lue ;
- pendant la transition, le trapèze **change de forme** — le bord meneur part avant le suiveur ;
- au `Tab`, le faisceau saute sur l'élément focalisé ;
- l'interrupteur est atteignable au clavier et son anneau de focus est visible ;
- dans l'onglet Performances des outils de développement, l'activité JavaScript retombe à zéro quelques centaines de millisecondes après l'arrêt du défilement.

Puis, dans les préférences système, activer la réduction des animations et recharger : la lampe doit sauter d'une section à l'autre sans transition.

- [ ] **Étape 4 : Commit**

```bash
git add frontend/components/lamp/lamp-switch.tsx frontend/app/page.tsx frontend/package.json package-lock.json
git commit -m "feat(lampe): interrupteur accessible, branchement et retrait du confetti"
```

---

## Task 13 : Observateur partagé et coquille de section

**Files:**
- Create: `frontend/lib/use-reveal.ts`
- Create: `frontend/components/portfolio/section-shell.tsx`

Les composants `scroll-animate.tsx` et `section-wrapper.tsx` ne sont **pas**
supprimés ici : les sections en dépendent encore. Leur suppression appartient à
la Task 14, une fois les sections réécrites.

**Interfaces:**
- Consumes: `useBeamTarget` (Task 9)
- Produces:
  - `useReveal(): (el: HTMLElement | null) => void` — callback ref
  - `SectionShell` — props `{ id: string; titre: string; index: number; children: React.ReactNode }`

`index` est l'ordre de la section dans la page, à partir de 1. Sa parité décide du côté du zigzag : impair à gauche, pair à droite.

- [ ] **Étape 1 : Écrire l'observateur partagé**

Créer `frontend/lib/use-reveal.ts` :

```ts
"use client";

import { useCallback, useRef } from "react";

/**
 * Une seule instance d'IntersectionObserver pour toute la page, partagee par
 * tous les blocs. L'ancien ScrollAnimate en creait une par bloc, avec des
 * seuils qui pouvaient diverger d'une section a l'autre.
 */
let observateur: IntersectionObserver | null = null;

function obtenirObservateur(): IntersectionObserver {
  if (observateur) return observateur;
  observateur = new IntersectionObserver(
    (entrees) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        entree.target.classList.add("reveal-visible");
        observateur?.unobserve(entree.target);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );
  return observateur;
}

export function useReveal() {
  const precedent = useRef<HTMLElement | null>(null);

  return useCallback((el: HTMLElement | null) => {
    if (precedent.current) obtenirObservateur().unobserve(precedent.current);
    precedent.current = el;
    if (el) {
      el.classList.add("reveal");
      obtenirObservateur().observe(el);
    }
  }, []);
}
```

- [ ] **Étape 2 : Écrire la coquille de section**

Créer `frontend/components/portfolio/section-shell.tsx` :

```tsx
"use client";

import { useBeamTarget } from "@/lib/lamp/lamp-context";
import { useReveal } from "@/lib/use-reveal";

/**
 * Coquille commune a toutes les sections : place le bloc dans la grille selon
 * la parite de `index`, declare sa zone eclairable, et rend le titre en deux
 * couches — celle du dessus n'apparait que dans le faisceau.
 */
export function SectionShell({
  id,
  titre,
  index,
  children,
}: {
  id: string;
  titre: string;
  index: number;
  children: React.ReactNode;
}) {
  const cible = useBeamTarget();
  const reveal = useReveal();
  const aGauche = index % 2 === 1;

  return (
    <section
      id={id}
      className="grid grid-cols-12 px-8 lg:px-16"
      style={{ paddingTop: "var(--espace-section)", paddingBottom: 0 }}
    >
      <div
        ref={(el) => {
          cible(el);
          reveal(el);
        }}
        className="col-span-12 mesure zigzag"
        // L'amplitude vient du reglage `zigzagAmplitude`, normalise entre 0 et 1
        // par app/layout.tsx. A 0 les deux cotes se confondent : colonne unique.
        data-cote={aGauche ? "gauche" : "droite"}
      >
        <p className="meta" style={{ marginBottom: "var(--espace-1)" }}>
          {String(index).padStart(2, "0")}
        </p>

        <h2 className="titre-double" style={{ marginBottom: "var(--espace-4)" }}>
          <span className="titre-retrait">{titre}</span>
          <span className="titre-eclaire" aria-hidden="true">
            {titre}
          </span>
        </h2>

        {children}
      </div>
    </section>
  );
}
```

Le titre en retrait porte `--bordure`, très proche du fond : il reste perceptible sans la lampe, et se sculpte quand le faisceau le traverse. Seule la première copie est lue par un lecteur d'écran.

Le décalage est un déplacement de marge, pas un changement de colonne : c'est ce
qui permet à l'amplitude d'être continue de 0 à 100 plutôt que de basculer d'un
cran à l'autre. Ajouter la règle correspondante à la fin de
`frontend/app/globals.css` :

```css
/* Zigzag : le bloc se deplace dans la grille, il ne s'etire jamais. */
.zigzag {
  margin-inline-start: 0;
}

@media (min-width: 900px) {
  .zigzag[data-cote="droite"] {
    /* A amplitude 1, le bloc vient affleurer le bord droit de la grille. */
    margin-inline-start: calc(var(--portfolio-zigzag, 0.5) * (100% - 66ch));
  }
}
```

- [ ] **Étape 3 : Recenser ce que la Task 14 devra remplacer**

```bash
grep -rn "ScrollAnimate\|SectionWrapper" frontend/app frontend/components
```

Noter la liste dans le rapport de tâche. Ne rien supprimer : la Task 14 s'en
charge après avoir réécrit les sections.

- [ ] **Étape 4 : Vérifier la compilation**

```bash
npm run typecheck -w frontend
```

Attendu : aucune erreur sur les deux fichiers créés.

- [ ] **Étape 5 : Commit**

```bash
git add frontend/lib/use-reveal.ts frontend/components/portfolio/section-shell.tsx
git commit -m "feat(frontend): observateur d entree partage et coquille de section en zigzag"
```

---

## Task 14 : Composition des six sections

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/components/portfolio/presentation-section.tsx`
- Modify: `frontend/components/portfolio/skills-section.tsx`
- Modify: `frontend/components/portfolio/experience-section.tsx`
- Modify: `frontend/components/portfolio/certifications-section.tsx`
- Modify: `frontend/components/portfolio/projects-section.tsx`
- Modify: `frontend/components/portfolio/about-section.tsx`
- Modify: `frontend/components/portfolio/contact-section.tsx`
- Delete: `frontend/components/portfolio/scroll-animate.tsx`
- Delete: `frontend/components/portfolio/section-wrapper.tsx`

**Interfaces:**
- Consumes: `SectionShell` (Task 13), `LampProvider` / `LampStage` / `LampSwitch` (Tasks 9, 11, 12)
- Produces: la page finale à six sections

- [ ] **Étape 1 : Retirer le titre et l'enveloppe de chaque section**

Chaque section rend aujourd'hui son propre `SectionWrapper` avec son titre. Le titre remonte désormais dans `SectionShell`. Dans chacun des sept fichiers de section, supprimer l'import de `SectionWrapper` et remplacer l'enveloppe par un fragment.

Exemple pour `skills-section.tsx` — remplacer :

```tsx
<SectionWrapper id="skills" title={t("skills")}>
  {/* contenu */}
</SectionWrapper>
```

par :

```tsx
<>
  {/* contenu */}
</>
```

Répéter à l'identique dans `presentation-section.tsx`, `experience-section.tsx`, `certifications-section.tsx`, `projects-section.tsx`, `about-section.tsx` et `contact-section.tsx`.

- [ ] **Étape 2 : Plafonner la mesure dans chaque section**

Dans chacun des sept fichiers, ajouter la classe `mesure` sur tout conteneur de texte courant — paragraphes, descriptions, listes. Aucun bloc de texte ne doit dépasser 66 caractères de large.

```bash
grep -rn "<p " frontend/components/portfolio/*-section.tsx
```

- [ ] **Étape 3 : Intégrer les certifications dans l'expérience**

Dans `experience-section.tsx`, accepter une prop supplémentaire et rendre le sous-bloc :

```tsx
export function ExperienceSection({
  experiences,
  certifications,
  afficherCertifications,
}: {
  experiences: ExperienceDto[];
  certifications: CertificationDto[];
  afficherCertifications: boolean;
}) {
  return (
    <>
      {/* La liste des experiences reste exactement telle qu'elle est
          aujourd'hui dans ce fichier : ne rien y changer. */}

      {afficherCertifications && certifications.length > 0 && (
        <div style={{ marginTop: "var(--espace-5)" }}>
          <h3 style={{ marginBottom: "var(--espace-3)" }}>Certifications</h3>
          <ul className="mesure space-y-4">
            {certifications.map((c) => (
              <li key={c.id}>
                <p>{c.name}</p>
                <p className="meta">
                  {c.organization?.name}
                  {c.issueDate ? ` · ${new Date(c.issueDate).getFullYear()}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
```

Les champs utilisés ci-dessus sont ceux réellement présents sur
`CertificationDto` : `name`, `organization.name` et `issueDate`. Il n'existe ni
`title` ni `issuer` sur ce type.

- [ ] **Étape 4 : Réécrire la page**

Remplacer intégralement le corps de `frontend/app/page.tsx` :

```tsx
import { getPortfolioData } from "@/lib/api";
import { Header } from "@/components/portfolio/header";
import { Footer } from "@/components/portfolio/footer";
import { SectionShell } from "@/components/portfolio/section-shell";
import { PresentationSection } from "@/components/portfolio/presentation-section";
import { SkillsSection } from "@/components/portfolio/skills-section";
import { ExperienceSection } from "@/components/portfolio/experience-section";
import { ProjectsSection } from "@/components/portfolio/projects-section";
import { AboutSection } from "@/components/portfolio/about-section";
import { ContactSection } from "@/components/portfolio/contact-section";
import { ToastNotification } from "@/components/portfolio/toast-notification";
import { SectionToastObserver } from "@/components/portfolio/section-toast-observer";
import { MaintenancePage } from "@/components/portfolio/maintenance-page";
import { StatsSection } from "@/components/portfolio/stats-section";
import { ServicesSection } from "@/components/portfolio/services-section";
import { TestimonialsSection } from "@/components/portfolio/testimonials-section";
import { LampProvider } from "@/lib/lamp/lamp-context";
import { LampStage } from "@/components/lamp/lamp-stage";
import { LampSwitch } from "@/components/lamp/lamp-switch";

export default async function Page() {
  const data = await getPortfolioData();
  const s = data.siteSettings;

  if (s.maintenanceMode) return <MaintenancePage />;

  // Les sections dormantes gardent leur code mais ne comptent pas dans la
  // numerotation du parcours principal.
  let n = 0;
  const rang = () => ++n;

  return (
    <LampProvider
      reglages={{
        activee: s.lampEnabled,
        allumeeParDefaut: s.lampOnByDefault,
        ouverture: s.lampBeamAngle,
        intensite: s.lampIntensity,
        assombrissement: s.lampDimLevel,
      }}
    >
      <main className="min-h-screen">
        <SectionToastObserver />
        <Header siteSettings={s} personalInfo={data.personalInfo} />

        {s.showPresentations && (
          <SectionShell id="ouverture" titre="Ouverture" index={rang()}>
            <PresentationSection presentations={data.presentations} />
          </SectionShell>
        )}

        {s.showSkills && (
          <SectionShell id="competences" titre="Compétences" index={rang()}>
            <SkillsSection skills={data.skills} />
          </SectionShell>
        )}

        {s.showExperiences && (
          <SectionShell id="experience" titre="Expérience" index={rang()}>
            <ExperienceSection
              experiences={data.experiences}
              certifications={data.certifications}
              afficherCertifications={s.showCertifications}
            />
          </SectionShell>
        )}

        {s.showProjects && (
          <SectionShell id="projets" titre="Projets" index={rang()}>
            <ProjectsSection projects={data.projects} />
          </SectionShell>
        )}

        {s.showAbout && (
          <SectionShell id="a-propos" titre="À propos" index={rang()}>
            <AboutSection about={data.about} />
          </SectionShell>
        )}

        {s.showContact && (
          <SectionShell id="contact" titre="Contact" index={rang()}>
            <ContactSection />
          </SectionShell>
        )}

        {/* --- Sections dormantes, reactivables depuis le backoffice --- */}
        {s.showStats && (
          <SectionShell id="stats" titre="Chiffres" index={rang()}>
            <StatsSection stats={data.stats} />
          </SectionShell>
        )}
        {s.showServices && (
          <SectionShell id="services" titre="Services" index={rang()}>
            <ServicesSection services={data.services} />
          </SectionShell>
        )}
        {s.showTestimonials && (
          <SectionShell id="temoignages" titre="Témoignages" index={rang()}>
            <TestimonialsSection
              testimonials={data.testimonials}
              allowSubmission={s.allowTestimonialSubmission}
            />
          </SectionShell>
        )}

        <Footer personalInfo={data.personalInfo} />
        <ToastNotification message={s.toastMessage} delayMs={s.toastDelayMs} />
      </main>

      <LampStage />
      <LampSwitch />
    </LampProvider>
  );
}
```

- [ ] **Étape 5 : Supprimer les composants obsolètes**

```bash
rm frontend/components/portfolio/scroll-animate.tsx
rm frontend/components/portfolio/section-wrapper.tsx
grep -rn "ScrollAnimate\|SectionWrapper" frontend/
```

Attendu : aucun résultat.

- [ ] **Étape 6 : Vérifier de bout en bout**

```bash
npm run typecheck -w frontend && npm run lint -w frontend && npm run test -w frontend && npm run build -w frontend
```

Attendu : les quatre commandes passent.

Puis dans le navigateur, sur `http://localhost:3000` :

- six sections numérotées de 01 à 06, dans l'ordre ;
- les blocs alternent gauche puis droite à partir de 900 px de large ;
- sous 900 px, tout repasse en colonne unique alignée à gauche ;
- aucun texte ne dépasse 66 caractères de large ;
- les certifications apparaissent en sous-bloc de la section Expérience ;
- Stats, Services et Témoignages sont absents ;
- en les réactivant depuis le backoffice, ils reviennent en fin de parcours ;
- l'entrée des blocs est le seul mouvement du contenu ;
- au clavier, l'ordre de tabulation suit l'ordre visuel.

- [ ] **Étape 7 : Commit**

```bash
git add frontend/
git commit -m "feat(frontend): parcours resserre a six sections en zigzag"
```

---

## Task 15 : Micro-interactions au survol

**Files:**
- Modify: `frontend/lib/lamp/lamp-context.tsx` (ajout de `biaisRef` et de `useBiaisLampe`)
- Modify: `frontend/lib/lamp/use-lamp-engine.ts` (consommation du biais, ref `bras`)
- Modify: `frontend/components/lamp/work-lamp.tsx` (ref sur le groupe fixe)
- Modify: `frontend/components/lamp/lamp-stage.tsx` (quatrième ref)
- Modify: `frontend/components/portfolio/section-shell.tsx` (survol du titre)

**Interfaces:**
- Consumes: tout le sous-système lampe (Tasks 9 à 12)
- Produces:
  - `type BiaisLampe = { angle: number; brasX: number; glow: number }`
  - `useBiaisLampe(): { survolTitre, survolCta, survolMarge, relacher }`
  - `RefsLampe` gagne `bras: RefObject<SVGGElement | null>`

C'est la dernière exigence de la spec sans implémentation. Les trois réponses au
survol, telles que la spec les fixe :

| Survol | Réponse | Amplitude |
|---|---|---|
| Titre de section | la tête recentre le faisceau sur le titre | +0.6° |
| Bouton CTA | la tête s'incline, le réflecteur se réchauffe, le faisceau s'intensifie | +1.2°, glow ×1.6 |
| Liens de la marge | **le bras glisse**, la tête ne tourne pas | +6 px en x |

La distinction du dernier cas est ce qui rend l'objet crédible : une lampe de
bureau ne pivote pas vers ce qu'on lui montre à côté d'elle, on la déplace.

- [ ] **Étape 1 : Ajouter le biais au contexte**

Dans `frontend/lib/lamp/lamp-context.tsx`, ajouter le type et le champ :

```tsx
export type BiaisLampe = {
  /** Radians ajoutes a l'angle vise. */
  angle: number;
  /** Pixels de glissement horizontal du bras. */
  brasX: number;
  /** Multiplicateur de l'opacite du voile lumineux. */
  glow: number;
};

const BIAIS_NEUTRE: BiaisLampe = { angle: 0, brasX: 0, glow: 1 };
```

Ajouter à `ValeurContexte` :

```tsx
  biaisRef: MutableRefObject<BiaisLampe>;
```

Dans `LampProvider`, déclarer la ref à côté de `cibleRef` :

```tsx
  const biaisRef = useRef<BiaisLampe>({ ...BIAIS_NEUTRE });
```

et l'ajouter à l'objet retourné par le `useMemo`, ainsi qu'à sa liste de
dépendances si nécessaire.

- [ ] **Étape 2 : Écrire le hook de survol**

Toujours dans `lamp-context.tsx`, ajouter en fin de fichier :

```tsx
const DEGRE = Math.PI / 180;

/**
 * Handlers de survol. Ils ecrivent dans une ref lue par le moteur : aucun
 * re-rendu React n'est declenche par un simple deplacement de souris.
 */
export function useBiaisLampe() {
  const { biaisRef, cibleRef } = useLampe();

  const appliquer = useCallback(
    (b: Partial<BiaisLampe>) => {
      biaisRef.current = { ...BIAIS_NEUTRE, ...b };
      // Reveille le moteur, qui s'arrete des qu'il est immobile.
      window.dispatchEvent(new Event("scroll"));
    },
    [biaisRef],
  );

  return useMemo(
    () => ({
      /** La tete recentre son faisceau sur le titre survole. */
      survolTitre: (el: HTMLElement) => {
        cibleRef.current = el;
        appliquer({ angle: 0.6 * DEGRE });
      },
      /** La tete s'incline vers le bouton et le faisceau s'intensifie. */
      survolCta: (el: HTMLElement) => {
        cibleRef.current = el;
        appliquer({ angle: 1.2 * DEGRE, glow: 1.6 });
      },
      /** Le bras glisse, la tete ne tourne pas. */
      survolMarge: () => appliquer({ brasX: 6 }),
      /** Retour au neutre. */
      relacher: () => appliquer({}),
    }),
    [appliquer, cibleRef],
  );
}
```

- [ ] **Étape 3 : Consommer le biais dans le moteur**

Dans `frontend/lib/lamp/use-lamp-engine.ts` :

Étendre le type des refs :

```ts
export type RefsLampe = {
  trou: RefObject<SVGPolygonElement | null>;
  voile: RefObject<SVGPolygonElement | null>;
  tete: RefObject<SVGGElement | null>;
  bras: RefObject<SVGGElement | null>;
};
```

Récupérer la ref de biais :

```ts
  const { activee, allumee, cibleRef, biaisRef, reglages } = useLampe();
```

Dans `boucle`, remplacer le calcul de `viseeTete` par :

```ts
      const biais = biaisRef.current;
      const brut = angleVers(p, cible()) + biais.angle;
      const viseeTete = tete.valeur + differenceAngulaire(tete.valeur, brut);
```

Et dans `peindre`, après l'écriture du `transform` de la tête, ajouter :

```ts
      // Le bras glisse horizontalement, il ne pivote jamais.
      refs.bras.current?.setAttribute(
        "transform",
        `translate(${biaisRef.current.brasX} 0)`,
      );
      refs.voile.current?.setAttribute(
        "opacity",
        String((reglages.intensite / 100) * 0.12 * biaisRef.current.glow),
      );
```

Enfin, ajouter `biaisRef` à la liste de dépendances du `useEffect`.

Le glissement du bras et l'intensité du voile sont animés par la transition CSS
plutôt que par un ressort : ce sont des réponses immédiates à un survol, pas des
mouvements de masse. Ajouter dans `globals.css` :

```css
.beam-layer polygon,
.lampe-bras {
  transition:
    opacity var(--duree) var(--courbe),
    transform var(--duree) var(--courbe);
}
```

- [ ] **Étape 4 : Poser la ref sur le groupe fixe**

Dans `frontend/components/lamp/work-lamp.tsx`, changer la signature :

```tsx
export function WorkLamp({
  tete,
  bras,
}: {
  tete: RefObject<SVGGElement | null>;
  bras: RefObject<SVGGElement | null>;
}) {
```

et poser la ref sur le groupe fixe :

```tsx
      <g ref={bras} className="lampe-bras">
```

- [ ] **Étape 5 : Transmettre la quatrième ref**

Dans `frontend/components/lamp/lamp-stage.tsx` :

```tsx
  const bras = useRef<SVGGElement | null>(null);

  useLampEngine({ trou, voile, tete, bras });

  return (
    <>
      <BeamLayer trou={trou} voile={voile} />
      <WorkLamp tete={tete} bras={bras} />
    </>
  );
```

- [ ] **Étape 6 : Brancher le survol du titre**

Dans `frontend/components/portfolio/section-shell.tsx`, importer `useBiaisLampe`
puis poser les handlers sur le titre :

```tsx
  const { survolTitre, relacher } = useBiaisLampe();
```

```tsx
        <h2
          className="titre-double"
          style={{ marginBottom: "var(--espace-4)" }}
          onMouseEnter={(e) => survolTitre(e.currentTarget)}
          onMouseLeave={relacher}
        >
```

- [ ] **Étape 7 : Brancher le survol du CTA et de la marge**

```bash
grep -rn "download-cv\|<Button\|href="http" frontend/components/portfolio/contact-section.tsx frontend/components/portfolio/footer.tsx
```

Sur le bouton principal de la section Contact, poser
`onMouseEnter={(e) => survolCta(e.currentTarget)}` et `onMouseLeave={relacher}`.

Sur le conteneur des liens externes du footer, poser
`onMouseEnter={survolMarge}` et `onMouseLeave={relacher}`.

- [ ] **Étape 8 : Vérifier dans le navigateur**

```bash
npm run dev:frontend
```

Lampe allumée, vérifier successivement :

- survoler un titre de section recentre le faisceau dessus ;
- survoler le bouton de contact incline la tête **et** éclaircit le faisceau ;
- survoler les liens du footer fait glisser le bras vers la droite **sans** faire pivoter la tête ;
- quitter chaque zone ramène la lampe au neutre ;
- l'activité JavaScript retombe à zéro après chaque retour au neutre.

```bash
npm run typecheck -w frontend && npm run build -w frontend
```

- [ ] **Étape 9 : Commit**

```bash
git add frontend/lib/lamp frontend/components/lamp frontend/components/portfolio/section-shell.tsx frontend/app/globals.css
git commit -m "feat(lampe): micro-interactions au survol du titre, du CTA et de la marge"
```

---

## Vérification finale

- [ ] **Toute la chaîne**

```bash
npm run build && npm run lint
cd backend && npx jest
cd .. && npm run test -w frontend
```

- [ ] **Les garanties de la spec tiennent**

```bash
# aucun degrade
grep -rn "gradient" frontend/app frontend/components || echo "OK : aucun degrade"

# aucun noir pur
grep -rn "#000000\|#000\b" frontend/app/globals.css frontend/components || echo "OK : aucun noir pur"

# le plafond de saturation est bien en place
grep -n "Max(30)" backend/src/site-settings/dto/update-site-settings.dto.ts
```

- [ ] **Le plancher d'accessibilité tient**

```bash
npm run test -w frontend -- contrast
```

Le test « le texte reste conforme AA a 40% d assombrissement » est le garde-fou du mode lampe. S'il tombe un jour, c'est que la palette ou le réglage par défaut a dérivé.

---

## Notes pour l'exécutant

**L'ordre compte.** Les tâches 1 à 4 posent les fondations et n'ont pas de dépendance entre elles au-delà de leur ordre. Les tâches 5 et 6 sont des modules purs, testables isolément, et peuvent être menées en parallèle. Les tâches 9 à 12 forment une chaîne : chacune consomme la précédente. Les tâches 13 et 14 doivent rester ensemble — supprimer `SectionWrapper` avant d'avoir réécrit les sections casse la compilation.

**Le point le plus risqué** est l'étape 1 de la Task 11 : SVG n'accepte pas `calc()` dans ses attributs de géométrie. Le plan donne directement la forme correcte à implémenter, mais si le rendu apparaît vide, c'est là qu'il faut regarder en premier.

**Le point le plus facile à rater** est l'étape 4 de la Task 1 : sans le `UPDATE` ajouté à la main dans le fichier de migration, la ligne déjà en base garde ses valeurs kaki et rien ne change à l'écran, alors que le schéma est correct.

**Ne jamais relâcher** le `@Max(30)` sur `accentSaturation`. C'est la seule chose qui rend structurellement impossible une couleur vive sur ce site.

**La Task 15 modifie du code écrit en Tasks 9 à 13.** C'est délibéré : les
micro-interactions ne peuvent se brancher qu'une fois le moteur en marche, et les
isoler dans leur propre tâche permet de les rejeter sans remettre en cause la
lampe elle-même.
