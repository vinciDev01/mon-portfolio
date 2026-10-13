# Le parchemin des projets

Conception validee le 2026-10-11. Deuxieme des cinq chantiers ouverts apres la
livraison de la charpente du parcours.

## 0. Ce que le proprietaire a demande, et ce qui a ete decide

Demande, mot pour mot : « Lorsqu'on clique sur un projet, afficher comme un
parchemins affichant les details du projet. Sur le parchemin, on doit voir les
details du projet, et offrir la possibilite d'afficher le lien du compte
LinkedIn ».

Quatre decisions ont ete prises en conception, chacune par le proprietaire :

| Question | Decision |
|---|---|
| De quel LinkedIn s'agit-il | Celui des collaborateurs, chacun avec son lien |
| Qu'est-ce qui fait le parchemin | La forme seule, aucun mouvement |
| Ouvrir compte-t-il dans l'historique | Oui, et le bouton Retour le ferme |
| Construction | Une surcouche qui suspend la pagination |

**Le LinkedIn est celui des collaborateurs.** Le champ existe aux deux endroits,
`ProjectCollaboratorDto.linkedinUrl` et `PersonalInfoDto.linkedinUrl`, et
l'ambiguite a ete levee par le proprietaire. Le parchemin credite donc les
personnes avec qui il a travaille. Cela solde au passage une dette qu'une revue
du chantier precedent avait relevee : des personnes nommees en base n'etaient
plus creditees a l'ecran.

**Ce chantier rend les quatre champs que la refonte avait perdus**, y compris la
seconde photo et le public cible, que j'avais refuse de remettre dans le
journal. Ils ont leur place dans le dossier complet d'un projet, pas dans une
une de presse.

## 1. Les couts assumes

**Trois champs deviennent inaccessibles sans JavaScript.** Un dialogue ferme ne
s'ouvre pas sans lui. L'article du journal reste alors la seule vue, et il porte
deja le nom du projet, ses dates, les noms des collaborateurs, la description,
les technologies et le lien de demonstration. Sont perdus sans JavaScript : la
seconde photo, le public cible et les liens LinkedIn.

C'est un cout du meme ordre que les cinq que la pagination assume deja, et il
est inscrit ici plutot que decouvert.

**Les comportements modaux ne sont pas verifiables par les tests de ce depot.**
Mesure : jsdom, l'environnement de test du frontend, **n'implemente pas
`showModal`**. La methode est absente, le dialogue ne s'ouvre jamais, et la
propriete `inert` est inconnue. La capture du focus, son retour, Echap et
l'inertie du reste de la page sont donc hors de portee de tout test ecrit ici.
La section 7 dit ce qui reste couvert et ce qui revient a l'oeil.

## 2. La forme

**Un parchemin par la forme, jamais par le mouvement.** C'est le meme
raisonnement que le drapeau de disponibilite : le sens vit dans le dessin, pas
dans une animation ni dans un effet de matiere. Le budget de deux mouvements du
site reste donc intact, et ce chantier n'en consomme aucun.

Une feuille en `--surface`, plus haute que large, bordee de
`--bordure-signifiante` pour se detacher du fond. Ses bords superieur et
inferieur portent une bande d'enroulement dessinee en SVG, **remplie a plat** en
`--fond`, la courbe vivant dans le trace. Les cotes restent droits : un
parchemin pend, il ne bombe pas.

**Pourquoi `--fond` pour les bandes.** Mesure : `--fond` est systematiquement
plus sombre que `--surface` dans les deux palettes, #F6F1E8 contre #FCF8F1 en
clair et #131518 contre #1A1D21 en sombre. Une bande en `--fond` donne donc un
dessous ombre coherent dans les deux themes, sans aucun degrade et sans nouveau
jeton.

La feuille parait par l'opacite seule, posee sur le voile du dialogue.

### 2.1 Contrastes, mesures et non supposes

| Paire | Clair | Sombre | Seuil |
|---|---|---|---|
| `--bordure-signifiante` sur `--surface` | 3,52:1 | 3,74:1 | 3:1 |
| `--texte-secondaire` sur `--surface` | 6,83:1 | 6,32:1 | 4,5:1 |
| `--accent` sur `--surface` | 6,61:1 | 5,51:1 | 4,5:1 |

Les trois paires passent dans les deux palettes. Le texte courant emploie
`--texte`, deja mesure ailleurs sur `--surface`. Aucun jeton nouveau n'est
introduit, donc aucun contraste nouveau n'est a verifier.

## 3. Le declencheur

**Le titre du projet devient un bouton**, et la photo de tete aussi pour le
projet de tete.

**Pas l'article entier.** L'article contient deja le lien de demonstration, et
un bouton qui contient un lien est un defaut d'accessibilite, pas un detail de
balisage. Le titre en bouton laisse le lien de demonstration frere, et les deux
restent atteignables au clavier dans un ordre previsible.

La cle `projects.clickForDetails` existe encore dans les trois dictionnaires,
orpheline depuis la suppression de l'ancienne fenetre de detail. Elle sert
d'indication au survol et de nom accessible complementaire.

## 4. Le contenu, et son ordre

Un parchemin se lit de haut en bas. L'ordre est donc :

1. Le nom du projet.
2. Ses dates propres, en corps optique reduit, formatees en UTC et jamais depuis
   l'horloge, par la meme regle que la ligne de date du journal.
3. Les deux photos, `photo1Path` et `photo2Path`.
4. La description.
5. Le public cible, `targetAudience`.
6. Les technologies.
7. Les collaborateurs, chacun avec son lien LinkedIn.
8. L'adresse du projet en ligne, `projectUrl`.
9. Le lien de demonstration, `demoUrl`, en cloture, comme l'action finale.

**Les deux adresses sont distinctes, et les blocs 8 et 9 aussi.** `projectUrl`
mene au projet LUI-MEME, son site en ligne ; `demoUrl` mene a une
DEMONSTRATION, une video, un bac a sable, une maquette jouable. Les deux
libelles doivent differer a l'ecran, sinon le visiteur ne sait pas lequel mene
ou. Les deux ferment le parchemin parce que ce sont des ACTIONS, et l'adresse du
projet precede la demonstration : une demonstration est un artefact derive de la
chose qu'elle demontre, et le lien de demonstration reste ainsi l'action finale.

**Les deux adresses passent par la meme regle que les liens des credits** :
`https:` seul. Une adresse hors `https:` ne rend AUCUN lien, et le bloc
disparait avec elle, le bloc et le lien lisant la MEME fonction. Un
`javascript:` saisi au backoffice ne doit jamais devenir un lien vivant sur une
page publique, et un bloc titre sans lien dessous est un bloc vide.

**Degradation champ par champ.** Chaque bloc disparait quand sa donnee est
absente, sans laisser d'espace ni de titre vide. Un collaborateur dont
`linkedinUrl` est nul rend son nom **sans lien**, et non un lien mort. Les
courriels des collaborateurs ne sont pas affiches : la demande ne porte que sur
LinkedIn, et exposer une adresse en clair invite les moissonneurs.

**Les technologies ne sont pas des etiquettes colorees.** La palette ne porte
aucune couleur d'alerte et n'en gagne pas ici ; elles sont separees par un point
median, comme dans le journal.

## 5. Le contrat d'interaction

### 5.1 Un `<dialog>` ouvert par `showModal()`, avec un repli

Le navigateur fournit alors quatre choses : la couche superieure, le voile,
Echap, et l'inertie du reste de la page. Il capture le focus dans le dialogue et
le rend a l'element declencheur a la fermeture. Ecrire cela a la main est
precisement la ou les sites se trompent ; le laisser au navigateur supprime le
risque au lieu de le gerer.

**Le repli, en deux lignes :** si `showModal` est absente, poser l'attribut
`open` directement. Le parchemin s'ouvre alors sans etre modal. Deux benefices :
le composant ne casse pas la ou la methode manque, et un test peut exercer
l'ouverture, la fermeture, le contenu et l'historique par ce chemin, ce qui est
la seule voie possible sous jsdom.

### 5.2 La pagination se suspend

Sans quoi une molette sur le voile changerait de section sous le parchemin.

Le fournisseur qui porte deja la section active gagne un drapeau
`surcoucheOuverte`, que le parchemin pose a l'ouverture et retire a la
fermeture. Les gestionnaires du conteneur le lisent et sortent tot.

### 5.3 La garde de la molette devient generique

Elle sort aujourd'hui pour `.colonne-passage`, si et seulement si la colonne
peut reellement defiler dans le sens de l'evenement. Elle sortira desormais pour
**tout element qui se declare proprietaire de son defilement**, la colonne et le
parchemin le declarant tous deux par un attribut.

Une regle, deux clients. La re-revue de la branche precedente avait ecrit que le
parchemin « devra soit s'ajouter a la garde, soit la rendre generique » : on paie
la dette au lieu d'empiler un second cas particulier.

### 5.4 L'historique, et sa precedence

Ouvrir pose une entree par `pushState`. Le bouton Retour ferme donc le
parchemin au lieu de quitter la page, ce que les gens attendent d'une surcouche,
et ce qui prolonge la decision deja prise : un clic delibere merite une entree,
un cran de molette non.

**Deux precautions, et la premiere est subtile.**

Le conteneur ecoute **deja** `popstate` pour changer de section. Il y a donc deux
consommateurs du meme evenement, et celui du parchemin doit primer : si un
parchemin est ouvert, `popstate` le ferme et ne change **pas** de section.

Et fermer par Echap ou par le bouton doit **consommer** l'entree d'historique,
par `history.back()`, sans quoi un Retour plus tard « fermerait » un parchemin
deja ferme.

### 5.5 Pas d'adresse partageable

Le proprietaire a ecarte `#projets/mon-projet`. La base ne fournit aucun
identifiant stable et lisible par projet, et le deriver du nom demanderait une
regle de translitteration que rien d'autre ne reclame.

## 6. Accessibilite

Les quatre exigences, dont trois viennent du navigateur par `showModal` :

1. **Echap ferme.** Natif.
2. **Le focus ne sort pas par tabulation.** Natif.
3. **A la fermeture, le focus revient sur le titre qui a ouvert.** Natif.
4. **Le reste de la page devient invisible aux lecteurs d'ecran.** Natif, par
   l'inertie de la couche superieure.

Ce qui reste a notre charge :

- Le dialogue porte un nom accessible : `aria-labelledby` vers le titre du
  projet rendu dans le parchemin.
- Le bouton de fermeture est une croix dessinee en SVG (jamais le caractere de
  multiplication) sans texte visible, et son nom accessible reste obligatoire :
  il vient de l'`aria-label` seul, WCAG 2.5.3 ne valant qu'en presence de texte
  visible.
- Les deux photos portent un `alt` vide, le nom du projet etant lu juste a cote,
  comme la photo du journal.
- Chaque lien LinkedIn porte le nom de la personne dans son nom accessible, et
  non « LinkedIn » seul repete N fois, ce que WCAG 2.4.4 demande.
- Les liens externes portent `rel="noopener noreferrer"`.
- Le parchemin a son propre defilement interne, et son contenu reste atteignable
  au clavier.

**Mouvement reduit :** rien ne bouge, donc rien a prevoir. Le voile et la feuille
paraissent par l'opacite, instantanement sous `prefers-reduced-motion`, comme le
reste du site.

**Couleurs forcees :** le parchemin n'introduit aucune couleur. Les bandes
d'enroulement sont des `fill` SVG, que le mode force ne force pas ; elles
recevront donc `fill: Canvas` et la bordure `CanvasText`, selon le motif etabli
au chantier precedent apres qu'un `forced-color-adjust: none` mal employe a ete
corrige.

## 7. Verification

### 7.1 Les tests seront categoriques, pas orthographiques

C'est la lecon des deux chantiers precedents, inscrite ici parce qu'elle a coute
cher deux fois : un test qui interdit une **orthographe** ne protege pas contre
une **categorie**.

| Ce qu'il faut garder | La forme categorique |
|---|---|
| La forme sans degrade | Aucune regle du parchemin ne porte `gradient`, et les bandes sont des `fill` plats |
| Le budget de mouvement | **Aucune** regle du parchemin ne porte `transition`, `transform`, `translate`, `scale` ni `animate` |
| Les contrastes | Calcules depuis les jetons et compares aux seuils, jamais epingles en dur |
| L'absence d'interactif imbrique | Le bouton du titre ne contient **aucun** element interactif, verifie sur le rendu |
| Un collaborateur sans LinkedIn | Son nom est rendu sans balise de lien, verifie sur le rendu |
| La garde generique | Un parchemin ouvert empeche la pagination, verifie sous jsdom |
| La precedence de l'historique | `popstate` avec un parchemin ouvert le ferme et ne change pas de section, verifie sous jsdom |

### 7.2 Ce qu'aucun test de ce depot ne prouvera

Mesure : jsdom n'implemente pas `showModal`, et la propriete `inert` y est
inconnue. Les quatre comportements de la section 6 que le navigateur fournit
sont donc **hors de portee**, et le chemin de repli les contourne precisement
pour permettre de tester le reste.

Reviennent donc a l'oeil du proprietaire :

1. La capture du focus, et son retour sur le titre d'origine a la fermeture.
2. Echap.
3. L'inertie du reste de la page, au lecteur d'ecran.
4. La lecture du parchemin comme un parchemin, et non comme une boite blanche.
5. Le defilement interne du parchemin, molette et clavier, sans que la section
   derriere ne bouge.
6. Le bouton Retour, et le geste de retour sur telephone.

## 8. Ce que ce chantier ne contient pas

Trois chantiers restent ouverts, dans l'ordre que le proprietaire choisira :

- **La section contact.** Elle est le dernier morceau reste a l'idiome d'avant la
  refonte : texte centre, variantes `dark:` de Tailwind, et un vert code en dur
  hors palette, ce que la regle d'absence de couleur d'alerte interdit.
- **L'ampoule et le menu sur les pages de blog.** Le blog a son propre layout,
  sans ampoule ni colonne, et ses entrees de menu ne peuvent pas etre des ancres
  de sections puisqu'il s'agit d'une autre route.
- **L'horizon marin.** Avertissement conserve : le toast de section est ancre en
  bas a droite, a 28 px du coin, exactement ou l'horizon doit venir.

Et un quatrieme, cree par l'inventaire du chantier precedent : **la mise au pas
des mouvements** sur le reste du site, soit 21 regles, 4 jeux d'images-cles et
10 fichiers, dont le carrousel des temoignages et la cascade `item-cascade`.
