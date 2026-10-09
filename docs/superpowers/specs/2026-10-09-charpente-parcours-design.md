# La charpente du parcours

Spec de conception. Premiere des deux specs du chantier. La seconde portera sur
l'horizon marin, et n'est pas traitee ici.

## 1. Intention

Le visiteur doit se sentir sur un site convivial, fluide, qui respire, et qui dit
la rigueur, l'efficacite et le sens du detail. Le parcours est une page unique
dont on passe d'une section a l'autre par une colonne reservee a gauche.

Ce que cette spec livre : la colonne de passage, le parcours en page unique, les
projets en forme de une de presse, le panneau de disponibilite en drapeau au mat,
et l'emplacement de la photo du proprietaire.

Ce qu'elle ne livre pas : l'horizon marin, qui fait l'objet de la spec suivante.

## 2. Registre, et l'unique derogation

Les regles du site restent celles de la spec de l'ampoule suspendue.

- Au plus deux mouvements sur tout le site : l'entree d'un bloc et la bascule de
  l'ampoule. Cette spec n'en cree aucun troisieme.
- Jamais de degrade pour simuler un volume.
- Tout texte atteint 4,5:1 sur son fond, toute bordure signifiante 3:1, dans les
  deux palettes, verifie par test.
- Aucun tiret cadratin, aucun emoji, ni dans le code, ni dans les commentaires,
  ni dans les libelles rendus a l'ecran.

**Une derogation unique a ete accordee**, et elle ne concerne pas cette spec :
l'horizon marin pourra porter du mouvement et des degrades dans sa zone bornee en
bas a droite, avec un budget propre et un arret complet sous
`prefers-reduced-motion`. Rien d'autre sur le site ne gagne ce droit.

## 3. Ce qui est garde, ce qui change

Garde tel quel : l'ampoule suspendue, ses six couches de lumiere, sa transition
d'incandescence, son commutateur, le palier de `--t-page`, la police Literata,
les palettes et leurs tests de contraste, la route `/blog`.

Change : l'en-tete collant disparait. La navigation, le drapeau de disponibilite,
le telechargement du CV, le selecteur de langue et le lien vers le blog passent
tous dans la colonne de gauche. La section des projets est refaite. La section
d'ouverture recoit un medaillon.

## 4. La geometrie, et pourquoi elle est contrainte

L'ampoule est en `position: fixed` et occupe en permanence la bande verticale de
0 a 560 px de la fenetre. Toutes les sections defilent donc derriere elle, sans
exception : il n'existe aucune hauteur de page a l'abri.

L'objet ampoule mesure 172 px de large, ancre a droite par `--ampoule-droite` et
mis a l'echelle par `--ampoule-echelle`, tous deux definis par palier dans
`globals.css`.

Mesure constatee avant cette spec : au palier 900 px, le bloc de contenu de rang
pair entre deja de 11 px dans l'objet ampoule, qui est en `z-index: 60` donc
au-dessus du contenu. **C'est un defaut existant, que cette spec corrige en
passant.**

### 4.1 Les quatre paliers de la colonne

| Fenetre | Colonne | Contenu |
|---|---|---|
| >= 1200 px | **240 px** | noms de sections complets |
| 1024 a 1199 px | **160 px** | noms de sections, corps plus petit |
| 600 a 1023 px | **72 px** | reperes, la section courante seule nommee |
| < 600 px | **40 px** | reperes seuls |

Au-dela de 72 px la colonne est une vraie colonne de mise en page : le contenu
commence a `colonne + gouttiere`. A 72 px et en dessous elle est une bande
superposee, et la gouttiere gauche du contenu est portee a `colonne + 16 px` pour
que le texte ne passe jamais dessous.

Gouttieres heritees de `section-shell.tsx` : 64 px au-dela de 1024 px, 32 px en
dessous.

### 4.2 La regle de degagement

Soit `x0` le bord gauche du contenu, `C` la largeur du conteneur, et `A` l'espace
qui reste jusqu'a l'objet ampoule, garde de 16 px comprise :

```
A = ampoule_gauche - 16px - x0
  avec ampoule_gauche = 100vw - var(--ampoule-droite) - 172px * var(--ampoule-echelle)
```

La mesure du bloc de texte et le decalage du zigzag en decoulent :

```
mesure   = min(C, max(41ch, min(66ch, A)))
decalage = max(0px, min(var(--portfolio-zigzag) * (C - mesure), A - mesure))
```

Le plancher de 41 caracteres existe parce que sans lui la formule etrangle la
mesure a 21 caracteres a 360 px, ce qui n'est plus lisible. Au-dessous d'environ
520 px de fenetre, le degagement ne peut plus etre tenu : le recouvrement est
alors assume et borne a 70 px, la mesure ne descendant jamais sous 31 caracteres.

Le decalage est plafonne et non remplace : `--portfolio-zigzag` reste un reglage
du backoffice, et la formule doit tenir quelle que soit la valeur reglee.

### 4.3 La table, calculee

Valeur de travail pour `66ch` : 576 px, soit 8,73 px par caractere a 17 px de
corps. **Cette valeur est derivee, pas mesuree** : l'avance du glyphe zero de
Literata sur le fichier reellement servi doit etre mesuree a l'implementation, et
la table recalculee si elle s'en ecarte de plus de 2 %.

| Fenetre | Colonne | x0 | C | Mesure | Decalage | Garde |
|---|---|---|---|---|---|---|
| 1440 | 240 | 304 | 1072 | 576 px, 66 ch | 248 | 340 |
| 1200 | 240 | 304 | 832 | 576 px, 66 ch | 92 | 108 |
| 1024 | 160 | 224 | 736 | 576 px, 66 ch | 35 | 51 |
| 1023 | 72 | 88 | 903 | 576 px, 66 ch | 164 | 186 |
| 900 | 72 | 88 | 780 | 576 px, 66 ch | 47 | 63 |
| 700 | 72 | 88 | 580 | 458 px, 53 ch | 0 | 16 |
| 600 | 72 | 88 | 480 | 358 px, 41 ch | 0 | 16 |
| 599 | 40 | 56 | 511 | 425 px, 49 ch | 0 | 16 |
| 480 | 40 | 56 | 392 | 358 px, 41 ch | 0 | -36 |
| 360 | 40 | 56 | 272 | 272 px, 31 ch | 0 | -70 |

Une garde positive signifie que le texte ne passe jamais derriere l'ampoule. Une
garde negative est le recouvrement assume de la section 4.2.

**Discontinuite assumee.** A la traversee de 600 px, la mesure passe de 41 a 49
caracteres : elle grandit alors que la fenetre rapetrit. L'ecart vient du
changement de palier de la colonne, de 72 a 40 px, et non de la regle. Un
visiteur qui redimensionne le verra ; un visiteur normal, jamais.

## 5. La colonne de passage

### 5.1 Structure

Un `<nav>` en `position: fixed`, bord gauche, pleine hauteur, portant une liste
ordonnee. Il porte un nom accessible explicite et non un simple role.

De haut en bas : l'identite, le drapeau de disponibilite, les sections dans
l'ordre du parcours, puis le CV, la langue et le blog au pied.

**L'identite en tete de mat.** L'en-tete collant portait aussi le logo du site et
le nom du proprietaire, et leur disparition les laisserait sans place. Ils
passent donc au sommet de la colonne, au-dessus du drapeau : le mat porte
l'identite, puis le pavillon. Le logo garde ses 36 px et son lien vers la racine.

Sous 1024 px, la colonne tombe a 72 px puis a 40 px, et le nom n'a plus la place
d'etre lu. Seul le logo subsiste, et le nom reste accessible comme nom du lien.
Si aucun logo n'est renseigne, les initiales le remplacent, dans le meme cadre
que le medaillon de la section 8 afin que les deux se repondent.

### 5.2 Suivi de position

Le suivi reutilise l'`IntersectionObserver` deja en place dans
`section-toast-observer.tsx` plutot que d'ajouter un ecouteur de defilement.
L'entree correspondant a la section visible porte `aria-current="true"`.

Quand deux sections sont visibles simultanement, celle dont la part visible est
la plus grande gagne. A egalite, la plus haute dans le document gagne, afin que
le resultat soit deterministe et testable.

### 5.3 Deplacement

Aucun JavaScript. Les entrees sont des ancres, et `scroll-behavior: smooth` est
deja pose sur `html`. Sous `prefers-reduced-motion`, la regle repasse en `auto`.

### 5.4 Ordre de tabulation

Commutateur de l'ampoule, puis la colonne dans l'ordre visuel, puis le contenu.
Le commutateur reste premier parce qu'il commande l'apparence de toute la page.

### 5.5 Reculs

Sans JavaScript, la colonne reste une liste d'ancres utilisable et le defilement
souple fonctionne, puisque les deux sont en CSS. Seul le suivi de position est
perdu, et aucune entree ne porte alors `aria-current`.

Sous `prefers-contrast: more` et en couleurs forcees, la colonne suit les regles
deja ecrites pour l'ampoule aux sections 8.3 et 8.4 de l'annexe lumiere.

## 6. Le journal des projets

### 6.1 Forme

```
=====================================================
  TITRE DE SECTION                     Literata, opsz 48
  Trois chantiers, de mars 2024 a janvier 2026
=====================================================   filet signifiant

[         image du projet de tete, photo1Path        ]
NOM DU PROJET DE TETE
la description court sur les deux colonnes, puis
se poursuit...                 | ...sur la seconde
Spring Boot . Angular . Postgres              signature
- - - - - - - - - - - - - - - - - - - - - - - - - -   filet decoratif
PROJET 2              |  PROJET 3
description           |  description
Flutter               |  Angular
```

Le bandeau porte le titre de section traduit et, sous lui, une ligne de date. Un
filet en `--bordure-signifiante` ferme le bandeau. Les filets de colonne sont en
`--bordure`, decorative.

### 6.2 La ligne de date

Elle se calcule des donnees et jamais de l'horloge, afin que la page ne change
pas d'un jour a l'autre et que le cache de revalidation reste coherent.

Entree : le plus petit `startDate` non nul et le plus grand `endDate` non nul de
l'ensemble des projets. Sortie : un intervalle au format long, dans la langue
courante.

Si aucun projet ne porte de date, la ligne est omise. Elle n'est jamais remplacee
par la date du jour.

### 6.3 Hierarchie et degradation

Le projet de `sortOrder` 0 prend la tete, avec son `photo1Path` s'il existe. Les
suivants passent en deux colonnes.

| Nombre de projets | Rendu |
|---|---|
| 0 | la section n'est pas rendue |
| 1 | le projet de tete seul, sans colonnes ni filet decoratif |
| 2 | le projet de tete, puis un seul article pleine mesure |
| 3 ou plus | le projet de tete, puis les suivants en deux colonnes |

Il y a trois projets en base aujourd'hui. Les quatre cas doivent etre couverts
par test, parce que le nombre evoluera depuis le backoffice.

### 6.4 Mesure des colonnes

Les colonnes vivent dans la mesure calculee a la section 4.2. A 576 px, deux
colonnes separees de 32 px donnent 272 px chacune, soit environ 31 caracteres,
ce qui est la mesure d'une colonne de presse.

**Le seuil de mise en colonnes porte sur la mesure, pas sur la largeur de la
fenetre.** La mesure varie en effet dans un meme palier de fenetre, selon ce que
l'ampoule laisse : elle vaut 576 px a 900 px de fenetre mais 458 px a 700 px. Un
seuil exprime en fenetre produirait donc des colonnes de 213 px, soit 24
caracteres, ou l'on ne lit plus.

Deux colonnes lorsque la mesure atteint **520 px**, ce qui garantit des colonnes
d'au moins 244 px, soit 28 caracteres. En dessous, les articles se suivent en
pleine mesure.

### 6.5 Signature

Les technologies ferment chaque article, a corps optique reduit, separees par un
point median. Elles ne sont pas des etiquettes colorees : la palette ne porte
aucune couleur d'alerte et n'en gagne pas ici.

## 7. Le drapeau au mat

### 7.1 Forme

```
   |\
   | \_____________
   |                \
   |  DISPONIBLE     >
   |  POUR FREELANCE/
   |  _____________/
   | /
   |/
```

Un SVG en ligne, en tete de colonne. Hampe droite au mat, bord libre en queue
d'aronde, et un leger galbe sur les bords haut et bas qui suggere la toile.

**Aucune animation.** Le vent est dans le trace, pas dans le mouvement : le
budget de deux mouvements reste intact.

La boite du SVG est declaree : `width`, `height` et `overflow` sont ecrits et
lus par un test. Cette exigence vient d'un defaut paye sur la branche
precedente, ou l'absence de boite declaree sur l'ampoule a produit un dessin
dissocie de sa zone de clic.

### 7.2 Etats

Les trois etats de `availability-badge.tsx` sont conserves, ainsi que sa regle :
seul l'etat disponible recoit la couleur d'accent, les autres restent neutres, et
aucune couleur d'alerte n'entre dans la palette.

| Etat | Remplissage | Texte |
|---|---|---|
| disponible | `--accent` | `--fond` |
| occupe | `--texte-secondaire` | `--fond` |
| indisponible | `--texte-secondaire` | `--fond` |

Le libelle vient de `availability.label` s'il est renseigne, sinon de la cle de
traduction de l'etat.

### 7.3 Sous 1024 px

La colonne tombe a 72 px puis a 40 px : le drapeau n'a plus la place de porter
son texte. Il devient alors un guidon triangulaire au mat, sans texte, et **le
message de disponibilite se reporte en une ligne dans la section d'ouverture**.
L'information change de place, elle ne disparait pas.

Le guidon garde le nom accessible complet, afin qu'un lecteur d'ecran annonce
l'etat la ou l'oeil ne lit plus qu'une forme.

## 8. Le medaillon

### 8.1 Placement et cotes

Carre de 88 px, au debut de la section d'ouverture, dans la colonne de texte,
aligne sur le bord d'attaque. Il vit donc dans la mesure, a gauche, et ne
s'approche jamais de l'ampoule : aucune cohabitation avec la lumiere n'est a
verifier, et les trois couches de lumiere sont de toute facon en `z-index: -1`,
derriere le contenu.

Bordure de 1 px en `--bordure-signifiante`, qui donne 3,31:1 en clair et 4,04:1
en sombre, donc au-dela du seuil de 3:1. Rayon de 4 px. Aucune ombre, aucun
degrade, aucun filtre.

Pas de cercle : un cercle rogne les epaules et renvoie au registre de l'avatar de
reseau social. Un carre a peine adouci renvoie au registre du document.

Aucun mouvement propre. Le medaillon herite de l'entree de bloc, qui est l'un des
deux mouvements deja autorises.

### 8.2 Les trois densites

| Fichier | Usage |
|---|---|
| 88 x 88 | densite 1 |
| 176 x 176 | densite 2 |
| 264 x 264 | densite 3 |

Declares en descripteurs de densite, sans attribut de tailles, puisque la taille
affichee est fixe.

Cout transfere, un seul fichier par visiteur : environ 3,9 Ko en densite 2 et
8,7 Ko en densite 3. A comparer aux 49 Ko de police prechargee.

### 8.3 Lever le verrou de densite

`next.config.mjs` porte `unoptimized: true`, ce qui neutralise tout `srcSet` sur
l'ensemble du site : aucun ecran a forte densite ne peut aujourd'hui recevoir une
variante, pour aucune image.

**Les variantes sont generees au televersement**, dans `upload.service.ts`, qui
dispose deja de sharp, et le composant declare un `srcSet` explicite. Le drapeau
`unoptimized` n'est pas retire : il toucherait toutes les images du site, et
comme aucune ne depasse 200 px, aucune n'y gagnerait quoi que ce soit.

Le service de televersement ne porte aujourd'hui aucun `.resize()`. Il en recoit
un, pour la seule categorie `personal`, produisant les trois tailles.

### 8.4 Le repli, qui est l'etat actuel

`avatarPath` vaut `null` en base, et le champ n'est consomme nulle part dans le
frontend. **Il n'y a donc pas une regression a corriger mais une piece a
ecrire**, et son repli est l'etat normal jusqu'a ce qu'une photo soit televersee.

Repli : les initiales du proprietaire en Literata a fort corps optique, en
`--texte-secondaire` sur `--surface`, dans le meme cadre et au meme rayon. Le
medaillon ne parait jamais casse.

### 8.5 Ce que le proprietaire doit fournir

Deux fichiers identiques de 200 x 200 px trainent dans `uploads/personal/`, de
meme empreinte, televerses le 31 mars puis le 1er avril. Ils sont a supprimer
quand la nouvelle photo sera en place.

Le fichier actuel est inutilisable pour deux raisons independantes. Sa resolution
plafonne l'affichage a 100 px en densite 2 et 66 px en densite 3. Et son cadrage,
verifie en ouvrant le fichier, montre un sujet de trois quarts tourne vers
l'exterieur, des lunettes de soleil opaques masquant les yeux, un contre-jour de
fenetre sous-exposant le visage, et un kakemono publicitaire lisible en
arriere-plan. **Aucune resolution ne corrige un cadrage.**

Master a fournir : 1600 x 2000 px au minimum, 2400 x 3000 px de preference, non
recadre. Fond uni sans objet lisible. Yeux visibles, sans verres teintes. Haut
sombre et uni, qui tiendra dans les deux palettes.

Une indication qui vaut d'etre suivie : **eclairer le visage depuis le haut a
droite**, de la meme direction que l'ampoule du site. C'est le seul levier de
coherence entre la photo et l'identite de la page, il est gratuit a la prise de
vue, et une photo eclairee par la gauche contredira toutes les ombres du site,
qui sont decalees vers le bas-gauche par regle.

## 9. Ce qui est verifie par le calcul

Le chantier precedent a montre que ce qui n'est pas verifie par le calcul finit
par n'etre verifie par personne. Sont donc couverts par test :

1. la formule de la mesure et celle du decalage, aux dix lignes de la table 4.3,
   garde comprise ;
2. la correction du defaut existant des 11 px au palier 900 ;
3. le contraste des deux remplissages du drapeau sur les deux palettes, 4,5:1
   pour le texte et 3:1 pour la bordure ;
4. la boite du drapeau et celle du medaillon, `width`, `height` et `overflow`
   lus dans la feuille ;
5. la derivation de la ligne de date depuis les `startDate` et `endDate` reels,
   et son omission quand aucune date n'existe ;
6. les quatre cas de degradation du journal, de zero a trois projets et au-dela ;
7. les trois descripteurs de densite du medaillon ;
8. le repli sur les initiales quand `avatarPath` vaut `null` ;
9. la regle de depart entre deux sections simultanement visibles ;
10. le seuil de mise en colonnes du journal, exprime sur la mesure et non sur la
    largeur de fenetre ;
11. l'absence de tout troisieme mouvement : aucune `transition` ni `animation`
    dans les fichiers **crees ou modifies par cette spec**. Le site en porte
    deja par ailleurs, notamment sur `.animated-card`, et ce test ne les vise
    pas ;
12. l'absence de tiret cadratin et d'emoji dans les fichiers **crees ou modifies
    par cette spec**. Le depot en contient deja ailleurs, par exemple dans un
    commentaire de `availability-badge.tsx`, et les nettoyer n'est pas l'objet de
    ce chantier.

## 10. Ce qui ne l'est pas, et revient au proprietaire

Aucune commande ne repond a ces questions, et aucun outil disponible ici ne les
remplace.

1. Le defilement est-il souple et le suivi de la colonne juste ?
2. Le journal se lit-il comme une une de presse ?
3. Le drapeau se lit-il comme un drapeau, et sa queue d'aronde se voit-elle ?
4. Le medaillon est-il net, une fois la photo fournie ?
5. Le recouvrement assume sous 520 px est-il acceptable a l'oeil ?

## 11. Hors perimetre

- L'horizon marin, qui est la spec suivante.
- Le retrait de `unoptimized: true` a l'echelle du site.
- Les quatre reglages de couleur devenus inertes, `bgColor`, `textColor`,
  `accentHue` et `accentSaturation`, presents en base et dans les types mais
  consommes nulle part.
- `backoffice/lib/contrast.ts` et `next-themes` dans le backoffice, dont la
  suppression a ete refusee par le classifieur de permissions et attend une
  decision du proprietaire.
- `will-change: opacity`, parque sur la branche precedente faute de pouvoir
  mesurer s'il aide.

## 12. Deux regles de methode

Elles sont inscrites ici parce qu'elles ont ete enfreintes sur le chantier
precedent, et que chaque infraction a coute une ronde de correction entiere.

**Aucune piece n'est nommee sans ses cotes.** Un plan qui ecrit « la douille »
sans coordonnees fait improviser celui qui l'implemente. Tous les nombres de
cette spec sont calcules et reproductibles.

**La tache qui exige un effet autorise explicitement le fichier qui le porte.**
Trois fois, un effet a ete demande sans que le fichier qui le portait soit dans
la liste autorisee, et trois fois l'effet a ete livre inerte ou le perimetre
depasse en silence.
