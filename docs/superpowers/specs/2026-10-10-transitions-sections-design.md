# Les transitions entre sections

Conception validee le 2026-10-10. Premier des cinq chantiers ouverts apres la
livraison de la charpente du parcours.

## 0. Ce que le proprietaire a demande, et ce qui a ete decide

Demande, mot pour mot : « Lorsqu'on navigue d'une section a une autre, on ne
doit pas voir l'effet du scolle, la transition doit se faire comme si une
section disparaissait pour laisser la place a une autre dans une elegante
souplesse, mais sans alterer l'affichage l'une de l'autre. »

Sept decisions ont ete prises en conception, chacune par le proprietaire :

| Question | Decision |
|---|---|
| Lequel des cinq chantiers d'abord | Les transitions |
| Quand la transition remplace le defilement | Au clic ET a la molette |
| Une section plus haute que l'ecran | Elle defile dedans, puis on pagine |
| Forme de la transition | Fondu sequentiel, par le fond |
| Adresse et bouton Retour | Le clic ajoute une etape, la molette non |
| Construction | Conteneur de pagination, transition declarative |
| Budget de mouvement | Deux se deplacent, le reste parait |
| Portee de la regle de mouvement | Le perimetre de ce chantier seul |

**Cette demande revient sur une decision anterieure du proprietaire.** Au
chantier precedent il avait choisi « defilement continu, colonne qui suit ».
Le present chantier remplace ce modele. Ce n'est pas une contradiction a
resoudre mais un changement d'avis assume, et il est inscrit ici pour que
personne ne « restaure » l'ancien modele en croyant corriger une regression.

## 1. Le cout assume de l'interception de la molette

Intercepter la molette retire cinq choses au visiteur, et aucune n'est
contournable. Elles sont acceptees :

1. La barre de defilement cesse d'indiquer la position dans la page.
2. Le navigateur ne peut plus restaurer la position au retour.
3. L'inertie du pavé tactile se perd, le geste devenant discret et non continu.
4. La recherche dans la page ne trouve plus le texte des autres sections.
5. L'impression ne reproduit plus que la section visible : les autres etant en
   `visibility: hidden`, elles ne s'impriment pas.

Le quatrieme point est moins grave qu'il n'y parait et il faut le dire :
les sections inactives etant en `visibility: hidden` (et non `display: none`,
qu'une decision du chantier a remplace par `visibility` et un positionnement
absolu, pour que le fondu de sortie puisse se jouer), `Ctrl+F` n'y trouve
**rien**. Verifie : Chrome et Firefox excluent de la recherche le texte en
`visibility: hidden` exactement comme celui en `display: none`. Le visiteur ne
trouve donc rien, au lieu de trouver un resultat qu'il ne pourrait pas
atteindre. Ne rien trouver est un comportement honnete ; un resultat
inatteignable ne l'est pas.

Le cinquieme cout est traite par une regle `@media print` qui neutralise la
pagination (`position: static`, `visibility: visible`, `opacity: 1`,
`overflow: visible` sur les sections, `overflow: auto` rendu a `html` et
`body`), exactement comme le repli sans JavaScript de la section 6 : a
l'impression, toute la page sort. Le cout est donc accepte pour l'ecran et
neutralise pour le papier.

## 2. Le modele de pagination

### 2.1 Structure

Un composant client, `ParcoursPagine`, entoure les sections et detient l'index
courant. Au montage il pose sur l'element racine :

- `data-pagination="active"`, qui commande **toutes** les regles de pagination ;

La section active n'est PAS posee sur l'element racine : le contexte React
(`useSectionActive`) porte son identifiant, et la transition est commandee par
`data-active` sur les sections elles-memes (voir 2.5). Un crochet documente
que personne ne lit serait soit supprime, soit cru a tort.

Le document cesse de defiler, et chaque section devient une boite de la hauteur
de la fenetre avec son propre `overflow-y: auto`.

### 2.2 La source unique de la liste des sections

`ParcoursPagine` a besoin de la liste ordonnee des sections, et la colonne de
passage en a deja une, construite par `entreesSections(reglages)`. **Les deux
doivent venir d'un seul module**, sans quoi elles divergeront.

Ce n'est pas une precaution theorique : au chantier precedent, l'ordre de la
colonne avait ete recopie depuis l'ancien en-tete et ne correspondait pas a
l'ordre reel de la page, defaut trouve en revue. Un module unique declare, pour
chaque section, son `id`, sa cle de titre et le reglage qui la conditionne. La
colonne et le conteneur le consomment tous deux. Un test verifie qu'aucun des
deux ne reconstruit la liste localement.

### 2.3 La regle de pagination, comme fonction pure

Le coeur est un reducteur sans effet de bord, donc testable sans navigateur :

```
prochainIndex(index, nombre, direction, enButee) -> index
```

- `enButee` est faux : la section defile a l'interieur, l'index ne change pas.
- `enButee` est vrai et une section existe dans cette direction : l'index bouge
  d'un cran.
- `enButee` est vrai et il n'y a plus de section : l'index ne change pas, et
  rien ne rebondit.

La detection de butee tolere un pixel, pour absorber les rapports de pixels
fractionnaires : vers le haut `scrollTop <= 1`, vers le bas
`scrollHeight - clientHeight - scrollTop <= 1`.

### 2.4 Molette, tactile, clavier

**Molette.** Le pavé tactile emet beaucoup de petits evenements ; un cran de
souris en emet un gros. On accumule donc `deltaY` et on pagine quand le cumul
depasse **60 px** dans une fenetre de **300 ms**. L'accumulateur se remet a zero
apres un changement de section et apres 300 ms de silence.

**Verrou.** Pendant la transition et **80 ms** apres, aucun changement de
section n'est accepte. Sans ce verrou un geste continu sauterait trois sections.

**Tactile.** Un glissement vertical de plus de **48 px** pagine, sous la meme
regle de butee : on defile d'abord dans la section.

**Clavier.** `PageDown` et `PageUp` paginent toujours. `Fin` et `Debut` vont a
la derniere et a la premiere section. Les fleches haut et bas defilent dans la
section et ne paginent qu'en butee, afin de ne pas voler le defilement fin.

### 2.5 La transition

Commandee par `data-active`, que le conteneur pose sur la section active en
passant par un etat intermediaire ou aucune section ne le porte. Jamais les deux
sections a la fois, et aucune deformation : seule l'opacite varie.

La sortante descend son opacite a zero, puis passe en `visibility: hidden`
(transition de visibilite retardee de la duree de sortie). L'entrante monte de
zero a un. Les sections sont superposees en position absolue : `display: none`
couperait le fondu sortant, d'ou `visibility`. **Ne pas « restaurer »
`display: none`** en croyant corriger une regression.

**Il existe donc un instant ou aucune section n'est visible, et c'est voulu.**
C'est le « passage par le fond » : une section disparait, le fond nu apparait,
la suivante parait. Ce n'est pas un clignotement a corriger, et personne ne doit
le « reparer » en faisant se chevaucher les deux fondus, ce qui ramenerait le
fondu croise que le proprietaire a ecarte.

Les deux durees se partagent le jeton `--duree` existant,
qui vaut `calc(400ms * var(--portfolio-animation-speed, 1))` et reste donc
pilote par le backoffice :

- sortie : `calc(var(--duree) * 0.45)`, soit 180 ms par defaut ;
- entree : `calc(var(--duree) * 0.55)`, soit 220 ms par defaut.

L'echange complet tient ainsi dans une seule `--duree`. C'est deliberé : on
pagine jusqu'a huit fois de suite, et deux fondus de 400 ms donneraient 800 ms
par changement, ce qui devient poussif a la repetition.

L'assouplissement est le jeton `--courbe` existant,
`cubic-bezier(0.22, 1, 0.36, 1)`.

Sous `prefers-reduced-motion`, et selon le motif deja en place dans la feuille
avec son echappement `[data-mouvement="force"]`, les deux durees tombent a zero.
L'echange devient instantane sans qu'aucune branche de code n'ait a le prevoir.

### 2.6 Adresse et historique

- Clic sur une entree de la colonne : `pushState`, donc le bouton Retour ramene
  a la section d'ou l'on venait.
- Molette, tactile, clavier : `replaceState`, donc l'adresse suit sans gonfler
  l'historique. Sans cela chaque cran de molette creerait une etape et il
  faudrait vingt Retours pour quitter le site.
- A l'ouverture, un fragment dans l'adresse fixe l'index de depart. Un fragment
  inconnu retombe sur la premiere section.
- `popstate` est ecoute : le bouton Retour change l'index sans recharger.

## 3. Ce que la pagination emporte

### 3.1 Suppressions

**`lib/use-reveal.ts` et les regles `.reveal` et `.reveal-visible`.** Avec une
section entierement visible des son arrivee, le test `dejaVisible` du hook
serait toujours vrai et l'apparition ne se declencherait jamais. C'est du code
mort, et c'est son creneau de mouvement qui paie la transition.

**`lib/parcours/section-courante.ts` et `lib/parcours/suivi.test.ts`.** Le suivi
de position par `IntersectionObserver`, livre au chantier precedent, devient
sans objet : la section courante est desormais un etat detenu par le conteneur,
et `aria-current` en decoule. Ce travail a servi, il part.

**`content-visibility: auto` sur les sections de rang 4 a 6.** C'etait une
mitigation de performance pour une page qui defile. `visibility: hidden` sur
les sections inactives la supplante, et laisser les deux mecanismes se
superposer n'apporterait rien.

Les trois suppressions sont verifiees **comme des suppressions** : un test
constate l'absence des fichiers et l'absence de tout import vers eux.

### 3.2 Le toast de section change de moteur

Il annonce aujourd'hui la section traversee, declenche par observation a 30 pour
cent de visibilite. Avec la pagination chaque section arrive entierement
visible, donc il se declencherait a chaque cran de molette, jusqu'a neuf fois.

Il devient commande par le changement d'index, avec un **delai de stabilisation
de 400 ms** : on n'annonce que la section ou l'on s'arrete vraiment. Un
changement d'index pendant ce delai annule l'annonce en attente.

`section-toast-observer.tsx` perd son `IntersectionObserver` et recoit la
section active.

### 3.3 Le pied de page descend dans la derniere section

Il ne peut pas etre une page : il n'a pas d'entree dans la colonne. Il ne peut
pas flotter : c'est exactement ce qui vient de cacher le lien GitHub du
proprietaire derriere la colonne, defaut critique de la revue finale du chantier
precedent.

Il devient donc la fin du defilement interne de la **derniere section rendue**,
qu'on atteint en continuant de descendre, la ou on le cherche. « Derniere
rendue » et non « temoignages » : les sections sont conditionnees par le
backoffice, donc le conteneur designe la derniere effectivement presente.

### 3.4 L'ouverture devient inconditionnelle

La ligne de disponibilite est aujourd'hui en tete de `<main>`, hors de toute
section, parce qu'elle devait survivre a l'extinction des presentations. Avec
des sections calibrees sur la hauteur de l'ecran, un element au-dessus d'elles
mangerait cette hauteur.

L'ouverture devient donc la **section d'identite**, toujours rendue, portant le
medaillon, la ligne de disponibilite, et les presentations s'il y en a.

**Changement de sens d'un reglage, a signaler au proprietaire :**
`showPresentations` cesse de cacher la section et ne commande plus que les
cartes de presentation a l'interieur. L'identite n'est pas une presentation.
Cela rejoint ce qui a deja ete decide pour le medaillon, dont la presence depend
du portrait et non de la liste.

## 4. Le budget de mouvement

### 4.1 La regle, telle qu'elle est desormais ecrite

**Deux choses se deplacent, et elles seules : l'incandescence de l'ampoule et la
transition entre sections. Tout le reste parait, par l'opacite seule.**

La distinction est entre ce qui *voyage* et ce qui *parait*. Elle est
verifiable : hors des regles des deux mouvements autorises, aucun `translate`
dans une transition ou une animation.

En pratique la transition telle que concue n'emploie que l'opacite. Etre
autorise a se deplacer n'oblige pas a le faire.

### 4.2 Une exception nommee

La barre de progression du toast configurable (`toast-progress`) emploie
`scaleX`. Elle est conservee. Une barre ancree a son origine qui change de
longueur ne deplace aucun objet a l'ecran : son changement de taille **est**
son information, et la retirer retirerait la fonction, non la decoration.

C'est la seule exception, elle est nommee ici, et elle ne s'etend a rien
d'autre.

### 4.3 Ce que ce chantier ne corrige pas

L'inventaire reel du site a ete fait : **21 regles** de la feuille deplacent
quelque chose, **4 jeux d'images-cles** existent (`item-cascade`,
`toast-enter`, `toast-exit`, `toast-progress`), et **10 fichiers de composants**
portent un deplacement ou une transition, y compris les deux pages de blog.

Sur decision du proprietaire, la regle ne s'applique ici qu'au perimetre de ce
chantier : la transition, les deux toasts, et le retrait de l'apparition des
blocs. Restent donc en place jusqu'a un chantier dedie, et c'est assume :

- le carrousel des temoignages, qui glisse depuis la droite
  (`slide-in-from-right-4`) ;
- la cascade de cartes `item-cascade`, qui emploie `translateY`, `scale` et
  `rotateX` ;
- les decalages au survol de `.animated-card`, deja exemptes nommement par la
  spec du chantier de l'ampoule ;
- les `transition-colors` et `transition-all` de dix fichiers.

## 5. Accessibilite

**Un seul etat visible, un seul etat percu.** La section sortante passe en
`visibility: hidden`, ce qui la retire a la fois de l'arbre d'accessibilite et de
l'ordre de tabulation. Un lecteur d'ecran percoit ce qu'un voyant voit, et la
tabulation ne peut pas se perdre dans une section invisible.

**L'arrivee est annoncee.** Une region `aria-live="polite"` nomme la section ou
l'on arrive, parce que le changement d'`aria-current` dans la colonne n'est, lui,
annonce par rien.

**Le focus suit la section arrivante, quelle que soit l'origine du changement.**
Clic, clavier, molette, geste tactile ou historique : le focus se deplace vers
la section arrivante, qui porte `tabindex="-1"` pour pouvoir le recevoir
(`preventScroll`). La spec avait d'abord prevu de le laisser immobile sur un coup
de molette ; c'etait faux en pratique, car la section sortante devient
`visibility: hidden` et un element invisible ne peut pas garder le focus : le
navigateur le rend a `body` et la tabulation suivante repart du haut du
document. Le focus etant perdu de toute facon, le deplacer rend Tab previsible.

**Contraste.** Inchange : 4,5:1 pour le texte et 3:1 pour les bordures
signifiantes dans les deux palettes. La transition ne passe par aucun etat
intermediaire de couleur, puisqu'elle ne fait varier que l'opacite entre zero et
un sur le fond de la page.

**Couleurs forcees et contraste eleve.** La pagination n'introduit aucune
couleur. Le seul point a verifier est que `visibility: hidden` ne prive pas le mode
contraste eleve d'une indication : la section courante reste signalee par
`aria-current` dans la colonne, dont le rendu en couleurs forcees a ete corrige
au chantier precedent.

## 6. Le repli sans JavaScript

**C'est une contrainte d'ecriture, pas une intention.** Si le `overflow: hidden`
qui tue le defilement du document etait ecrit en dur, une panne de JavaScript
laisserait le visiteur devant la premiere section sans aucun moyen d'avancer.

Donc :

1. Toute regle de pagination est imbriquee sous `[data-pagination="active"]`,
   que seul le JavaScript pose.
2. La feuille ne porte **aucun** `overflow: hidden` inconditionnel sur `html`
   ou `body`.
3. Sans JavaScript, la page se rend exactement comme aujourd'hui : elle defile,
   et les entrees de la colonne restent des ancres qui fonctionnent.

Le depot a deja ce motif, avec le script initial du theme pose dans l'en-tete.

## 7. Verification

### 7.1 Les tests seront categoriques, pas orthographiques

C'est la lecon du chantier precedent, et elle est inscrite ici parce qu'elle a
coute une revue pour etre vue : deux garde-fous portant les deux defauts les
plus graves ne gardaient qu'une ecriture. Retirer le plafond du decalage ne
faisait tomber qu'une regex ; la gouttiere n'etait gardee que par une liste de
trois noms ecrits a la main.

Un test qui interdit une **orthographe** ne protege pas contre une
**categorie**. Les tests de ce chantier sont donc ecrits ainsi :

| Ce qu'il faut garder | La forme categorique |
|---|---|
| Le repli sans JavaScript | **Toute** regle de pagination est sous `[data-pagination="active"]` : une regle ajoutee ailleurs fait echouer le test en se nommant |
| Le budget de mouvement | **Aucun** `translate` dans une transition ou une animation hors des deux mouvements autorises et de l'exception nommee |
| La source unique des sections | Ni la colonne ni le conteneur ne reconstruisent la liste : verifie par l'import, non par une liste de noms |
| Les trois suppressions | Absence des fichiers **et** absence de tout import vers eux |
| Le mouvement reduit | Les deux durees tombent a zero sous `prefers-reduced-motion` |

### 7.2 Ce qui se teste sans navigateur

Le reducteur `prochainIndex` est pur : butee ou non, direction, bornes aux deux
extremites, et absence de rebond. L'accumulateur de molette et le verrou se
testent par injection d'une horloge.

Le rendu se teste par `renderToStaticMarkup`, motif introduit au chantier
precedent : une seule section visible a la fois, `aria-current` sur la bonne
entree, `tabindex="-1"` sur la section active, et le pied de page present dans
la derniere section rendue.

### 7.3 Ce qu'aucune commande ne remplace

Cinq verifications reviennent a l'oeil du proprietaire :

1. La souplesse de l'echange, et si 180 ms puis 220 ms est le bon rythme.
2. Le ressenti de la molette : si 60 px de cumul est le bon seuil, et si le
   verrou de 80 ms suffit a empecher les sauts.
3. Le moment du defilement interne d'une section longue, qui est le seul endroit
   ou l'on voit encore defiler.
4. Le pied de page atteint en fin de derniere section.
5. Le comportement sur telephone, au pouce.

## 8. Ce que ce chantier ne contient pas

Les quatre autres chantiers ouverts restent a faire, dans l'ordre que le
proprietaire choisira :

- **Le parchemin des projets.** Cliquer un projet ouvre un parchemin portant les
  details et le lien LinkedIn. Repond a une question laissee ouverte au chantier
  precedent, ou quatre champs avaient ete perdus. Devra cohabiter avec la
  transition definie ici.
- **La section contact.** Elle est le dernier morceau reste a l'idiome d'avant la
  refonte : texte centre, variantes `dark:` de Tailwind, et un vert code en dur
  hors palette, ce que la regle d'absence de couleur d'alerte interdit.
- **L'ampoule et le menu sur les pages de blog.** Le blog a son propre layout de
  cinq lignes, sans ampoule ni colonne, et ses entrees de menu ne peuvent pas
  etre des ancres de sections puisqu'il s'agit d'une autre route.
- **L'horizon marin,** convenu depuis le premier decoupage et jamais specifie.
  **Avertissement :** le toast de section est ancre en bas a droite, a 28 px du
  coin, exactement ou l'horizon doit venir. Les deux se disputeront ce coin.

Et un cinquieme, cree par l'inventaire de la section 4.3 : **la mise au pas des
mouvements** sur le reste du site.
