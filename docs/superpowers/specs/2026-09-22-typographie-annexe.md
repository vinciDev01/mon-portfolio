# Spécification typographique — portfolio

Date : 2026-09-22 · Périmètre : `frontend/` (le backoffice garde son thème admin neutre).

## 0. Méthode — d'où viennent les chiffres

Aucun chiffre de ce document n'est une impression. Tout a été mesuré le jour même sur les
**fichiers réellement servis** par `fonts.googleapis.com/css2` (sous-ensemble `latin`,
`unicode-range: U+0000-00FF…`), c'est-à-dire exactement les octets que `next/font/google`
télécharge et ré-héberge.

| Ce qui est mesuré | Comment |
| --- | --- |
| Poids en Ko | téléchargement du `.woff2` du bloc `@font-face` `latin` et `len(bytes)` |
| Couverture diacritique | `fontTools` → `cmap` du fichier servi, testée sur 41 signes |
| Chiffres tabulaires | largeurs d'avance (`hmtx`) des 10 chiffres + présence de `tnum` dans `GSUB` |
| Hauteur d'x / capitale | `OS/2.sxHeight`, `OS/2.sCapHeight` |
| Contraste et axe | échantillonnage radial du `o` (2° de pas), épaisseur = rayon extérieur − rayon intérieur |
| Empattements | scanline horizontale sur le `n` à y = 2/5/10/20/40/60 unités |
| Interligne minimal | `hhea.ascent`, `hhea.descent`, bbox du glyphe `É` |
| Licence / auteur | `name` ID 0/5/14 du fichier + `METADATA.pb` du dépôt `google/fonts` |

Ce qui **n'a pas** pu être vérifié automatiquement est signalé comme tel. Je ne comble aucun trou.

---

## 1. L'existant, mesuré

`frontend/app/layout.tsx` charge aujourd'hui :

```
IBM_Plex_Sans({ subsets: ["latin"], weight: ["300","400","500","600"] })   → 4 fichiers statiques
IBM_Plex_Mono({ subsets: ["latin"], weight: ["400","500"] })               → 2 fichiers statiques
```

Coût réel mesuré, sous-ensemble latin :

| Fichier | Poids |
| --- | --- |
| IBM Plex Sans 300/400/500/600 (4 statiques) | **178,6 Ko** |
| IBM Plex Mono 400/500 (2 statiques) | **28,9 Ko** |
| **Total actuel** | **207,5 Ko sur 6 requêtes** |

Deux constats désagréables, tous deux vérifiés :

1. **IBM Plex Sans existe en variable** dans la base de `next/font` (`axes: wght 100→700, wdth 75→100`)
   — `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`. Le fichier variable
   latin pèse **44,6 Ko**. Le site paie donc **178,6 Ko au lieu de 44,6 Ko** pour rien. C'est
   un bug de configuration indépendant du choix de police.
2. **IBM Plex Mono n'a pas de version variable** dans cette même base (`weights` sans `"variable"`).
   Les statiques sont donc le seul choix possible — ce n'est pas une erreur, c'est une contrainte.

Sur le fond du dessin, Plex Sans n'est pas une mauvaise police, mais elle ne répond pas au brief :
contraste **1,21:1**, axe du délié à **90°** (strictement vertical), `o` large de 466/1000 em.
C'est un néo-grotesque d'entreprise de 2017 dessiné par Bold Monday pour IBM. « Corporate », oui.
« Vintage », non : il n'y a rien d'historique dans son dessin, ses terminaisons coupées à
l'horizontale et ses courbes légèrement aplaties sont un vocabulaire des années 2010. Elle ne
trahit pas l'ambiance rotin/lin/lueur dorée, elle lui est simplement indifférente — elle est
tiède là où le brief demande chaud.

---

## 2. Les trois candidatures

### Candidature A — **Literata** *(recommandée)*

| | |
| --- | --- |
| Créateurs | **Veronika Burian & José Scaglione** (latin), Irene Vlachou (grec), Vera Evstafieva & Elena Novoselova (cyrillique) |
| Fonderie | **TypeTogether** |
| Origine | commandée par Google comme police de marque de **Google Play Books** ; refondue de zéro en variable par TypeTogether |
| Année | `name` ID 0 du fichier : *« Copyright 2017 The Literata Project Authors »* ; entrée Google Fonts `date_added: 2018-12-06` ; version du fichier servi : **3.103** |
| Licence | **SIL Open Font License 1.1** (`name` ID 14 → `https://scripts.sil.org/OFL`, `METADATA.pb` → `license: "OFL"`) |
| Récupération | `next/font/google` (`Literata`) ✅ · auto-hébergement ✅ via `github.com/googlefonts/literata` ou `fonts.google.com` |
| Prix | 0 € |

**Ce qui la rend corporate.** Contraste pleins/déliés mesuré à **1,82:1** — le plus bas de tous les
romains testés (Source Serif 4 : 2,11 · Alegreya : 2,07 · Spectral : 2,30 · Lora : 2,75 ·
EB Garamond : 3,17). Un contraste bas, c'est une page qui garde une couleur grise régulière,
sans scintillement : le registre du rapport annuel, pas celui de l'invitation de mariage.
Hauteur d'x à **507/1000 em**, rapport hauteur d'x / capitale à **0,724** — proportions de
labeur, pas de fantaisie. Empattements au pied du `n` larges de **245/1000 em** pour un fût de
**93/1000 em**, soit un rapport de **2,63:1** : des empattements francs, presque des dalles,
qui tiennent le mot ensemble et ne se cassent pas au rendu écran. C'est ce qui produit l'effet
« institutionnel » sans avoir besoin de graisse.

**Ce qui la rend vintage.** L'axe du délié du `o` tombe à **98°**, pas à 90°. Autrement dit
l'amincissement maximal n'est pas au sommet géométrique de la lettre : il est décalé de **8° vers
la gauche**. Cette inclinaison est la trace du geste de la plume taillée, l'héritage direct des
romains de la Renaissance. C'est très exactement ce qui sépare une police « humaniste » d'une
police « rationaliste ». Pour comparaison mesurée : Source Serif 4 est à **90,0°** (axe vertical
strict, pure logique transitionnelle du XVIII<sup>e</sup>), EB Garamond à **110°** (vieux style
franc), Literata à **98°**. Les terminaisons du `a`, `c`, `f` sont en goutte ou en crochet, pas
coupées droit — trait d'ancien, pas de grotesque.

**Où se situe la nuance classique/moderne.** Elle est chiffrable : **8° d'inclinaison** de l'axe
(le classique) pour **1,82:1** de contraste et **0,507 em** de hauteur d'x (le moderne). Une
Garamond est à 110° / 3,17:1 / 0,400 em — trop ancienne, illisible en dark mode. Une Source
Serif 4 est à 90° / 2,11:1 — trop froide, aucune main dedans. Literata est le point exact entre
les deux, et ce n'est pas un jugement : c'est la position numérique entre les deux bornes.

**Ce qui la rend compatible avec l'ambiance rotin / lin / lueur dorée.** Le `o` mesure
**494/1000 em** de large — le plus ouvert des romains testés (Alegreya : 426 · Spectral : 428 ·
Source Serif 4 : 459). Contrepoinçons grands et ronds = air dans la lettre = la sensation
« épurée » demandée, obtenue par l'espace interne et non par la finesse des traits. C'est
important : on peut être aéré **et** robuste, ce qui est exactement ce dont un thème sombre a
besoin.

**Ce qui la rend sûre en thème sombre.** Le délié le plus fin du `o` mesure **57,8/1000 em**, soit
**0,98 px à 17 px**. C'est le trait le plus épais de tous les romains testés, presque le double
d'EB Garamond (26,7/1000 em → **0,45 px**, qui se délite littéralement sur fond `#131518`) et
nettement au-dessus de Spectral (33,1 → 0,56 px) et Source Serif 4 (45,0 → 0,77 px). Sur fond
sombre, l'étalement lumineux (*blooming*) grossit optiquement le fond et ronge le trait : en
dessous d'environ 0,7 px, les déliés se fragmentent. **Literata est la seule des trois
candidatures à passer cette barre avec une marge confortable.**

**Axe optique.** `fvar` = `opsz 7→72` + `wght 200→900`. Le même fichier fournit un dessin de
labeur (opsz bas : empattements plus épais, contraste écrasé, chasse élargie) et un dessin de
titrage (opsz haut : empattements affinés, contraste relevé, chasse resserrée). C'est le brief
« nuance entre le classique et le moderne » livré comme un axe continu, dans **un seul fichier**.

---

### Candidature B — **Source Serif 4** + **Source Sans 3**

| | |
| --- | --- |
| Créateurs | Source Serif 4 : **Frank Grießhammer** · Source Sans 3 : **Paul D. Hunt** |
| Fonderie | **Adobe** |
| Année | `name` ID 0 : *« © 2014 - 2021 Adobe Systems Incorporated »* ; version servie **4.004** ; Google Fonts `date_added: 2021-11-16` (Sans 3 : 2021-09-17) |
| Licence | **SIL OFL 1.1**, avec **Reserved Font Name « Source »** (mentionné explicitement dans le `name` ID 0 — toute version modifiée devra être renommée ; contrainte réelle si vous sous-ensemblez et redistribuez) |
| Récupération | `next/font/google` ✅ (`Source_Serif_4`, `Source_Sans_3`) · auto-hébergement ✅ |
| Prix | 0 € |

**Argument le plus fort : la cohérence historique du couple.** Source Serif s'appuie sur les
romains de **Pierre-Simon Fournier** (Paris, milieu du XVIII<sup>e</sup>) — pertinent pour un site
en français. Source Sans descend des gothiques américaines de **Morris Fuller Benton** (News
Gothic, 1908). *Ces deux filiations sont celles annoncées par Adobe dans la documentation du
projet ; je les rapporte comme telles, elles ne sont pas mesurables sur le fichier.*

**Ce qui est mesuré.** Contraste **2,11:1**, axe du délié à **90,0°** — verticalité stricte.
Hauteur d'x **475/1000 em**. Empattements du `n` : la scanline relève au pied **quatre** plages
d'encre au lieu de deux, ce qui signale un pied à **dessous creusé** (empattement bracketé dont le
dessous est concave, signature fournierienne) ; l'empreinte totale du pied gauche va de 40 à
272 unités, soit **232/1000 em** pour un fût de 85, rapport **2,7:1**. *Ma première mesure
automatique donnait 0,87 ; elle était fausse, l'artefact venant du creux. Je la corrige ici.*
**Chiffres tabulaires par défaut** (largeur unique **500/1000 em**), sans avoir à activer `tnum`.

**Pourquoi elle ne gagne pas.** L'axe à 90° est le problème. Un axe strictement vertical, c'est la
définition du romain *transitionnel* rationaliste : c'est classique, oui, mais d'un classicisme
d'ingénieur — la plume a disparu. Le brief demande du « vintage » et une ambiance « organique,
chaleureuse, rotin tressé ». Source Serif 4 est admirable et totalement neutre en température.
Elle ne réchauffera rien. Et son délié à **0,77 px** à 17 px en thème sombre est tenable mais
sans marge. Enfin, le couple Serif 4 / Sans 3 est *trop* bien assorti : mêmes proportions, même
axe à 90°, hauteurs d'x à 475 et 478 (0,6 % d'écart). À l'œil, on ne lit pas un contrepoint,
on lit une seule police qui aurait perdu ses empattements — c'est précisément le « malaise »
des paires trop proches.

---

### Candidature C — **Alegreya** + **Alegreya Sans**

| | |
| --- | --- |
| Créateur | **Juan Pablo del Peral** |
| Fonderie | **Huerta Tipográfica** (Buenos Aires) — `METADATA.pb` : `designer: "Juan Pablo del Peral, HT Fonts"` |
| Année | `name` ID 0 : *« Copyright 2011 The Alegreya Project Authors »* ; Google Fonts `date_added: 2011-12-19` (Sans : 2013-12-04) ; version servie **2.009** |
| Licence | **SIL OFL 1.1** |
| Récupération | `next/font/google` ✅ · auto-hébergement ✅ |
| Prix | 0 € |
| Distinction | primée aux *Certificates of Excellence in Type Design* du **TDC** — *je rapporte cette distinction de mémoire et n'ai pas pu la vérifier automatiquement ; à confirmer avant de la citer publiquement.* |

**La plus chaude, la plus vintage.** Axe du délié à **108°** — 18° d'inclinaison, la plus forte
trace de plume des trois. Contraste **2,07:1**. Empattements asymétriques (le pied gauche du `n`
va de 47 à 237, soit 190/1000 em pour un fût de 72 → **2,64:1**), terminaisons calligraphiques.
Alegreya Sans est son vrai pendant : contraste **1,32:1** (une sans humaniste modulée, pas un
grotesque), axe à 92°, hauteur d'x **455** contre **452** pour la romaine. Le couple est conçu
ensemble — il n'y a aucun risque de dissonance.

**Deux raisons de ne pas la choisir ici, toutes deux mesurées.**

1. **Les chiffres sont elzéviriens par défaut, et proportionnels.** Mesure : les dix chiffres ont
   **dix largeurs différentes** (342 à 533/1000 em), leurs sommets s'étagent de 497 à 598 et
   certains descendent à **−105** sous la ligne de pied. Pour des dates et des périodes
   d'expérience à aligner en colonne, c'est l'opposé de ce qu'il faut. Les fonctions `lnum`
   **et** `tnum` sont bien présentes dans `GSUB`, donc c'est réparable —
   `font-feature-settings: "lnum" 1, "tnum" 1` — mais il faut se souvenir de le faire partout,
   et le moindre oubli produit une colonne de dates bancale.
2. **La marge au-dessus des capitales accentuées est de 4,9 % d'em seulement** pour Alegreya Sans
   (`É` culmine à 851, ascendante `hhea` à 900). C'est la marge la plus serrée des candidats
   retenus. Ça passe, mais tout `line-height` agressif sur un titre en capitales devient un pari.

Elle reste le meilleur choix si le propriétaire décide plus tard que le site doit être **plus
littéraire que corporate**. Ce n'est pas le brief actuel.

---

### Écartées en cours de route (et pourquoi, factuellement)

| Police | Motif d'élimination — mesuré |
| --- | --- |
| **EB Garamond** | délié le plus fin à **26,7/1000 em = 0,45 px à 17 px** → disparaît en thème sombre. Hauteur d'x **0,400 em** (7 px à 17 px) → imposerait de remonter la base à ~21 px, ce qui casse l'échelle modulaire. |
| **Newsreader** | le `É` culmine à **1716/2000** contre une ascendante `hhea` de **1470** : l'accent **dépasse la boîte de 12,3 % d'em**. Interligne minimal sans rognage : **1,25**. Titres de section en capitales + interligne serré = accents coupés. Éliminée sur le critère « capitales accentuées » du brief. |
| **Libre Franklin** | `É` à **967,6** pour une ascendante `hhea` de **966** — il dépasse déjà. Interligne minimal **1,22**. Et surtout : **accents non raccourcis sur les capitales** (22,6 % d'em au-dessus de la capitale, identique au 22,6 % au-dessus du bas de casse), signe que le dessin des capitales accentuées n'a pas été traité spécifiquement. Éliminée. |
| **Instrument Sans** | même défaut : accents non raccourcis (23,0 % / 23,0 %), et **2,0 % d'em** de marge seulement au-dessus du `É`. |
| **Fraunces** | l'axe `wght` du fichier servi est **bloqué à 900** (`min=100, default=900, max=900` sur le sous-ensemble latin servi par `css2` avec la requête testée) et le dessin « wonky » contredit « calme, leader, professionnel ». |
| **Lora** | contraste **2,75:1** et chiffres elzéviriens proportionnels par défaut (9 largeurs distinctes). Chaleureuse mais trop contrastée pour le dark mode et coûteuse à discipliner pour les dates. |
| **Spectral** | **pas de fichier variable** sur Google Fonts (`fvar` absent) → 4 fichiers statiques pour 4 graisses. Délié à 0,56 px. |
| **IBM Plex Serif** | accents non raccourcis (24,6 % / 25,4 %), pas de version variable, et garde le vocabulaire IBM que l'on cherche justement à quitter. |

---

## 3. Les diacritiques — vérification réelle

Test exécuté sur le **`cmap` du fichier latin réellement servi**, sur la chaîne :

```
É È Ê Ë À Â Ç Î Ï Ô Ù Û Ü Œ œ Æ æ ß Ä Ö ü ä ö é à ç ê î ô û ù ï ë « » … – — ‹ › №
```

| Police | Glyphes manquants |
| --- | --- |
| Literata | **aucun**, sauf `№` (signe numéro, hors latin-1, sans usage ici) |
| Source Serif 4 | idem |
| Alegreya / Alegreya Sans | idem |
| IBM Plex Sans / Mono | idem |

Français (`é à è ù ç ê î ô û ë ï « » œ Œ`), allemand (`ä ö ü Ä Ö Ü ß`) et **toutes** les capitales
accentuées sont présentes dans les quatre. Le sous-ensemble Google `latin` couvre `U+0000–U+00FF`,
donc `É À Ç Ü ß` y sont par construction ; `Œ`/`œ` (U+0152/0153) et les guillemets `« »` sont
également inclus dans ce même bloc servi. **Aucun `latin-ext` n'est nécessaire** pour fr/en/de.

### Qualité de dessin des capitales accentuées

Le vrai critère n'est pas « le glyphe existe » mais « l'accent a-t-il été redessiné, plus plat et
plus bas, pour tenir au-dessus d'une capitale ». Mesure : hauteur de l'accent au-dessus de la
capitale (`É` − capHeight) comparée à la hauteur de l'accent au-dessus du bas de casse
(`é` − xHeight), en % d'em.

| Police | accent sur CAPITALE | accent sur bas de casse | verdict |
| --- | --- | --- | --- |
| **Literata** | **22,2 %** | 26,5 % | **accents raccourcis de 4,3 pts** ✅ |
| Source Serif 4 | 20,8 % | 28,3 % | raccourcis de 7,5 pts ✅ |
| Alegreya | 20,4 % | 26,3 % | raccourcis ✅ |
| IBM Plex Sans | 25,1 % | 26,3 % | à peine raccourcis (1,2 pt) ⚠️ |
| Libre Franklin | 22,6 % | 22,6 % | **non traités** ❌ |
| Instrument Sans | 23,0 % | 23,0 % | **non traités** ❌ |

Aucune des polices testées n'implémente la fonction OpenType `case`. Le raccourcissement, quand
il existe, est donc dessiné en dur dans le glyphe précomposé — ce qui est le cas pour Literata,
et ce qui est la bonne nouvelle : rien à activer côté CSS.

### Interligne minimal avant rognage du `É`

Formule : `L_min = (hhea.ascent + |hhea.descent|) − 2 × (hhea.ascent − sommet_du_É)`, en em.
En dessous de cette valeur de `line-height`, l'accent d'un `É` sort de la ligne et se fait couper
par tout conteneur en `overflow: hidden`.

| Police | boîte `hhea` | `line-height` minimal |
| --- | --- | --- |
| **Literata** | 1,485 em | **0,98** ✅ toute latitude |
| Alegreya | 1,361 em | 1,01 |
| Source Serif 4 | 1,371 em | 1,05 |
| IBM Plex Sans | 1,300 em | 1,15 |
| Libre Franklin | 1,212 em | 1,22 ❌ |
| Newsreader | 1,000 em | 1,25 ❌ |

**Literata tient jusqu'à un interligne de 0,98.** Pour des titres de section en capitales avec un
`line-height` serré à 1,1 ou 1,15 — ce qu'on veut typographiquement —, c'est la seule des trois
candidatures qui ne demande aucune précaution.

---

## 4. Les chiffres tabulaires

Mesure des largeurs d'avance (`hmtx`) des glyphes `0`–`9` dans le fichier servi :

| Police | Chiffres par défaut | `tnum` dans `GSUB` |
| --- | --- | --- |
| **IBM Plex Mono** | **tabulaires**, largeur unique 600/1000 em, alignés en capitale | sans objet (monochasse) |
| IBM Plex Sans | **tabulaires**, largeur unique 600 | absent — mais inutile |
| Source Serif 4 | **tabulaires**, largeur unique 500 | présent |
| **Literata** | **proportionnels** (8 largeurs de 407 à 578), alignés en capitale | **présent** → à activer |
| Alegreya | proportionnels **et elzéviriens** (10 largeurs, descentes à −105) | `lnum` + `tnum` présents |

Conséquence pratique pour Literata : les chiffres courants (dans une phrase) restent
proportionnels, ce qui est **souhaitable** en lecture. Pour les colonnes de dates et de périodes,
il faut une classe dédiée :

```css
.tabulaire { font-variant-numeric: tabular-nums; } /* Literata : GSUB tnum présent, vérifié */
```

Mais la recommandation va plus loin : **ces métadonnées restent en IBM Plex Mono**, qui est
monochassé par construction (600/1000 em pour *tous* les glyphes). Aucune fonction OpenType à
activer, aucun oubli possible, et l'alignement tient même si la chaîne mélange chiffres, tirets
et lettres (`2021 – 2024`, `v3.2.1`, `Spring Boot 3`).

---

## 5. L'appariement recommandé

**Literata (titres + corps) + IBM Plex Mono (métadonnées, étiquettes techniques, chiffres en colonne).**

### Pourquoi pas deux familles de texte

L'axe `opsz` de Literata rend une deuxième famille inutile pour la hiérarchie. Le même fichier
donne deux dessins réellement différents :

| Rôle | Réglage | Effet sur le dessin |
| --- | --- | --- |
| Titres de section, en capitales | `font-variation-settings: "opsz" 48; font-weight: 600` | empattements affinés, contraste relevé, chasse resserrée → registre **classique, gravé** |
| Corps de texte, 66 caractères | `font-variation-settings: "opsz" 12; font-weight: 400` | empattements épaissis, contraste écrasé, chasse élargie → registre **moderne, de labeur** |
| Légendes, notes | `"opsz" 8` | encore plus robuste |

C'est la réponse littérale au brief : la nuance entre le classique et le moderne n'est pas un
compromis figé, c'est un curseur, et il est dans le fichier.

### Pourquoi Plex Mono et pas autre chose

Le risque des paires, ce sont les deux extrêmes : trop proches (malaise) ou trop lointaines
(rupture). Ici, les métriques tranchent :

| | Literata | IBM Plex Mono | écart |
| --- | --- | --- | --- |
| Hauteur d'x | 507/1000 em | 516/1000 em | **1,8 %** |
| Hauteur de capitale | 700/1000 em | 698/1000 em | **0,3 %** |
| Boîte `hhea` | 1,485 em | 1,300 em | — |

À taille de police égale, **les capitales s'alignent à 0,3 % près et les hauteurs d'x à 1,8 %
près**. Un `2021 – 2024` en Plex Mono posé à côté d'un intitulé de poste en Literata a la même
assise optique sans correctif de taille. C'est un appariement métrique, pas un pari esthétique.

Et sur le dessin, la distance est franche et lisible : romain humaniste à axe 98° et contraste
1,82:1 d'un côté, monochasse néo-grotesque à axe 90° et contraste 1,21:1 de l'autre. Personne ne
confondra les deux rôles. C'est le contrepoint recherché : **la chaleur porte le discours, la
machine porte les données.** Pour un développeur Spring Boot / Angular / Flutter, ce partage
raconte exactement le bon message — et il est déjà à moitié en place, puisque Plex Mono est là.

### Ce qu'on garde, ce qu'on remplace

| | Décision |
| --- | --- |
| **IBM Plex Sans** | **remplacée par Literata.** Franchement : elle n'apporte rien que Literata ne fasse mieux dans ce brief, et elle coûte 178,6 Ko dans sa configuration actuelle. |
| **IBM Plex Mono** | **gardée**, sans réserve. C'est le meilleur élément typographique du site actuel. |

### Réglages

```css
:root {
  --font-titre:  var(--font-literata);
  --font-corps:  var(--font-literata);
  --font-donnee: var(--font-plex-mono);
}
.titre-section {
  font-family: var(--font-titre);
  font-variation-settings: "opsz" 48;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;   /* obligatoire : les capitales d'un romain sont dessinées
                               pour être crénées en bas de casse, pas en capitales */
  line-height: 1.15;         /* sûr : É non rogné jusqu'à 0,98 */
}
body {
  font-family: var(--font-corps);
  font-variation-settings: "opsz" 12;
  font-weight: 400;
  line-height: 1.6;
}
.donnee, .periode, .tag-techno {
  font-family: var(--font-donnee);
  font-weight: 500;
  font-size: 0.85em;         /* compense la hauteur d'x de Plex Mono, 1,8 % au-dessus */
}
```

**Note sur le thème sombre.** Le fond est `#131518` et le texte `#e4e5e3`
(`frontend/app/globals.css`). Sur fond sombre, le texte s'épaissit optiquement. Deux ajustements :

```css
.dark body { font-weight: 380; }  /* possible : axe wght continu 200→900 */
```

L'axe variable permet ce demi-cran que des statiques interdisent — argument supplémentaire pour
une variable. **Et l'inverse est interdit : ne jamais descendre en dessous de `wght` 350 en thème
sombre**, sous peine de ramener le délié du `o` sous la barre des 0,7 px.

---

## 6. Ce que ça coûte

Poids mesurés, sous-ensemble `latin` uniquement, `.woff2` tel que servi.

### Option retenue — `next/font/google`, sans axe `opsz` exposé

| Fichier | Requête générée par Next | Poids | Requêtes |
| --- | --- | --- | --- |
| Literata variable | `css2?family=Literata:wght@200..900` | **51,3 Ko** | 1 |
| IBM Plex Mono 400 + 500 | `css2?family=IBM+Plex+Mono:wght@400;500` | **28,9 Ko** | 2 |
| **Total** | | **80,2 Ko** | **3** |

**Contre 207,5 Ko et 6 requêtes aujourd'hui : −127,3 Ko (−61 %) et −3 requêtes**, en ajoutant
une romaine variable de 700 graisses. Le site est plus beau *et* plus léger. Il n'y a pas de
contrepartie à annoncer.

Attention : sans demander l'axe `opsz`, Google **fige** l'axe optique (vérifié : le `fvar` du
fichier servi ne contient plus que `wght 200→900`, l'`opsz` a été instancié à 12). Les réglages
`font-variation-settings: "opsz" 48` du §5 seraient alors sans effet.

### Option avec l'axe optique — `axes: ['opsz']`

| Fichier | Poids | Requêtes |
| --- | --- | --- |
| Literata variable `opsz 7→72` + `wght 200→900` | **107,5 Ko** | 1 |
| IBM Plex Mono 400 + 500 | 28,9 Ko | 2 |
| **Total** | **136,4 Ko** | **3** |

Encore **−71,1 Ko (−34 %) et −3 requêtes** par rapport à l'existant. L'axe optique coûte donc
**56,2 Ko**. Il les vaut : c'est lui qui porte l'argument central du brief.

### Option auto-hébergée — la meilleure, si vous acceptez un script de build

`next/font/google` ne sait pas borner l'intervalle des graisses : le code de
`validate-google-font-function-call.js` n'accepte que des graisses nommées ou `"variable"`, et
`get-font-axes.js` reconstruit alors systématiquement `${min}..${max}`. En revanche l'API `css2`,
elle, **sous-ensemble bien l'intervalle côté serveur** — vérifié :

| Requête `css2` | Poids |
| --- | --- |
| `Literata:wght@200..900` | 51,3 Ko |
| `Literata:wght@400..700` | **38,1 Ko** |
| `Literata:opsz,wght@7..72,200..900` | 107,5 Ko |

Et en instanciant localement avec `fontTools.varLib.instancer` (mesures réelles) :

| Instanciation de Literata | Poids |
| --- | --- |
| `opsz` figé à 12, `wght` 400→700 | **35,4 Ko** |
| `opsz` 12→72, `wght` 400→700 | **60,0 Ko** |
| `opsz` conservé 7→72, `wght` 400→700 | 78,7 Ko |
| aucune restriction (fichier Google) | 107,5 Ko |

**Configuration optimale : `opsz` 12→72 + `wght` 400→700 = 60,0 Ko**, servie en
`next/font/local`, avec `IBM Plex Mono 400` seul (**14,4 Ko**) → **74,4 Ko sur 2 requêtes**, axe
optique conservé. Contrepartie honnête : un script de build à maintenir, et la perte des ajustements
automatiques de police de substitution (`adjustFontFallback`) que `next/font/google` calcule seul.

### Récapitulatif

| Configuration | Poids | Requêtes | vs aujourd'hui |
| --- | --- | --- | --- |
| **Aujourd'hui** (Plex Sans ×4 statiques + Plex Mono ×2) | 207,5 Ko | 6 | — |
| Correction minimale (Plex Sans **variable** + Plex Mono ×2) | 73,5 Ko | 3 | −134,0 Ko |
| **Recommandée** — Literata VF + Plex Mono ×2 | **80,2 Ko** | **3** | **−127,3 Ko** |
| Recommandée + axe `opsz` | 136,4 Ko | 3 | −71,1 Ko |
| Auto-hébergée, instanciée | **74,4 Ko** | **2** | −133,1 Ko |

Toutes les variantes sont en `display: swap` avec `preload: true` sur le sous-ensemble `latin`,
comme aujourd'hui. Aucune n'introduit de CLS supplémentaire.

---

## 7. L'échelle modulaire

L'échelle du site est en ratio **1,250** sur base **17 px**
(`frontend/lib/design/tokens.ts`, `ECHELLE_TYPO.normal = 1.25`).

### La base reste à 17 px. Aucun ajustement.

La hauteur d'x est ce qui détermine la taille *perçue*, pas le corps nominal.

| | hauteur d'x | à 17 px |
| --- | --- | --- |
| IBM Plex Sans (actuelle) | 0,516 em | **8,77 px** |
| **Literata** (proposée) | 0,507 em | **8,62 px** |
| écart | | **−1,7 %, soit 0,15 px** |

Un écart de 0,15 px est **sous le seuil du perceptible** et sous la résolution de la plupart des
rendus. Literata est une substitution quasi iso-optique à IBM Plex Sans. C'est un argument
opérationnel de premier ordre : **on change de police sans retoucher un seul pas de l'échelle,
sans retoucher une seule maquette, sans reprendre un seul `clamp()`.**

Comparaison avec les candidatures écartées, pour montrer ce qu'on évite :

| Police | hauteur d'x à 17 px | base équivalente à l'actuelle |
| --- | --- | --- |
| Literata | 8,62 px | **17 px** (inchangée) |
| Source Serif 4 | 8,07 px | ~18,5 px → **toute l'échelle à refaire** |
| Alegreya | 7,68 px | ~19,4 px → idem |
| EB Garamond | 6,80 px | ~21,9 px → idem, et casse la grille |

### L'interligne, lui, change

C'est le seul ajustement nécessaire, et il est demandé par la physique, pas par le goût.

**Pourquoi.** Une hauteur d'x élevée remplit la ligne et réduit le canal blanc entre deux lignes
à corps égal. Mais Literata a aussi des **empattements francs (2,63:1)** et des **ascendantes
longues** (boîte `hhea` de 1,485 em contre 1,300 em pour Plex Sans, soit **14 % de plus**). Les
empattements créent un rail horizontal qui guide l'œil le long de la ligne — un romain supporte
donc un interligne *plus serré* qu'une linéale à mesure égale. Mais des ascendantes 14 % plus
longues réclament de l'air pour ne pas heurter les descendantes de la ligne précédente. Les deux
effets ne s'annulent pas exactement.

| Rôle | Mesure | Interligne | Justification |
| --- | --- | --- | --- |
| Corps, 66 caractères, 17 px | 66 ch | **1,60** (27,2 px) | boîte `hhea` de 1,485 em → un `line-height` de 1,60 ne laisse que 0,115 em de canal réel ; en dessous de 1,55, les ascendantes de Literata touchent les descendantes |
| Titres de section, capitales | — | **1,15** | pas de bas de casse, donc pas de descendantes ; `É` sûr jusqu'à 0,98 — large marge |
| Grands titres (≥ 34 px) | — | **1,10 à 1,20** | l'interligne doit décroître quand le corps croît ; règle constante |
| Métadonnées Plex Mono | — | **1,45** | boîte `hhea` plus courte (1,300 em), moins d'air nécessaire |

Si l'interligne du corps est aujourd'hui autour de **1,5**, il faut le porter à **1,60**. Si le
`line-height` des titres en capitales est en dessous de **1,0**, il faut le remonter — mais c'est
déjà le cas pour Plex Sans, dont le minimum sûr est **1,15**.

**Un ajustement qui n'a rien à voir avec l'interligne mais qui est obligatoire :** les titres en
capitales exigent `letter-spacing: 0.06em`. Les capitales d'un romain sont crénées pour voisiner
des bas-de-casse ; mises côte à côte sans interlettrage, elles se serrent. Cette règle vaut pour
n'importe laquelle des trois candidatures.

---

## 8. Recommandation

### **Literata**, de TypeTogether (Veronika Burian & José Scaglione), SIL OFL 1.1, gratuite.

**Appariement :** Literata seule pour tout le texte — titres de section en capitales à
`opsz 48 / wght 600`, corps à `opsz 12 / wght 400` — plus **IBM Plex Mono conservée** en 400/500
pour les dates, les périodes et les étiquettes techniques.

**Verdict sur l'existant :** **IBM Plex Sans sort, IBM Plex Mono reste.**

**Coût :** **80,2 Ko sur 3 requêtes** (sans l'axe optique) ou **136,4 Ko sur 3 requêtes** (avec).
Contre **207,5 Ko sur 6 requêtes** aujourd'hui. On gagne sur les deux tableaux.

**Les cinq raisons, toutes chiffrées :**

1. Axe du délié à **98°** — 8° d'inclinaison. Assez pour qu'on sente la plume (vintage), pas
   assez pour qu'on la voie (corporate). La nuance demandée, mesurée.
2. Délié le plus fin à **0,98 px à 17 px**, le plus épais de tous les romains testés. C'est la
   seule qui ne se délite pas sur le fond `#131518` du thème sombre.
3. Hauteur d'x à **0,507 em contre 0,516 em** pour Plex Sans : **1,7 % d'écart**. L'échelle
   modulaire 1,250 / 17 px n'est pas touchée, aucune maquette n'est à reprendre.
4. Capitales accentuées correctement raccourcies (**22,2 %** d'em au-dessus de la capitale contre
   26,5 % au-dessus du bas de casse) et `É` non rogné jusqu'à un interligne de **0,98**. Le site
   est en français : ce point n'était pas négociable, et Libre Franklin, Instrument Sans et
   Newsreader sont mortes dessus.
5. Un seul fichier variable porte deux dessins via `opsz` — le classique pour les titres, le
   moderne pour le labeur. Une famille, une requête, zéro incohérence possible.

**Sur l'ambiance rotin / lin / lueur dorée :** contraste bas (1,82:1), contrepoinçons les plus
ouverts des romains testés (`o` à 494/1000 em), empattements larges et bas. Une page composée
ainsi est chaude et posée sans être chargée. C'est l'« épuré » obtenu par l'espace, pas par la
maigreur — ce qui est la seule façon d'être épuré **et** lisible en thème sombre.

### Ce qui me ferait changer d'avis

| Si… | Alors |
| --- | --- |
| Le propriétaire trouve, sur épreuve réelle en français, que Literata fait « liseuse » ou « manuel scolaire » — un reproche légitime, c'est son origine | **Source Serif 4 + Source Sans 3**. Plus froide, mais irréprochable, et Source Serif 4 a des **chiffres tabulaires par défaut**, ce qui simplifie les métadonnées. |
| Le site s'oriente vers un registre plus éditorial et moins corporate (blog long, récits de projets) | **Alegreya + Alegreya Sans**, axe à 108°, la plus chaude. Avec l'obligation d'écrire `font-feature-settings: "lnum" 1, "tnum" 1` partout où des chiffres s'alignent. |
| 56,2 Ko pour l'axe `opsz` sont jugés trop chers et qu'on refuse le script de build | Charger Literata **sans** `axes: ['opsz']` (51,3 Ko) et porter toute la hiérarchie sur l'axe `wght`. On perd l'argument du §5, on garde la police. |
| Un budget se libère | Je n'ai **pas** exploré sérieusement les polices payantes, parce que les trois candidatures gratuites répondent au brief sans concession mesurable. Le faire aurait été de la dépense pour la dépense — et je n'avancerai pas de prix que je n'ai pas vérifié. |
| Le site doit ajouter le russe ou le grec | Sans objet pour le choix : Literata, Source Serif 4 et Alegreya déclarent toutes `cyrillic` **et** `greek` dans leur `METADATA.pb`. Literata a d'ailleurs été dessinée avec Irene Vlachou pour le grec et Vera Evstafieva pour le cyrillique. |

---

## Annexe — tableau des mesures brutes

| Police | x/em | x/cap | contraste | axe | délié (px@17) | `o` | pied/fût | `L_min` | latin (Ko) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Literata** | 0,507 | 0,724 | **1,82:1** | **98°** | **0,98** | **494** | 2,63 | **0,98** | 51,3 VF |
| Source Serif 4 | 0,475 | 0,709 | 2,11:1 | 90° | 0,77 | 459 | ~2,7 | 1,05 | 49,6 VF |
| Alegreya | 0,452 | 0,710 | 2,07:1 | 108° | 0,74 | 426 | 2,64 | 1,01 | 42,5 VF |
| Alegreya Sans | 0,455 | 0,712 | 1,32:1 | 92° | 0,66 | 390 | — | 1,10 | 69,9 ×3 |
| IBM Plex Sans | 0,516 | 0,739 | 1,21:1 | 90° | 1,21 | 466 | — | 1,15 | 44,6 VF |
| IBM Plex Mono | 0,516 | 0,739 | — | — | — | — | — | 1,15 | 14,4 ×1 |
| Libre Franklin | 0,530 | 0,714 | 1,13:1 | 110° | 0,64 | 486 | — | **1,22** ❌ | 28,6 VF |
| Source Sans 3 | 0,478 | 0,724 | 1,20:1 | 90° | 0,48 | 424 | — | 1,04 | 28,1 VF |
| Spectral | 0,450 | 0,682 | 2,30:1 | 100° | 0,56 | 428 | 2,97 | 1,13 | 87,8 ×4 |
| Lora | 0,500 | 0,714 | 2,75:1 | 90° | 0,65 | 503 | 2,37 | 1,12 | 36,9 VF |
| EB Garamond | 0,400 | 0,615 | 3,17:1 | 110° | **0,45** ❌ | 425 | 2,81 | 0,97 | 43,3 VF |
| Newsreader | 0,426 | 0,636 | 2,17:1 | 92° | 0,65 | 430 | 3,10 | **1,25** ❌ | 128,9 VF |
| Instrument Sans | 0,510 | 0,708 | — | — | — | — | — | **1,18** ❌ | 29,4 VF |
| IBM Plex Serif | 0,512 | 0,734 | — | — | — | — | 3,69 | 1,15 | 78,7 ×4 |

*Légende — x/em : `OS/2.sxHeight` ÷ `unitsPerEm`. axe : angle du délié minimal du `o`, 90° = axe
vertical. délié : épaisseur minimale du `o` en pixels à 17 px. `o` : chasse du `o` en /1000 em.
pied/fût : empattement au pied du `n` ÷ largeur du fût. `L_min` : `line-height` minimal avant
rognage du `É`. VF = fichier variable unique, ×n = n fichiers statiques.*

*Mesures effectuées le 2026-09-22 sur les fichiers `.woff2` du sous-ensemble `latin` servis par
`fonts.googleapis.com/css2`, avec `fontTools 4.x`. Scripts conservés dans le répertoire de
travail de session.*
