# Refonte du frontend — système visuel sobre et lampe d'atelier

Date : 2026-08-25
Statut : design validé, en attente du plan d'implémentation

## Intention

Le portfolio doit refléter un état d'esprit : calme, leader, professionnel. Le
parcours de lecture doit être agréable de bout en bout. Aucune fantaisie, aucun
dégradé, aucune couleur vive, aucune section superflue.

Un objet porte l'ensemble : une lampe d'atelier fixée au bord droit, dont le
faisceau suit le visiteur et révèle la section qu'il lit.

## Décisions

| Sujet | Décision |
|---|---|
| Rôle de la lampe | Mode activable. Le site est lisible sans elle. |
| Accent | Vert Spring Boot désaturé, unique accent, y compris l'anneau de la lampe. Pas d'orange. |
| Sections | Six. Stats, Services et Témoignages désactivés, pas supprimés. |
| Thème | Sombre par défaut. La lampe baisse l'ambiance, elle ne change pas d'univers. |
| Mise en page | Zigzag : le contenu alterne gauche/droite, la tête pivote pour suivre. |
| Mécanisme | Scrim assombrissant percé par un masque SVG. Contenu jamais recoloré. |
| Réglages | Lampe, rythme typographique, mouvement et teinte pilotés depuis le backoffice. |

---

## 1. Système visuel

### Palette

Noir doux légèrement bleuté, jamais `#000`. Cinq valeurs.

| Rôle | Valeur | Contraste sur fond |
|---|---|---|
| Fond | `#131518` | — |
| Surface | `#1A1D21` | 1.08:1 |
| Bordure | `#22262B` | 1.20:1 |
| Texte secondaire | `#8B8F8A` | 5.57:1 — AA |
| Texte principal | `#E4E5E3` | 14.47:1 — AAA |
| Accent vert lichen | `#7E9B76` | 5.95:1 — AA |

Surface et bordure sont volontairement à très faible écart : ce sont des
séparations décoratives, pas des éléments porteurs d'information. Toute frontière
qui identifie un composant interactif utilise l'accent (5.95:1), afin de
satisfaire le critère WCAG 1.4.11 sur les composants non textuels.

Le vert est `#6DB33F` (Spring Boot) ramené à 16 % de saturation. En HSL, `#7E9B76` vaut exactement `hsl(107 16% 54%)` — ce sont les valeurs par défaut de `accentHue` et `accentSaturation`, et les deux définitions doivent rester d'accord. Il ne sert qu'à
trois usages : l'anneau de la lampe, l'état actif de la navigation, le
soulignement des liens au survol. Aucun aplat coloré, aucun dégradé.

### Typographie

- **IBM Plex Sans** — texte courant.
- **IBM Plex Mono** — métadonnées : dates, versions, étiquettes techniques.

Remplace Figtree. Support complet des diacritiques français, chiffres tabulaires.
Les deux restent surchargeables depuis le backoffice.

Échelle modulaire de ratio 1.250, base 17 px :

| Corps | Usage | Interligne | Tracking |
|---|---|---|---|
| 13.6 px | meta (Mono, capitales) | 1.4 | +0.08em |
| 17 px | corps | 1.6 | 0 |
| 21.25 px | chapô | 1.5 | 0 |
| 26.5 px | h3 | 1.35 | 0 |
| 33.2 px | h2 | 1.25 | −0.01em |
| 51.9 px | h1 | 1.1 | −0.02em |

Règles appliquées :

- Mesure de 45 à 75 caractères, calée sur 66 (`max-width: 66ch`).
- Interligne inversement proportionnel au corps.
- Tracking négatif en display, positif en petites capitales.
- WCAG 2.2 critère 1.4.12 : la mise en page tient si le visiteur force
  interligne 1.5, espacement de paragraphe 2×, interlettrage 0.12em,
  inter-mots 0.16em. Aucune hauteur fixe.
- `font-variant-numeric: tabular-nums` sur toutes les dates et durées.

### Rythme vertical

Grille de 8 px sans exception. Progression des marges : 8 / 16 / 24 / 40 / 64 / 120.
Espace inter-sections : 120 px desktop, 80 px mobile.

Principe directeur : l'espace au-dessus d'un titre appartient à la section
précédente, celui en dessous lui appartient. L'écart au-dessus est donc toujours
plus grand (120 px contre 40 px).

---

## 2. Parcours

### Les six sections

| # | Section | Source | Propos |
|---|---|---|---|
| 01 | Ouverture | `personalInfo` + `presentations[0]` | Qui, en deux phrases. Pas de slogan. |
| 02 | Compétences | `skills` | Spring · Angular · Flutter en tête, le reste en second rang |
| 03 | Expérience | `experiences` + `certifications` | Parcours daté, certifications en sous-bloc |
| 04 | Projets | `projects` + technologies liées | Preuves de travail |
| 05 | À propos | `about` | L'état d'esprit |
| 06 | Contact | formulaire + CV | Une seule action |

Le blog reste sur `/blog`, hors parcours principal.

`showServices` et `showTestimonials` passent à `false`. Le code de ces sections
reste en place et redevient actif d'un clic depuis le backoffice.

`StatsSection` est aujourd'hui rendue sans condition : `SiteSettings` ne possède
pas de champ `showStats`. La migration en ajoute un, `@default(false)`, pour que
Stats devienne récupérable au même titre que les autres plutôt que supprimée.

`showCertifications` est conservé et pilote désormais le sous-bloc des
certifications à l'intérieur de la section Expérience.

Le composant `Confetti` est retiré du parcours.

### Zigzag

Grille de 12 colonnes. Le bras de la lampe occupe un rail fixe de 48 px au bord
droit, hors grille — le contenu ne passe jamais dessous.

- Sections impaires : colonnes 1 à 7.
- Sections paires : colonnes 6 à 12.
- Le bloc ne dépasse jamais 66 caractères ; il se déplace dans la grille, il ne
  s'étire pas.
- Sous 900 px : colonne unique alignée à gauche, zigzag annulé, lampe repliée en
  bouton discret.

### Animations

Deux mouvements sur tout le site, pas un de plus.

1. **Entrée d'un bloc** — opacité 0 → 1, translation 8 px vers le haut, 400 ms,
   `cubic-bezier(0.22, 1, 0.36, 1)`. Décalage de 60 ms entre frères, plafonné à
   trois éléments.
2. **La lampe** — voir section 3.

Exclus : parallaxe, agrandissement au survol, rotation, compteurs incrémentaux,
apparition lettre par lettre.

Le composant `ScrollAnimate` actuel, qui instancie un `IntersectionObserver` par
bloc, est remplacé par un observateur unique partagé.

Sous `prefers-reduced-motion: reduce` : les blocs sont présents d'emblée, la
lampe se fige, le faisceau saute d'une section à l'autre sans transition.

---

## 3. La lampe

### Mécanisme

Un scrim assombrissant en surimpression, percé par un masque SVG. Le contenu
n'est ni dupliqué ni recoloré : il reste sélectionnable, indexable et lisible par
un lecteur d'écran.

```svg
<svg class="beam-layer" aria-hidden="true">      <!-- fixe, pointer-events:none -->
  <mask id="beam">
    <rect width="100%" height="100%" fill="white"/>
    <polygon id="hole" points="…"/>              <!-- noir = perce le scrim -->
  </mask>
  <rect width="100%" height="100%" fill="#0D0F11"
        opacity="var(--dim)" mask="url(#beam)"/>
  <polygon id="glow" points="…" fill="#F2EFE6"
           opacity=".05" style="mix-blend-mode:plus-lighter"/>
</svg>
```

Deux polygones aux mêmes sommets : l'un perce l'ombre, l'autre pose la lumière
chaude. Une seule écriture d'attribut `points` par image.

`clip-path: polygon(evenodd, …)` a été écarté : le paramètre `fill-rule` n'est
pas fiable hors Firefox.

### Anatomie

Deux groupes SVG, parce que seuls deux éléments bougent.

Groupe fixe :
- Bras tubulaire vertical, `#16191D`, noir mat, sort du cadre.
- Bouton moleté à 14 crans, `#1E2126` — le pivot visuel.
- Levier de verrouillage.
- Anneau guide-câble, `#7E9B76` — le seul point coloré de l'objet.

Groupe tête, pivotant autour du bouton moleté :
- Corps, `#16191D`, noir mat.
- Intérieur du diffuseur, `#EDEAE3`, blanc poli mat.
- Biseau du bord, `#3A3F45`, fin liseré clair.

Aplats mats, **aucun filtre de grain**. Un `feTurbulence` sur un élément qui se
transforme force un recalcul du filtre à chaque image pour un gain visuel nul à
cette taille. La sensation de métal mat vient du liseré de biseau et de l'absence
totale de brillance.

### Géométrie du faisceau

Pivot `P` fixe sur le rail. Cible `T` au centre du bloc éclairé de la section
active.

```
θ = atan2(Ty − Py, Tx − Px)          angle de la tête
φ = demi-ouverture                    défaut 14°, réglable
L = diagonale du viewport × 1.2       toujours au-delà du cadre

A = aperture haute de la tête
B = aperture basse de la tête
C = P + L·(θ − φ)                     bord meneur
D = P + L·(θ + φ)                     bord suiveur
```

Le trapèze déborde volontairement du viewport et se fait couper par les bords du
SVG, ce qui produit les fuites strictes sans calcul d'intersection.

### Physique

Aucune interpolation linéaire — un `lerp` donne un mouvement mou, sans poids.
Chaque angle est intégré par un ressort amorti :

```
a = −ω₀²·(x − cible) − 2·ζ·ω₀·v
v += a·dt
x += v·dt
```

ζ = 0.9, juste sous l'amortissement critique : accélération au départ, arrêt net,
aucun rebond visible.

| Ressort | ω₀ | Effet |
|---|---|---|
| Angle de la tête θ | 9 | la masse de la tête |
| Bord meneur C | 12 | s'étire en premier |
| Bord suiveur D | 7 | rattrape ensuite |

Les deux dernières valeurs font **changer le trapèze de forme** pendant la
transition au lieu de le translater. C'est ce qui donne l'illusion du poids.

L'anneau vert glisse de ±3 px dans son guide, indexé sur la vitesse angulaire —
il ne bouge que pendant le mouvement, jamais à l'arrêt.

### Micro-interactions

| Survol | Réponse | Amplitude |
|---|---|---|
| Titre de section | la tête recentre le faisceau sur le titre | +0.6° |
| Bouton CTA | la tête s'incline, le réflecteur se réchauffe, le faisceau s'intensifie | +1.2°, glow .05 → .08 |
| Liens de la marge | le bras glisse, la tête ne tourne pas | +6 px en x |

La distinction du dernier cas rend l'objet crédible : une lampe de bureau ne
pivote pas vers ce qu'on lui montre à côté d'elle, on la déplace.

### Double-ton des titres

Seul endroit où le contenu est dupliqué.

```html
<h2 class="title">
  <span class="title-dim">Expérience</span>
  <span class="title-lit" aria-hidden="true">Expérience</span>
</h2>
```

`title-lit` porte le même masque que le scrim : elle n'apparaît que dans le
faisceau. Le titre se sculpte à mesure que la lumière le traverse. Le lecteur
d'écran ne lit que la première copie.

### Composants

```
LampProvider          état : allumée, section active, géométrie   (contexte)
├── WorkLamp          le SVG de l'objet, groupe tête animé
├── BeamLayer         le scrim masqué + le glow
└── LampSwitch        l'interrupteur, aria-pressed, focus visible

useBeamTarget(ref)    chaque section déclare sa zone éclairable
useLampEngine()       la boucle rAF, les trois ressorts
```

`useLampEngine` écrit dans le DOM par `ref`, jamais par `setState` : aucun
re-rendu React pendant l'animation.

La boucle s'arrête d'elle-même quand les trois vitesses passent sous le seuil, et
ne redémarre qu'au scroll ou au survol. Elle ne tourne pas si l'onglet est
masqué, si la lampe est éteinte, ou sous `prefers-reduced-motion`.

---

## 4. Données

### Migration `add_lamp_and_typography_settings`

Champs ajoutés à `SiteSettings` :

```prisma
// Lampe
lampEnabled       Boolean @default(true)  @map("lamp_enabled")
lampOnByDefault   Boolean @default(false) @map("lamp_on_by_default")
lampBeamAngle     Int     @default(28)    @map("lamp_beam_angle")     // ouverture totale, °
lampIntensity     Int     @default(70)    @map("lamp_intensity")      // 0–100
lampDimLevel      Int     @default(40)    @map("lamp_dim_level")      // 0–100

// Visibilité manquante
showStats         Boolean @default(false) @map("show_stats")

// Rythme
typeScale         String  @default("normal") @map("type_scale")       // compact|normal|airy
lineHeight        Float   @default(1.6)   @map("line_height")
zigzagAmplitude   Int     @default(50)    @map("zigzag_amplitude")    // 0–100
sectionSpacing    Int     @default(120)   @map("section_spacing")     // px

// Mouvement
animationsEnabled    Boolean @default(true) @map("animations_enabled")
animationSpeed       Float   @default(1.0)  @map("animation_speed")
respectReducedMotion Boolean @default(true) @map("respect_reduced_motion")

// Accent
accentHue         Int     @default(107)   @map("accent_hue")
accentSaturation  Int     @default(16)    @map("accent_saturation")
```

Les défauts existants basculent : `bgColor` → `#131518`, `textColor` →
`#E4E5E3`, `fontFamily` → `IBM Plex Sans`, `fontSize` → `17`.

La migration met à jour la ligne existante par un `UPDATE`, elle ne se contente
pas de changer les `@default` — sinon l'enregistrement en base garde ses valeurs
kaki.

### Sémantique des réglages

Chaque valeur doit avoir une interprétation unique, sans quoi l'implémentation
peut diverger du design.

| Champ | Interprétation |
|---|---|
| `typeScale` | ratio de l'échelle modulaire : `compact` = 1.200, `normal` = 1.250, `airy` = 1.333 |
| `lineHeight` | interligne du corps de texte ; les autres niveaux gardent leur rapport relatif |
| `zigzagAmplitude` | 0 = colonne unique centrée, aucun décalage ; 100 = décalage maximal (colonnes 1-7 / 6-12) ; interpolation linéaire entre les deux |
| `sectionSpacing` | espace inter-sections en pixels sur desktop ; le mobile applique les deux tiers |
| `lampBeamAngle` | ouverture **totale** du faisceau en degrés ; la demi-ouverture φ vaut la moitié |
| `lampIntensity` | opacité du polygone de lumière, de 0 à 0.12 |
| `lampDimLevel` | opacité du scrim, de 0 à 0.65 |
| `animationSpeed` | multiplicateur des durées ; 2.0 rend les transitions deux fois plus lentes |

### Validation

Bornes posées dans le DTO avec `class-validator`, pour que l'API refuse une
valeur hors plage même appelée directement :

```ts
@Min(0)   @Max(30)   accentSaturation: number;   // interdit tout vert vif
@Min(8)   @Max(45)   lampBeamAngle: number;
@Min(0)   @Max(65)   lampDimLevel: number;
@Min(0)   @Max(100)  lampIntensity: number;
@Min(1.3) @Max(2.0)  lineHeight: number;
@Min(0.5) @Max(2.0)  animationSpeed: number;
@Min(0)   @Max(100)  zigzagAmplitude: number;
@Min(64)  @Max(240)  sectionSpacing: number;
@IsIn(['compact', 'normal', 'airy']) typeScale: string;
```

Le plafond de saturation à 30 est la garantie structurelle de la contrainte
« pas de couleurs vives » : elle vit dans le schéma.

### Propagation

Les champs traversent `PortfolioData` via `packages/shared-types`, puis sont
injectés en variables CSS au rendu serveur — même chemin que `bgColor` et
`fontFamily` aujourd'hui, donc aucun flash au chargement.

### Backoffice

Quatre groupes de réglages dans la page `site-settings` : Lampe, Rythme,
Mouvement, Accent. Le curseur d'assombrissement affiche le ratio de contraste
calculé en direct.

---

## 5. Accessibilité

**Plancher de contraste.** À 40 % d'assombrissement — la valeur par défaut — le
texte hors faisceau reste à 5.74:1, au-dessus du seuil AA de 4.5:1 : il devient
`#8E8F8F` sur un fond `#111315`. Au-delà de 40 %, le backoffice affiche le ratio
calculé et prévient quand il passe sous le seuil. Le curseur monte jusqu'à 65 %,
mais le choix est alors explicite.

**Le faisceau suit le focus clavier.** En navigation au `Tab`, la cible du
faisceau devient l'élément focalisé, pas la section visible. Sans cela, la lampe
éclaire un endroit pendant que le focus est ailleurs et le mode devient
inutilisable au clavier.

**La couche lumineuse est inerte.** `aria-hidden`, `pointer-events: none`, hors
de l'ordre de tabulation. Le texte reste sélectionnable, copiable et indexable.

**L'interrupteur** est un `<button aria-pressed>` avec un anneau de focus visible
(2 px accent, décalé de 2 px) et un libellé explicite.

---

## 6. Tests

Le frontend n'a aucun harnais aujourd'hui. Ajout de **Vitest**, ciblé sur ce qui
a une valeur de vérification réelle plutôt que sur les composants de
présentation.

1. **Géométrie du faisceau** — fonction pure `(P, T, φ, viewport) → 4 sommets`.
   Cas limites : cible au-dessus du pivot, en dessous, alignée, hors écran.
2. **Intégration du ressort** — fonction pure
   `(x, v, cible, ω₀, ζ, dt) → (x', v')`. Vérifie la convergence, un dépassement
   inférieur à 2 % avec ζ = 0.9, et l'immobilisation sous le seuil d'arrêt. Sans
   ce test, une boucle rAF qui ne s'arrête jamais passe inaperçue.
3. **Contraste de la palette** — recalcule les ratios depuis les jetons de
   couleur et échoue si l'un passe sous son seuil.
4. **Bornes des DTO** côté backend, avec le harnais Jest existant.

Le rendu des sections et le zigzag se vérifient visuellement.

---

## Hors périmètre

- Le backoffice conserve son thème clair actuel.
- Le blog n'est pas retouché au-delà de l'héritage des jetons de couleur et de
  typographie.
- Aucune modification des entités autres que `SiteSettings`.
- Les sections désactivées ne sont pas supprimées du code.
