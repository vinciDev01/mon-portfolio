# Spécification d'exécution — Suspension rotin / commutateur de thème

Portfolio Next.js 16 · React 19 · Tailwind v4
Référence visuelle : suspension hémisphérique en rotin tressé, ampoule chaude, mur terracotta.
Toutes les cotes sont données pour un viewport de **1440 × 900 px**, dans un repère SVG **1 unité = 1 px**.

---

## 0. Cadre géométrique

L'objet entier vit dans un `<svg>` unique, `viewBox="0 0 176 560"`, `overflow: visible`.

| Propriété | Valeur |
|---|---|
| Positionnement | `position: fixed` |
| `top` | `0` |
| `right` | `48px` (6 × grille 8) |
| Largeur du SVG | `176px` |
| Hauteur du SVG | `560px` (dont 304 px de faisceau sous l'abat-jour) |
| `z-index` | `60` (au-dessus du contenu, sous les modales à 100) |
| `pointer-events` | `none` sur le SVG, `auto` sur le seul `<button>` de commande |

Axe de symétrie de l'objet : **x = 88**.
Point d'ancrage au bord haut de l'écran : **(88, 0)**.

---

## 1. Anatomie de l'objet

### 1.1 Le fil

| Élément | Valeur |
|---|---|
| Ancrage | (88, 0) — sort du bord haut de la fenêtre, pas de rosace visible |
| Point d'arrivée | (88, 178) — apex du dôme |
| Longueur développée | **178,4 px** |
| Épaisseur (`stroke-width`) | **1,5 px** |
| `stroke-linecap` | `round` |
| Courbure | Bézier cubique unique, flèche maximale **3,2 px vers la droite** à 62 % de la longueur |
| Chemin | `M 88 0 C 88 62, 91.2 118, 89.4 152 C 88.7 165, 88 172, 88 178` |

Le fil n'est **jamais parfaitement vertical** : une flèche de 3,2 px suffit à supprimer l'effet « trait CSS » et à suggérer le poids de l'abat-jour. C'est une courbe statique, jamais animée (cf. §8).

Couleurs : cf. §3.1 (allumé) et §4 (éteint).

### 1.2 La douille

Entièrement contenue dans le dôme, visible uniquement par transparence du tressage et par l'ouverture basse.

| Élément | Géométrie |
|---|---|
| Corps | Rectangle arrondi, x ∈ [81, 95], y ∈ [178, 200] → **14 × 22 px**, `rx = 2` |
| Bague de serrage | Rectangle x ∈ [79, 97], y ∈ [197, 200,5] → **18 × 3,5 px**, `rx = 1` |
| Culot vissé (3 filets) | 3 traits horizontaux de 12 px, y = 202 / 205 / 208, épaisseur 1 px |

### 1.3 L'abat-jour — profil exact

Le profil n'est **pas un demi-cercle**. C'est une **superellipse** (courbe de Lamé) : flancs quasi verticaux près du bord, calotte surbaissée au sommet. C'est ce qui donne la silhouette « cloche évasée » de la référence.

Équation du profil (quart droit, origine au centre du cercle de bord) :

```
(x / R)^n + (y / H)^n = 1        avec  R = 84,  H = 78,  n = 2,6
```

| Paramètre | Valeur |
|---|---|
| Rayon du bord (demi-largeur) | **R = 84 px** → largeur totale **168 px** |
| Hauteur du dôme | **H = 78 px** (apex y = 178, bord y = 256) |
| Exposant de Lamé | **n = 2,6** |
| Rapport H/R | 0,929 |
| Longueur d'arc du profil, apex → bord | **133,5 px** |

**Chemin SVG du demi-profil droit** (tolérance max mesurée sur l'approximation de Bézier : **0,88 px**) :

```
M 88 178
C 117.40 178.00, 122.77 179.32, 137.29 186.17
C 148.72 191.57, 157.39 199.62, 163.20 210.24
C 170.53 223.61, 172.00 228.80, 172.00 256.00
```

Le demi-profil gauche est la **symétrie exacte par rapport à x = 88** (`transform="scale(-1,1) translate(-176,0)"`). Ne pas redessiner à la main : une asymétrie de 1 px se voit.

### 1.4 L'ouverture inférieure et l'ourlet

La caméra est **légèrement sous** le plan du bord : on aperçoit un mince croissant d'intérieur.

| Élément | Valeur |
|---|---|
| Ellipse de bord | centre **(88, 256)**, `rx = 84`, `ry = 12` |
| Facteur d'inclinaison (`ry/rx`) | **0,1429** → angle de vue **8,2°** sous le plan du bord |
| Ourlet (bandeau de finition) | anneau entre `ry = 12` (extérieur) et l'arc à y = 251,5 → **épaisseur apparente 4,5 px** |
| Sur-épaisseur du brin d'ourlet | 2,4 px (double du brin courant) |
| Arc d'intérieur visible | demi-ellipse **supérieure** de (88, 256) `rx 84 / ry 12`, remplie de la couleur « intérieur » |

### 1.5 L'ampoule

| Élément | Valeur |
|---|---|
| Globe | cercle centre **(88, 232)**, **r = 21 px** |
| Position relative | bas du globe à y = 253, soit **3 px au-dessus** du plan du bord → l'ampoule ne dépasse jamais |
| Col du globe | trapèze x ∈ [81, 95] en haut, [84,5 ; 91,5] en bas, y ∈ [208, 214] |
| Filament (boucle) | ellipse centre **(88, 233)**, `rx = 6`, `ry = 3,5` |
| Cœur du filament | ellipse centre (88, 233), `rx = 2,2`, `ry = 1,4` |
| Tiges support | 2 traits, (85, 214)→(85,5 ; 230) et (91, 214)→(90,5 ; 230), épaisseur 0,8 px |

### 1.6 Comportement responsive

Une **seule** variable pilote l'échelle : `--lampe-echelle`, appliquée en `transform: scale()` sur le conteneur avec `transform-origin: 100% 0`.

| Largeur viewport | `--lampe-echelle` | `right` | Longueur de fil effective | Notes |
|---|---|---|---|---|
| ≥ 1440 px | **1,00** | 48 px | 178 px | référence |
| 1200 – 1439 px | **1,00** | 40 px | 178 px | |
| 900 – 1199 px | **0,82** | 32 px | 146 px | dôme = 138 px de large |
| 600 – 899 px | **0,66** | 24 px | 118 px | portée du faisceau ramenée à 200 px |
| 360 – 599 px | **0,50** | 16 px | 89 px | dôme = 84 px ; maillage dégradé (§2.5) |
| < 360 px | **0,44** | 12 px | 78 px | maillage dégradé, halo de fond désactivé |

**Ne jamais raccourcir le fil en dessous de 78 px** : l'objet doit rester lu comme « suspendu au bord », pas « collé dans le coin ».
En dessous de 600 px de large, la **zone de clic** reste à **44 × 44 px minimum** (rectangle transparent centré sur le dôme), indépendamment de l'échelle visuelle.

---

## 2. Le tressage

C'est la pièce maîtresse. Tout l'effet repose sur le fait que la maille est **réellement construite en projection**, pas simulée par une texture plaquée.

### 2.1 La trame verticale (chaîne / méridiens)

| Paramètre | Valeur |
|---|---|
| Nombre de méridiens sur 360° | **72** |
| Pas angulaire | **5,0°** |
| Méridiens visibles (face avant, θ ∈ [−90°, +90°]) | **37** |
| Épaisseur de brin | **1,2 px** |
| Pas de projection au centre (θ = 0) | **7,33 px** |

**Loi de resserrement en projection.** La position horizontale d'un méridien est `x = 88 + 84·sin θ`. Le pas local entre deux méridiens voisins vaut :

```
pas(θ) = 84 · (5° en radians) · cos θ  =  7,33 · cos θ
```

Valeurs de contrôle, à respecter au pixel près :

| θ | x projeté | pas local | taux de couverture des brins verticaux |
|---|---|---|---|
| 0° | 88,0 | 7,33 px | 16,4 % |
| 30° | 130,0 | 6,35 px | 18,9 % |
| 45° | 147,4 | 5,18 px | 23,2 % |
| 60° | 160,8 | 3,67 px | 32,7 % |
| 70° | 166,9 | 2,51 px | 47,8 % |
| 75° | 169,1 | 1,90 px | 63,2 % |
| 80° | 170,7 | 1,27 px | 94,5 % |
| 85° | 171,7 | 0,64 px | 100 % (fusion) |

**Seuil de fusion : pas(θ) < 2 × 1,2 px = 2,4 px, atteint à θ ≈ 71°, soit |x − 88| ≥ 79,4 px (0,945 R).**
Au-delà de ce seuil, **ne pas dessiner les méridiens individuels** : ils produisent du moiré et du crénelage. Les remplacer par une **bande pleine** de 4,6 px de large de chaque côté (x ∈ [4 ; 8,6] et [167,4 ; 172]), de la couleur de brin la plus dense, avec un dégradé d'opacité de 0,55 (côté intérieur) à 1,0 (bord).

**Forme de chaque méridien.** Ce n'est pas une droite : c'est la projection de la superellipse tournée de θ. Chaque méridien i est le chemin du §1.3 **mis à l'échelle horizontalement** par `sin θᵢ`, hauteur inchangée :

```
transform="translate(88,0) scale(sinθᵢ, 1) translate(-88,0)"
```

Un seul chemin `d` est donc défini, réutilisé 37 fois via `<use>` avec 37 transformations. **Coût mémoire : 1 définition de chemin, 37 nœuds `<use>`.**

### 2.2 La trame horizontale (trame / parallèles)

| Paramètre | Valeur |
|---|---|
| Nombre de cercles | **18** (du sommet au bord, l'ourlet compris) |
| Pas **en longueur d'arc** (constant) | **7,42 px** |
| Épaisseur courante | **0,9 px** |
| Cercles renforcés | C6, C12 et C17, épaisseur **2,2 px** (nervures de structure) |
| Ourlet C18 | épaisseur **2,4 px** |

Chaque cercle est une **ellipse** (`<ellipse>`), pas un chemin. Coordonnées exactes :

| # | rx | ry | cy | écart vertical projeté au précédent |
|---|---|---|---|---|
| C1 | 7,42 | 1,06 | 178,05 | 0,05 |
| C2 | 14,83 | 2,12 | 178,33 | 0,28 |
| C3 | 22,22 | 3,17 | 178,95 | 0,62 |
| C4 | 29,56 | 4,22 | 180,03 | 1,08 |
| C5 | 36,79 | 5,26 | 181,64 | 1,61 |
| **C6** | 43,86 | 6,27 | 183,89 | 2,25 |
| C7 | 50,66 | 7,24 | 186,84 | 2,95 |
| C8 | 57,07 | 8,15 | 190,54 | 3,70 |
| C9 | 62,98 | 9,00 | 195,03 | 4,49 |
| C10 | 68,23 | 9,75 | 200,25 | 5,22 |
| C11 | 72,73 | 10,39 | 206,14 | 5,89 |
| **C12** | 76,42 | 10,92 | 212,57 | 6,43 |
| C13 | 79,28 | 11,33 | 219,41 | 6,84 |
| C14 | 81,36 | 11,62 | 226,52 | 7,11 |
| C15 | 82,75 | 11,82 | 233,81 | 7,29 |
| C16 | 83,57 | 11,94 | 241,17 | 7,36 |
| **C17** | 83,93 | 11,99 | 248,58 | 7,41 |
| **C18 (ourlet)** | 84,00 | 12,00 | 256,00 | 7,42 |

**Observation à exploiter :** l'écart vertical projeté passe de 0,05 px (C1→C2) à 7,42 px (C17→C18). Les cercles C1 à C4 se **chevauchent en projection** : ne pas les dessiner séparément, les remplacer par une **calotte pleine** — ellipse `rx 30 / ry 4,3` centrée (88 ; 180,1), remplie à 100 % de la couleur de brin dense. C'est exactement le « bouchon » sombre qu'on voit au sommet de la suspension de référence.

### 2.3 Irrégularité — obligatoire

Une maille parfaitement régulière est immédiatement lue comme synthétique. Appliquer sur le groupe `#maille` un filtre unique :

```
<filter id="brins" x="-4%" y="-4%" width="108%" height="108%">
  <feTurbulence type="fractalNoise" baseFrequency="0.85 0.035"
                numOctaves="2" seed="7" result="bruit"/>
  <feDisplacementMap in="SourceGraphic" in2="bruit" scale="0.7"
                     xChannelSelector="R" yChannelSelector="G"/>
</filter>
```

`baseFrequency` fortement anisotrope (0,85 en x contre 0,035 en y) : le bruit déforme **le long** des brins, jamais en travers — sinon la maille se délite. `scale = 0,7 px` : en dessous de 0,4 px l'effet est invisible, au-dessus de 1,2 px le tressage part en filasse.

Ce filtre est **calculé une fois** puis mis en cache : le groupe ne bouge jamais, seules ses couleurs changent.

### 2.4 Comment la lumière traverse

Deux matières seulement.

| Matière | Surface | Transmission | Opacité de peinture |
|---|---|---|---|
| **Brin de rotin** | les traits (1,2 / 0,9 / 2,2 px) | **0,12** | 0,88 |
| **Interstice** | le vide entre les brins | **0,62** | 0,38 |

L'interstice n'est **pas transparent à 100 %** : le rotin tressé laisse toujours une fibre en arrière-plan. Une transparence totale donne un effet « grillage », pas « panier ».

Transmission résultante, en fonction de θ (couverture verticale + couverture horizontale moyenne de 13 %) :

| θ | couverture opaque totale | **transmission locale T(θ)** |
|---|---|---|
| 0° | 27,2 % | **0,484** |
| 30° | 29,4 % | **0,473** |
| 45° | 33,1 % | **0,454** |
| 60° | 41,5 % | **0,413** |
| 70° | 54,6 % | **0,347** |
| 75° | 68,0 % | **0,280** |
| 80° | 95,0 % | **0,145** |

**Transmission moyenne du dôme, pondérée par l'aire projetée : 0,425.**

Implémentation : ce n'est **pas** un `opacity` global. La couche de lueur (§3.2) est peinte **sous** la maille, et la maille est peinte par-dessus en `fill`/`stroke` opaques. Le rapport 0,484 → 0,145 se produit alors **gratuitement**, par accumulation géométrique des brins qui se resserrent. C'est le point le plus important de cette spécification : **ne pas simuler l'assombrissement des bords par un dégradé, le laisser émerger de la densité de la trame.**

Seul correctif admis : un masque radial de correction, `radial-gradient` blanc → `#000` entre 90 % et 100 % du rayon, pour compenser le fait que la bande pleine de §2.1 sur-assombrit légèrement.

### 2.5 Maillage dégradé (< 600 px de large)

À l'échelle 0,50, un brin de 1,2 px mesure 0,6 px physique : il disparaît ou crénèle. Sous 600 px :

- méridiens : **72 → 36** (pas angulaire 10°), épaisseur portée à **1,8 px** (unités SVG)
- cercles : **18 → 11**
- filtre `feDisplacementMap` : **désactivé** (coût GPU non justifié à cette taille)
- transmission cible inchangée : compenser en portant l'opacité de l'interstice de 0,38 à 0,30

---

## 3. La lumière — état allumé

Six couches, empilées de l'arrière vers l'avant. Chacune est un `<g>` distinct, avec sa propre variable CSS d'opacité pour la transition du §5.

Ordre de peinture (du fond vers l'écran) :
`L5 halo de fond` → `L6 moucheture` → `L4 faisceau` → `L2 lueur du tressage` → `maille` → `L1 filament`

### 3.1 L1 — Filament et halo immédiat

| Sous-couche | Géométrie | Couleur | Opacité | Flou |
|---|---|---|---|---|
| Cœur | ellipse (88 ; 233) rx 2,2 ry 1,4 | `#FFFDF6` — `hsl(46 100% 98%)` | 1,00 | 0,5 px |
| Boucle | ellipse (88 ; 233) rx 6 ry 3,5, `stroke 1,4` | `#FFF3D6` — `hsl(43 100% 92%)` | 0,95 | 1,2 px |
| Halo serré | cercle (88 ; 233) r 20 | dégradé radial ci-dessous | 1,00 | 3 px |
| Globe éclairé | cercle (88 ; 232) r 21 | `#FFE6B0` — `hsl(38 100% 84%)` | 0,42 | 4 px |

**Dégradé du halo serré** (`<radialGradient>` centre 50/50, r = 100 %) :

| Position | Couleur | Opacité |
|---|---|---|
| 0 % | `hsl(44 100% 96%)` | 1,00 |
| 22 % | `hsl(40 100% 88%)` | 0,86 |
| 50 % | `hsl(35 97% 76%)` | 0,48 |
| 78 % | `hsl(30 90% 66%)` | 0,17 |
| 100 % | `hsl(28 85% 60%)` | 0,00 |

**Loi de décroissance : quadratique**, `I(d) = I₀ · (1 − d/20)²`, sur **20 px**.
`mix-blend-mode: screen`.

### 3.2 L2 — Lueur à travers le tressage

Peinte **sous la maille**, écrêtée (`clip-path`) au contour du dôme du §1.3.

| Paramètre | Valeur |
|---|---|
| Type | dégradé radial |
| Centre | **(88 ; 236)** — décalé de 3 px sous le filament (le flux remonte moins qu'il ne descend) |
| Rayon | **96 px** |
| Blend | `screen` |
| Flou | **6 px** |

| Position | Couleur | Opacité |
|---|---|---|
| 0 % | `hsl(38 100% 82%)` — `#FFDFAD` | 0,58 |
| 30 % | `hsl(35 92% 72%)` — `#F6C176` | 0,42 |
| 58 % | `hsl(31 82% 63%)` — `#E7A257` | 0,24 |
| 82 % | `hsl(27 70% 54%)` — `#D08337` | 0,09 |
| 100 % | `hsl(25 65% 48%)` | 0,00 |

**Loi de décroissance : quadratique**, `I(d) = 0,58 · (1 − d/96)²` sur **96 px**.

**Teinte des brins rétro-éclairés.** Les brins situés dans les 55 px autour du centre lumineux ne restent pas bruns : ils s'échauffent. Le `stroke` des méridiens devient un dégradé vertical :

| y | couleur du brin |
|---|---|
| 178 (apex) | `#8A6B45` |
| 210 | `#B08A57` |
| 233 (niveau filament) | `#D6A96B` |
| 256 (bord) | `#9C7A4E` |

### 3.3 L4 — Faisceau direct vers le bas

Cône partant du plan du bord.

| Paramètre | Valeur |
|---|---|
| Largeur en haut (y = 256) | **168 px** (x ∈ [4 ; 172]) |
| Largeur en bas (y = 560) | **300 px** (x ∈ [−62 ; 238]) |
| Portée | **304 px** |
| Demi-angle d'ouverture | **arctan(66 / 304) = 12,25°** |
| Forme | polygone à 4 sommets + arc supérieur de rayon `ry = 12` épousant l'ouverture |
| Flou | **26 px** |
| Blend | `screen` |

**Dégradé linéaire vertical du faisceau :**

| Position (y) | Couleur | Opacité |
|---|---|---|
| 256 (0 %) | `hsl(37 97% 76%)` — `#FDD599` | 0,36 |
| 302 (15 %) | `hsl(35 94% 73%)` | 0,26 |
| 393 (45 %) | `hsl(33 90% 70%)` | 0,13 |
| 484 (75 %) | `hsl(31 85% 66%)` | 0,05 |
| 560 (100 %) | `hsl(30 82% 62%)` | 0,00 |

**Loi de décroissance : inverse du carré**, `I(d) = 0,36 / (1 + d/120)²`, sur **304 px**.
Ce n'est pas une décroissance linéaire : un faisceau conique perd son intensité en 1/d², et c'est précisément ce qui rend le sol/le contenu sous la lampe crédible. Les stops du tableau ci-dessus sont l'échantillonnage de cette loi ; les utiliser tels quels.

**Bords du cône.** Pénombre de **18 px** de chaque côté : un second dégradé, horizontal cette fois, appliqué en masque — 0 % opaque 0, 12 % opaque 1, 88 % opaque 1, 100 % opaque 0. C'est ce qui produit la transition « très douce vers l'ombre » décrite dans la référence, au lieu d'un cône à arête franche.

### 3.4 L5 — Halo projeté sur le fond

Le plus large et le moins intense. **Ne pas l'implémenter comme une forme floutée** (coût prohibitif, cf. §8) : c'est un `background-image` en `radial-gradient` sur un pseudo-élément plein écran.

| Paramètre | Valeur |
|---|---|
| Support | `body::before`, `position: fixed; inset: 0; pointer-events: none` |
| Centre | `calc(100% - 136px)` en x, `250px` en y |
| Rayons | **rx 540 px / ry 620 px** (ellipse verticale : la lumière descend plus qu'elle ne remonte) |
| Blend | `soft-light` puis une seconde passe `screen` à 40 % de l'opacité |
| Flou | **aucun** — un dégradé radial est déjà continu |

| Position | Couleur | Opacité |
|---|---|---|
| 0 % | `hsl(34 88% 72%)` | 0,30 |
| 26 % | `hsl(32 80% 66%)` | 0,19 |
| 55 % | `hsl(30 70% 58%)` | 0,08 |
| 80 % | `hsl(28 62% 50%)` | 0,025 |
| 100 % | `hsl(28 60% 46%)` | 0,00 |

**Loi de décroissance : quadratique**, `I(d) = 0,30 · (1 − d/540)²`, sur **540 px horizontalement / 620 px verticalement**.

### 3.5 L6 — Moucheture texturée du tressage

Les « marbrures lumineuses » de la référence : l'ombre de la maille projetée sur le fond.

| Paramètre | Valeur |
|---|---|
| Source | **copie du groupe `#maille`** via `<use href="#maille">` |
| Transformation | `translate(88,250) scale(2.35) translate(-88,-250)` puis `skewY(4deg)` |
| Centre de projection | (88 ; 250) |
| Étendue résultante | **395 × 183 px** |
| Flou | **5 px** (la projection est nette près de la source, floue au loin — voir dégradé de flou ci-dessous) |
| Blend | `overlay` |
| Couleur des brins projetés | `hsl(28 55% 38%)` opacité **0,16** (micro-ombres) |
| Couleur des interstices projetés | `hsl(36 82% 68%)` opacité **0,20** (marbrures claires) |
| Opacité globale du groupe | **0,55** |

**Dégradé de netteté.** Deux copies superposées, masquées l'une par l'autre :
- copie nette (flou 2 px), masque radial opaque de 0 à 120 px du centre, dégressif jusqu'à 0 à 200 px ;
- copie floue (flou 9 px), masque inverse.

**Loi de décroissance : linéaire** sur **230 px** depuis (88 ; 250), `I(d) = 0,55 · (1 − d/230)`, écrêtée à 0.
Linéaire et non quadratique : c'est une modulation de texture, pas une source. Une loi quadratique la ferait disparaître trop vite et on perdrait tout le caractère « panier ».

---

## 4. La lumière — état éteint

L'objet reste **pleinement lisible**. C'est une contrainte d'accessibilité autant qu'esthétique : c'est un commutateur, il doit se voir.

### 4.1 Contrastes imposés

| Élément | Couleur | Fond | **Ratio** | Exigence |
|---|---|---|---|---|
| Brin de rotin (clair) | `#6E6355` | `#131518` | **3,12 : 1** | ✅ WCAG 1.4.11 (≥ 3:1, composant d'interface) |
| Ourlet | `#7C7162` | `#131518` | **3,83 : 1** | ✅ |
| Fil | `#5A5348` | `#131518` | 2,41 : 1 | secondaire, non porteur d'information |
| Verre de l'ampoule (contour) | `#575F5A` | `#131518` | 2,78 : 1 | secondaire |

**La lisibilité du contrôle repose sur le brin `#6E6355` à 3,12 : 1**, pas sur l'ampoule. C'est la silhouette du dôme qui porte l'affordance.

### 4.2 Palette de l'objet éteint

| Partie | Couleur | Opacité |
|---|---|---|
| Méridiens | `#6E6355` | 0,82 |
| Cercles courants | `#5F5648` | 0,72 |
| Cercles renforcés (C6, C12, C17) | `#7C7162` | 0,90 |
| Calotte du sommet | `#4A4239` | 1,00 |
| Bandes pleines des bords (§2.1) | `#544B3F` | 1,00 |
| Ourlet C18 | `#7C7162` | 1,00 |
| Intérieur du dôme (arc supérieur de l'ouverture) | `#1C1F22` | 0,88 |
| Douille | `#3E4348` | 1,00 |
| Globe de l'ampoule (remplissage) | `#1E2225` | 0,90 |
| Globe (contour, 1 px) | `#575F5A` | 1,00 |
| Filament froid | `#3A3128` | 1,00 |
| Fil | `#5A5348` | 1,00 |

### 4.3 Ce qui subsiste du volume

Sans source interne, le volume est rendu par **trois indices seulement** — pas davantage, sous peine de bavardage graphique :

1. **Occlusion ambiante sous le bord.** Dégradé linéaire vertical, de `#0B0D0F` à l'opacité 0,55 en y = 256, jusqu'à transparent en y = 226 (**30 px**). Écrêté au contour du dôme.
2. **Liseré d'incidence haut-gauche.** La page a une ambiance diffuse : un arc de 1 px, `#9AA096` à l'opacité **0,22**, suivant le profil gauche du dôme de y = 178 à y = 212, avec un dégradé d'opacité 0,22 → 0 sur ce parcours.
3. **Reflet spéculaire du verre.** Arc de 1 px sur le globe, de (78 ; 222) à (84 ; 218), `#9AA096` opacité **0,30**.

### 4.4 Ce qui subsiste de la texture

**Tout.** La maille reste dessinée à l'identique — même nombre de brins, même filtre d'irrégularité, même loi de resserrement. Seules les couleurs changent. C'est ce qui rend l'extinction crédible : l'objet ne se simplifie pas, il cesse d'émettre.

L'ampoule éteinte conserve **une braise résiduelle nulle** : opacité 0 sur toutes les couches L1/L2/L4/L5/L6.

---

## 5. La transition

Une ampoule à incandescence a une **inertie thermique**. Le filament met ~150 ms à atteindre sa couleur de régime et ~600 ms à se refroidir. Les deux sens ne sont donc **pas symétriques**.

### 5.1 Allumage (éteint → allumé) — **900 ms**

| Phase | Fenêtre | Ce qui bouge | Courbe |
|---|---|---|---|
| Inertie | **0 → 40 ms** | rien (délai de contact) | — |
| Préchauffage | **40 → 130 ms** | filament `#3A3128` → `#A8431A`, opacité 0 → 0,45 | `cubic-bezier(0.33, 0, 0.67, 0.35)` |
| Montée | **130 → 420 ms** | filament → `#FFFDF6` ; L1 halo serré 0 → 1 ; L2 lueur 0 → 0,92 | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Dépassement | **380 → 520 ms** | L1 monte à **1,08** puis revient à 1,00 | `cubic-bezier(0.34, 1.40, 0.64, 1)` |
| Remplissage | **260 → 560 ms** | L4 faisceau 0 → 1 (retard **130 ms** sur le filament) | `cubic-bezier(0.33, 1, 0.68, 1)` |
| Rayonnement | **320 → 700 ms** | L5 halo de fond 0 → 1 | `cubic-bezier(0.25, 1, 0.5, 1)` |
| Texture | **400 → 780 ms** | L6 moucheture 0 → 0,55 | `cubic-bezier(0.25, 1, 0.5, 1)` |
| Brins chauds | **180 → 620 ms** | `stroke` des méridiens `#6E6355` → dégradé du §3.2 | `ease-out` |
| Page | **220 → 580 ms** | palette sombre → claire, 360 ms | `cubic-bezier(0.4, 0, 0.2, 1)` |

**Ordre d'apparition : filament → lueur du tressage → faisceau → halo de fond → moucheture.**
Le décalage de 130 ms entre filament et faisceau est ce qui rend l'allumage lisible : on voit la lumière « sortir » de l'abat-jour au lieu d'apparaître partout d'un coup.

**Rampe chromatique du filament** (à interpoler en **oklch**, pas en sRGB — l'interpolation sRGB traverse un brun sale) :

| t | couleur |
|---|---|
| 40 ms | `#3A3128` |
| 130 ms | `#A8431A` |
| 200 ms | `#E07A28` |
| 300 ms | `#FFC169` |
| 420 ms | `#FFF3D6` |
| 520 ms | `#FFFDF6` |

### 5.2 Extinction (allumé → éteint) — **1100 ms**

Plus lente que l'allumage. Le filament refroidit.

| Phase | Fenêtre | Ce qui bouge | Courbe |
|---|---|---|---|
| Coupure | **0 → 90 ms** | L1 opacité 1 → 0,42, chute brutale | `cubic-bezier(0.4, 0, 1, 1)` |
| Faisceau | **0 → 260 ms** | L4 1 → 0 — **part le premier** | `cubic-bezier(0.5, 0, 0.9, 0.4)` |
| Halo / texture | **0 → 340 ms** | L5 et L6 → 0 | `cubic-bezier(0.5, 0, 0.9, 0.4)` |
| Lueur du tressage | **60 → 420 ms** | L2 0,92 → 0 | `cubic-bezier(0.45, 0, 0.7, 0.3)` |
| Rougeoiement | **90 → 560 ms** | filament `#FFFDF6` → `#FFB768` → `#E0631E` → `#7A2408`, opacité 0,42 → 0,07 | `cubic-bezier(0.37, 0, 0.63, 1)` |
| Braise | **560 → 1100 ms** | opacité 0,07 → 0, couleur `#7A2408` → `#3A3128` | `cubic-bezier(0.4, 0, 0.85, 1)` |
| Brins refroidis | **80 → 480 ms** | `stroke` → palette du §4.2 | `ease-in-out` |
| Page | **60 → 460 ms** | palette claire → sombre, 400 ms | `cubic-bezier(0.4, 0, 0.2, 1)` |

**Ordre de disparition : faisceau → halo de fond → moucheture → lueur du tressage → filament (braise).**
C'est l'inverse strict de l'allumage. La zone éclairée s'éteint **avant** la source : c'est le détail qui vend l'effet.

**Rampe chromatique de refroidissement** (oklch) :

| t | couleur | opacité L1 |
|---|---|---|
| 0 ms | `#FFFDF6` | 1,00 |
| 90 ms | `#FFE3A8` | 0,42 |
| 200 ms | `#FFB768` | 0,30 |
| 340 ms | `#E0631E` | 0,17 |
| 560 ms | `#7A2408` | 0,07 |
| 1100 ms | `#3A3128` | 0,00 |

### 5.3 Réentrance

Un double clic pendant une transition ne doit **jamais** produire un état incohérent. Toutes les couches sont pilotées par une **unique variable** `--lampe-t` ∈ [0, 1] animée par la Web Animations API sur un seul `Animation` object ; changer d'état appelle `animation.reverse()` si l'animation est en cours, sinon lance la nouvelle. Le `playbackRate` est ajusté à `900/1100 = 0,818` lors d'un `reverse()` depuis l'extinction, pour conserver les durées asymétriques.

Délai anti-rebond du bouton : **0 ms** (le `reverse()` gère). Ne pas ajouter de `disabled` pendant la transition : c'est frustrant au clavier.

---

## 6. Ce que la lumière fait au reste de la page

### 6.1 Ancrage global de l'éclairage

Toutes les valeurs ci-dessous sont dérivées d'un unique point source déclaré en variable :

```
--source-x: calc(100% - 136px);   /* centre du dôme : 48 + 88 */
--source-y: 250px;
```

### 6.2 Thème clair (allumée)

| Effet | Valeur |
|---|---|
| Fond de page | `#F6F1E8` |
| Nappe chaude (`body::before`) | `radial-gradient(540px 620px at var(--source-x) var(--source-y), hsl(34 88% 72% / 0.30), hsl(32 80% 66% / 0.19) 26%, hsl(30 70% 58% / 0.08) 55%, transparent 80%)` |
| Blend de la nappe | `soft-light` |
| Vignette | `radial-gradient(140% 118% at 78% 0%, transparent 44%, hsl(30 30% 28% / 0.09) 100%)` |
| Ombre portée des cartes (niveau 1) | `-5px 9px 20px -8px hsl(28 42% 34% / 0.16)` |
| Ombre portée des cartes (niveau 2, survol) | `-9px 16px 34px -10px hsl(28 42% 34% / 0.22)` |
| Ombre portée des boutons | `-2px 4px 10px -3px hsl(28 42% 34% / 0.18)` |
| Température des ombres | **teinte 28°, saturation 42 %** — les ombres ne sont jamais grises |

**Direction des ombres.** La source est en haut à droite : tout décalage d'ombre va **vers le bas-gauche**, `offset-x` négatif. Cette règle est absolue sur les six sections. Une seule ombre décalée vers la droite détruit la cohérence de l'éclairage.

**Gradient d'intensité sur les six sections en zigzag.** Chaque section reçoit une opacité de nappe décroissante avec la distance verticale à la source :

| Section | Distance verticale approx. | Facteur d'intensité |
|---|---|---|
| 1 (hero) | 0 – 900 px | **1,00** |
| 2 | 900 – 1800 px | **0,62** |
| 3 | 1800 – 2700 px | **0,38** |
| 4 | 2700 – 3600 px | **0,22** |
| 5 | 3600 – 4500 px | **0,12** |
| 6 + footer | > 4500 px | **0,06** |

Loi : `f(n) = 0,615^(n−1)`, décroissance **exponentielle**. La lampe étant `fixed`, elle reste visible, mais la page doit donner l'impression de s'éloigner de la source. Implémentation : une variable `--intensite` posée en classe utilitaire par section, multipliée dans l'`opacity` du pseudo-élément de section.

### 6.3 Thème sombre (éteinte)

| Effet | Valeur |
|---|---|
| Fond de page | `#131518` |
| Nappe chaude | opacité **0** (conservée dans le DOM pour l'animation) |
| Vignette | `radial-gradient(150% 128% at 50% 38%, transparent 30%, #0A0C0E 100%)`, opacité **0,50** |
| Ombre portée des cartes (niveau 1) | `0 2px 8px hsl(210 22% 4% / 0.55)` |
| Ombre portée des cartes (niveau 2) | `0 6px 18px hsl(210 22% 4% / 0.65)` |
| Température des ombres | **teinte 210°, saturation 22 %** — froides, neutres, sans direction |
| Portée des ombres | **réduite de 60 %** : sans source ponctuelle, l'ombre est courte et diffuse |

**Le basculement de direction des ombres** (diagonale bas-gauche → verticale pure) fait partie de la transition du §5. Il s'anime sur 400 ms avec la palette.

### 6.4 Couche de cascade

```
@layer base    →  variables de palette, fond et texte des balises
@layer components →  .lampe, .lampe__dome, .lampe__faisceau, .section--intensite-*
```

La nappe et la vignette vivent sur `body::before` / `body::after`, déclarés en `@layer base`. L'objet lampe et ses couches vivent intégralement en `@layer components`.

---

## 7. Les deux palettes

### 7.1 Palette claire — ampoule allumée

| Rôle | Jeton | Hex | HSL |
|---|---|---|---|
| Fond | `--fond` | `#F6F1E8` | `hsl(41 45% 94%)` |
| Surface | `--surface` | `#FCF8F1` | `hsl(38 60% 97%)` |
| Bordure | `--bordure` | `#DCD1BF` | `hsl(38 33% 80%)` |
| Texte secondaire | `--texte-secondaire` | `#5E564A` | `hsl(38 12% 33%)` |
| Texte principal | `--texte` | `#1F2320` | `hsl(140 5% 13%)` |
| Accent | `--accent` | `#456040` | `hsl(113 20% 32%)` |

**Contrastes WCAG mesurés :**

| Paire | Ratio | Seuil AA (4,5:1) |
|---|---|---|
| Texte principal `#1F2320` sur fond `#F6F1E8` | **14,15 : 1** | ✅ (AAA) |
| Texte principal `#1F2320` sur surface `#FCF8F1` | **15,03 : 1** | ✅ (AAA) |
| Texte secondaire `#5E564A` sur fond `#F6F1E8` | **6,42 : 1** | ✅ (AA, proche AAA) |
| Texte secondaire `#5E564A` sur surface `#FCF8F1` | **6,83 : 1** | ✅ |
| Accent `#456040` sur fond `#F6F1E8` | **6,22 : 1** | ✅ |
| Accent `#456040` sur surface `#FCF8F1` | **6,61 : 1** | ✅ |
| Fond `#F6F1E8` sur accent `#456040` (bouton plein) | **6,22 : 1** | ✅ |
| Bordure `#DCD1BF` sur fond `#F6F1E8` | 1,34 : 1 | décorative — doubler par un décalage de surface |

⚠️ **La bordure à 1,34 : 1 ne satisfait pas 1.4.11.** Pour toute bordure **porteuse de sens** (champ de formulaire, état de focus, séparation active), utiliser **`#948263`** — **3,31 : 1 sur le fond** et **3,52 : 1 sur la surface**. La bordure décorative `#DCD1BF` reste admise pour les séparations non signifiantes.

### 7.2 Palette sombre — ampoule éteinte

Conserve l'identité existante du projet (`frontend/lib/design/tokens.ts`), avec un seul ajustement.

| Rôle | Jeton | Hex | HSL |
|---|---|---|---|
| Fond | `--fond` | `#131518` | `hsl(216 11% 8%)` |
| Surface | `--surface` | `#1A1D21` | `hsl(214 11% 11%)` |
| Bordure | `--bordure` | `#22262B` | `hsl(214 12% 15%)` |
| Texte secondaire | `--texte-secondaire` | `#9AA096` | `hsl(96 4% 61%)` |
| Texte principal | `--texte` | `#E4E5E3` | `hsl(90 3% 89%)` |
| Accent | `--accent` | `#7E9B76` | `hsl(108 16% 54%)` |

**Contrastes WCAG mesurés :**

| Paire | Ratio | Seuil AA (4,5:1) |
|---|---|---|
| Texte principal `#E4E5E3` sur fond `#131518` | **14,47 : 1** | ✅ (AAA) |
| Texte principal `#E4E5E3` sur surface `#1A1D21` | **13,38 : 1** | ✅ (AAA) |
| Texte secondaire `#9AA096` sur fond `#131518` | **6,83 : 1** | ✅ |
| Texte secondaire `#9AA096` sur surface `#1A1D21` | **6,32 : 1** | ✅ |
| Accent `#7E9B76` sur fond `#131518` | **5,96 : 1** | ✅ |
| Accent `#7E9B76` sur surface `#1A1D21` | **5,51 : 1** | ✅ |
| Fond `#131518` sur accent `#7E9B76` (bouton plein) | **5,96 : 1** | ✅ |
| Bordure `#22262B` sur fond `#131518` | 1,20 : 1 | décorative |

**Ajustement recommandé :** le jeton actuel `--texte-secondaire: #8b8f8a` donne **5,15 : 1 sur la surface** `#1A1D21`. C'est conforme AA, mais sans marge. Le porter à **`#9AA096` (6,32 : 1)** offre une réserve confortable face aux couches de blend du §6, qui peuvent rogner 0,3 à 0,5 point de ratio.

⚠️ Même remarque que §7.1 : `#3B4149` ne donne que **1,78 : 1** et `#565D66` que **2,75 : 1** — tous deux insuffisants. Pour tout contour porteur de sens, utiliser **`#707780`** : **4,04 : 1 sur le fond** et **3,74 : 1 sur la surface**.

### 7.3 Incidence des couches de blend sur les contrastes

Les couches `soft-light` / `screen` du §6 modifient la luminance réelle du fond. **Tous les ratios ci-dessus doivent être re-mesurés après composition**, au minimum sur trois points d'échantillonnage : sous la lampe (fort halo), au milieu de la section 3, en pied de page.

**Garde-fou imposé :** l'opacité cumulée des couches de fond ne doit jamais faire varier la luminance relative du fond de plus de **±0,04** (en unités `L` WCAG). Au-delà, plafonner l'opacité de la nappe. Pour le fond clair `#F6F1E8` (L = **0,8833**), la plage admise est **L ∈ [0,843 ; 0,923]**, ce qui garantit que le texte `#1F2320` (L = 0,016) reste entre **13,54 : 1** et **14,75 : 1** partout. Pour le fond sombre `#131518` (L = **0,0074**), la plage admise est **L ∈ [0 ; 0,047]**, soit un plancher de **8,56 : 1** pour le texte `#E4E5E3`.

---

## 8. Accessibilité et coût

### 8.1 Coût de rendu — le compte honnête

| Poste | Coût | Verdict |
|---|---|---|
| 37 `<use>` méridiens + 18 `<ellipse>` + calotte + 2 bandes | ~110 nœuds vectoriels, **statiques** | négligeable, rastérisé une fois |
| `feTurbulence` + `feDisplacementMap` sur la maille | **~8 à 14 ms** au premier rendu, 0 ensuite | acceptable **si et seulement si** le filtre n'est jamais recalculé |
| Copie de la maille pour la moucheture (§3.5) | double le coût du filtre : **~16 à 28 ms** au premier rendu | mitigation ci-dessous |
| `filter: blur(26px)` sur le faisceau (300 × 304 px) | **~1,8 ms / frame** animée sur GPU discret, **~4,5 ms** sur mobile milieu de gamme | seul flou réel conservé |
| Halo de fond en `radial-gradient` | **~0,3 ms** | c'est pourquoi il ne doit **pas** être une forme floutée |
| `mix-blend-mode` sur 4 couches | force la création de 4 couches de composition, **~12 Mo de VRAM** en 1440×900 | plafonner à 4, jamais plus |
| Animation §5 (opacité + couleur sur 6 groupes) | **~2,2 ms / frame** | ✅ |

**Budget total visé : ≤ 4,0 ms par frame en régime animé, ≤ 45 ms au premier rendu.**

**Mitigations obligatoires**
1. La moucheture (L6) n'est **pas** un second `feTurbulence` : rastériser la maille filtrée **une seule fois** dans un `<symbol>`, et la moucheture n'est qu'un `<use>` transformé de ce symbole. Le filtre est calculé une fois pour les deux.
2. `will-change: opacity` sur **3 groupes maximum** (L1, L4, L5) et **retiré** à la fin de l'animation (`animationend`).
3. Aucune animation sur `d`, `filter`, `stroke-width`, `transform` de la maille. Uniquement `opacity` et `color`/`stroke` (interpolables sur le compositeur ou, à défaut, peu coûteux).
4. `content-visibility: auto` sur les sections 4 à 6 pour amortir le coût de leurs pseudo-éléments de nappe.
5. Sous 600 px de large : `feDisplacementMap` désactivé, flou du faisceau ramené à **14 px**, L5 halo de fond **supprimé**.

### 8.2 `prefers-reduced-motion: reduce`

Le **changement de thème reste instantané et complet** — on ne prive personne de la fonction.

| Désactivé | Conservé |
|---|---|
| La séquence de 900 / 1100 ms du §5 | l'état final des 6 couches |
| Le dépassement de 1,08 sur L1 (§5.1) | le halo, le faisceau, la moucheture, **statiques** |
| Les rampes chromatiques du filament | la couleur de régime |
| Le décalage de 130 ms faisceau/filament | — |
| Tout mouvement du fil | le fil (courbe statique) |

**Remplacement :** un unique fondu d'opacité de **120 ms**, `linear`, sur toutes les couches simultanément, y compris la palette de page.

```
@media (prefers-reduced-motion: reduce) {
  .lampe *, body::before, body::after { transition-duration: 120ms !important;
                                        animation: none !important; }
}
```

### 8.3 `prefers-contrast: more`

- Nappe chaude, vignette et moucheture : **opacité 0**.
- Brin de rotin éteint : `#6E6355` → **`#8C8172` (4,79 : 1)**.
- Bordures : systématiquement les variantes signifiantes du §7.
- Texte secondaire clair : `#5E564A` → `#4A4338` (**8,68 : 1**).

### 8.4 `forced-colors: active`

Les couches L1 à L6 sont masquées (`forced-color-adjust: none` + `opacity: 0`). Le bouton reste rendu en `ButtonFace` / `ButtonText` avec un contour de 2 px. La maille est réduite à **son contour de dôme seul**, tracé en `CanvasText`. L'objet redevient un pictogramme d'ampoule, ce qui est le comportement attendu.

### 8.5 Clavier et lecteur d'écran

L'élément interactif est un `<button>` **réel**, jamais un `div`.

| Attribut | Valeur |
|---|---|
| Balise | `<button type="button">` |
| `role` | `switch` |
| `aria-checked` | `true` en thème clair (allumée), `false` en thème sombre |
| `aria-label` | `« Éclairage de la page »` |
| Libellé d'état (`<span class="sr-only">`) | `« Allumé — thème clair »` / `« Éteint — thème sombre »` |
| `aria-live` sur ce span | `polite` |
| Ordre de tabulation | **premier élément focusable du document**, avant le lien d'évitement — c'est le seul contrôle global de la page |
| Touches | `Entrée` et `Espace` (natif `<button>`) |
| Zone cliquable | **44 × 44 px minimum** (WCAG 2.5.8), centrée sur le dôme, jamais sur le fil |

**Anneau de focus.** Il doit survivre aux deux thèmes et aux couches de blend :

```
outline: 2px solid var(--accent);
outline-offset: 3px;
box-shadow: 0 0 0 5px var(--fond);   /* halo de séparation */
border-radius: 6px;
```

Contraste de l'anneau : `#456040` sur `#F6F1E8` = **6,22 : 1** ; `#7E9B76` sur `#131518` = **5,96 : 1**. Tous deux ≥ 3 : 1 (WCAG 2.4.11). L'anneau est posé **au-dessus** de toutes les couches de lumière (`z-index` local 10) et en `isolation: isolate` pour échapper aux `mix-blend-mode`.

**Annonce de la transition.** Le `aria-live="polite"` se déclenche **immédiatement** au clic, pas à la fin des 900 ms. L'utilisateur de lecteur d'écran ne doit pas attendre l'animation.

**Persistance.** L'état est stocké (`localStorage`, clé `theme`) et rendu côté serveur pour éviter le flash. Au premier chargement sans préférence stockée : suivre `prefers-color-scheme`.

---

## 9. Ce que cet effet oblige à abandonner de l'ancienne charte

À lire avant de décider. Cette demande n'est pas un ajout : c'est un **changement de charte**.

### 9.1 Abandons directs

| Règle d'origine | Statut | Pourquoi c'est irréversible ici |
|---|---|---|
| **Pas de dégradés** | ❌ **abandonnée** | L'effet repose sur **7 dégradés** : halo serré, lueur du tressage, faisceau, halo de fond, pénombre latérale du cône, occlusion sous le bord, nappe de page. Aucun n'est substituable par un aplat. |
| **Pas de bords flous** | ❌ **abandonnée** | Le faisceau est flouté à 26 px, le filament à 3 px, la moucheture à 5 et 9 px. La « transition très douce vers l'ombre » de la référence **est** un bord flou. |
| **Ombres neutres** | ❌ **abandonnée** en thème clair | Les ombres deviennent **teintées (28°, 42 %)** et **directionnelles** (décalage bas-gauche imposé). |
| **Un seul thème sombre** | ❌ **abandonnée** | Le projet passe de mono-thème à bi-thème. Cela double la surface de test visuel de chaque composant. |

### 9.2 Contraintes nouvelles imposées à tout le reste du site

1. **Toutes les ombres portées du site doivent être refaites**, et dans deux jeux (clair directionnel / sombre neutre). Une ombre oubliée en `0 2px 4px #000` se verra immédiatement comme une erreur d'éclairage.
2. **`mix-blend-mode` entre dans la base de code.** Il interagit mal avec `position: sticky`, les `backdrop-filter` et certains contextes d'empilement. Tout composant existant utilisant `z-index` devra être audité.
3. **Les contrastes deviennent conditionnels au fond composé.** Le §7.3 impose une vérification après composition, ce qu'aucun outil de contraste statique ne fait. Cela veut dire une **campagne de capture d'écran + mesure**, pas un lint.
4. **Le rendu n'est plus déterministe en SSR.** Les filtres SVG et les blends diffèrent légèrement entre Chromium, Firefox et Safari. Il faut accepter un écart visuel, ou figer la maille en image rastérisée (ce qui coûterait le rétro-éclairage dynamique des brins du §3.2).

### 9.3 Ce qui est préservé

- **La grille de 8 px** : toutes les cotes de positionnement (`right`, marges, zone de clic) en sont des multiples. Les cotes internes du dôme ne le sont pas — c'est de la géométrie, pas de la mise en page, et c'est légitime.
- **Le plafond de 66 caractères** : intact, l'objet est en `position: fixed` hors flux.
- **Les six sections en zigzag** : intactes, elles reçoivent seulement une variable `--intensite`.
- **La palette d'accent `#7E9B76`** : conservée en sombre, déclinée en `#456040` pour le clair.
- **Le registre « calme, leader, professionnel »** : la lumière est **chaude mais basse** — l'opacité maximale d'une couche de fond est 0,30. Rien ne brille. C'est un éclairage d'ambiance, pas un effet néon.

### 9.4 Alternative dégradée, si l'abandon est jugé trop coûteux

Conserver l'objet et son tressage (§1, §2, §4) — qui sont du trait pur, compatibles avec la charte d'origine — et **ne garder de §3 que L1 et L2** (filament + lueur du tressage), sans faisceau, sans halo de fond, sans moucheture. Coût : ~0,8 ms/frame, un seul dégradé, un seul flou de 3 px. On perd le zonage et les marbrures de la référence, on garde l'objet et le commutateur.

C'est la version à retenir si la contrainte « pas de dégradés » est structurante pour la marque.

---

## Annexe — Récapitulatif des grandeurs clefs

| Grandeur | Valeur |
|---|---|
| Ancrage du fil | (88, 0) |
| Longueur du fil | 178,4 px |
| Dôme | R 84 · H 78 · Lamé n = 2,6 |
| Ouverture | ellipse 168 × 24 px, centre (88, 256) |
| Ampoule | r 21 px, centre (88, 232) |
| Méridiens | 72 total / 37 visibles / pas 5° / 1,2 px |
| Cercles | 18 / pas d'arc 7,42 px / 0,9 px |
| Transmission moyenne | 0,425 (0,484 au centre → 0,145 à θ = 80°) |
| Portée du faisceau | 304 px, demi-angle 12,25° |
| Portée du halo de fond | 540 × 620 px |
| Allumage | 900 ms |
| Extinction | 1100 ms |
| Contraste texte min. (clair) | 6,42 : 1 |
| Contraste texte min. (sombre) | 6,32 : 1 |
| Budget de rendu | ≤ 4,0 ms / frame |
