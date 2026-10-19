# Feuille de route

Ce document dit où en est le portfolio, ce qu'il cherche à être, et ce qui reste
à faire. Il est écrit pour le propriétaire et pour quiconque, humain ou agent,
reprend le travail après lui.

Tous les chiffres qu'il contient ont été mesurés le 19 octobre 2026, pas
rappelés de mémoire. Quand une affirmation n'a pas été vérifiée, elle le dit.

---

## 1. Où en est le projet

**Branche `charpente-parcours`, poussée sur `origin`.** 5 commits locaux
restent non poussés à cette date.

| Espace | Tests | Remarque |
|---|---|---|
| `frontend` | 607 sur 27 fichiers | typecheck propre |
| `backend` | 91 sur 7 fichiers | typecheck propre |
| `backoffice` | **aucun** | pas de script de test, voir la dette D2 |

Le lint du frontend reste à **exactement un problème**, `i18n-context.tsx:35`,
antérieur à tous ces chantiers. C'est la valeur de référence : si un travail
porte le lint à deux problèmes, il a introduit quelque chose.

**Trois chantiers sont livrés**, chacun avec sa spécification dans
`docs/superpowers/specs/` :

1. **La charpente du parcours.** La page ne défile plus. Chaque section est une
   boîte de la hauteur de l'écran, en position absolue, avec son propre
   défilement interne. Une colonne de navigation fixe remplace l'en-tête
   collant. Un médaillon porte le portrait, un drapeau dit la disponibilité.
2. **Les transitions entre sections.** On ne voit plus l'effet du défilement :
   une section disparaît pour laisser la place à une autre, par l'opacité
   seule. Un conteneur client intercepte molette, tactile, clavier, clic et
   `popstate`, avec un verrou de transition.
3. **Le parchemin des projets.** Au clic sur le titre, la photo de tête ou le
   bouton « Détails », un `<dialog>` s'ouvre et montre le projet au complet :
   deux photos, description, public concerné, technologies, collaborateurs avec
   leur LinkedIn, adresse du projet, lien de démonstration.

---

## 2. La vision, telle que le travail l'a dessinée

Ces trois chantiers n'ont pas été conduits au hasard : ils obéissent à une idée
qu'il faut comprendre avant d'ajouter quoi que ce soit, sans quoi le prochain
ajout la contredira sans le savoir.

**Le sens vit dans le dessin, pas dans le mouvement.** Le site s'autorise
**deux mouvements, et deux seulement** : l'incandescence de l'ampoule, et la
transition entre sections. Tout le reste paraît par l'opacité. Le drapeau de
disponibilité ne flotte pas, il a la forme d'un drapeau ; les bandes
d'enroulement du parchemin ne bougent pas, elles sont dessinées. Une
fonctionnalité qui réclame un troisième mouvement doit d'abord justifier
pourquoi la forme ne suffit pas.

**Aucun dégradé, nulle part.** Le relief se fait par des aplats, et par le fait
mesuré que `--fond` est systématiquement plus sombre que `--surface` dans les
deux palettes.

**La palette ne porte aucune couleur de marque ni d'alerte.** Pas de vert pour
le succès, pas de rouge pour l'erreur, pas de bleu LinkedIn. Un état se dit par
la forme et par le mot. C'est la règle que la section contact viole aujourd'hui,
et c'est le premier chantier qui reste.

**La lisibilité est une contrainte chiffrée, pas une intention.** 4,5:1 pour le
texte, 3:1 pour les bordures signifiantes, dans les **deux** palettes. Cibles
d'au moins 24 par 24 pixels. La couleur n'est jamais le seul porteur d'une
information.

**Le français partout**, dans le code, les commentaires et les documents. Aucun
tiret cadratin, aucun emoji, aucun caractère de tracé de boîte : une garde de
dépôt les refuse désormais, et elle nomme le fichier et la ligne.

**Les tests constatent des propriétés, pas des orthographes.** Ils lisent une
valeur de propriété CSS par son nom, ou constatent un fait sur le DOM rendu.
Ils ne cherchent jamais une chaîne dans le source d'un fichier. Une garde que
personne n'a vue mordre n'est pas une garde : la méthode employée ici le
vérifie par mutation, systématiquement.

---

## 3. Ce qui reste à construire

Quatre chantiers, dans l'ordre où je les recommande.

### 3.1 La section contact, à refaire

Demande du propriétaire, mot pour mot : « La section contact. Revoir
l'affichage pour un meilleur rendu que celui-ci. »

**Le diagnostic est fait et mesuré.** `frontend/components/portfolio/contact-section.tsx`
porte cinq défauts, et ils ne sont pas esthétiques :

1. **Elle n'est pas sur le système de couleurs du site.** Elle emploie
   `text-muted-foreground`, `border-border` et `bg-background`, qui sont les
   jetons de shadcn, quand les trois chantiers livrés travaillent avec
   `--texte`, `--surface`, `--fond` et `--bordure-signifiante`. Aucun des
   contrastes mesurés ne la couvre.
2. **Elle importe du vert et du rouge de Tailwind** (`bg-green-100`,
   `text-green-600`, `text-red-500`), contre la règle de la palette.
3. **Elle ne montre aucune coordonnée.** La fiche personnelle porte `email`,
   `phone`, `githubUrl` et `linkedinUrl` ; la section n'offre qu'un formulaire.
4. **Rien n'est annoncé aux lecteurs d'écran.** L'état passe de repos à envoi
   puis à succès ou erreur sans aucun `aria-live`, et le succès **remplace tout
   le formulaire** : le focus se retrouve sur un bouton qui n'existe plus.
5. **Aucun attribut d'auto-remplissage**, donc pas de saisie automatique du nom
   ni du courriel ; et rien n'indique quels champs sont obligatoires.

**Trois décisions sont déjà prises par le propriétaire** et doivent être tenues
par la spécification à écrire :

- **Contenu** : ses coordonnées **et** le formulaire, en deux volets. D'un côté
  courriel, téléphone, GitHub et LinkedIn lus de sa fiche, cliquables ; de
  l'autre le formulaire.
- **Succès et erreur** : dits **par la forme et le mot**, sans couleur neuve.
  Bordure signifiante et coche dessinée pour le succès, même bordure et texte
  explicite pour l'erreur. Aucun jeton d'alerte ajouté à la palette.
- **Hauteur** : le formulaire **tient dans l'écran**, quitte à resserrer.
  Prénom et nom sur une ligne, zone de message à trois lignes qui grandit à la
  saisie, titre allégé. Sur mobile la colonne défile, comme les autres sections.

**Ce qui n'est pas encore tranché** : la spécification elle-même n'est pas
écrite. Le chantier est classé **architectural**, parce que corriger le rendu
oblige à changer ce que la section consomme (elle ne prend aujourd'hui aucune
prop et devra lire la fiche personnelle) et donc la signature qu'appelle
`app/page.tsx`, un composant serveur.

### 3.2 Les pages de blog : l'ampoule et le menu

Demande du propriétaire, mot pour mot : « Les pages de blog. Afficher l'ampoule
sur ces pages pour appliquer le thème à tous moments, et afficher le menus. »

**Rien n'est commencé, et rien n'est spécifié.** Ce qu'il faut savoir avant de
s'y mettre :

- L'ampoule et son interrupteur vivent dans `frontend/components/ampoule/`, et
  le thème dans `frontend/lib/theme/`. Le fournisseur pilote une `Animation`
  unique conduisant huit variables CSS. **C'est l'un des deux mouvements
  autorisés** : on le réutilise, on ne le réécrit pas.
- La colonne de navigation est `frontend/components/parcours/colonne-passage.tsx`.
  Elle a été conçue pour la page unique paginée : la porter sur une page de
  blog demande de décider ce que « section active » veut dire là où il n'y a
  pas de sections.
- Une correction d'hydratation vient d'être livrée sur l'interrupteur. Son
  mécanisme est documenté au point D4 ci-dessous, et une page de blog qui rend
  l'ampoule héritera du même problème si elle rend l'état du thème côté serveur.

### 3.3 L'horizon maritime

Demande du propriétaire, mot pour mot : « En bas à droite de la page, il doit y
avoir comme l'image de l'horizon qui s'affiche comme sur un bateau, avec des
lueurs, scintillantes qui régalent l'âme et qui prouvent le sens du détails. »

**Accepté au premier découpage, jamais spécifié.** C'est le chantier le plus
délicat des quatre, pour une raison précise : « des lueurs scintillantes »
décrit un **mouvement**, et le site n'en autorise que deux, tous deux déjà
attribués. Trois issues sont possibles, et le propriétaire doit trancher :

- un horizon **immobile**, dont le scintillement est rendu par le dessin
  (aplats, ponctuations, décalages), dans l'esprit du drapeau et du parchemin ;
- un **troisième mouvement** explicitement autorisé, avec sa justification
  inscrite dans la spécification, ce qui rouvre une règle tenue jusqu'ici ;
- l'abandon du scintillement au profit d'autre chose qui « prouve le sens du
  détail » sans bouger.

Ne pas commencer ce chantier avant cette décision : elle change tout le travail.

### 3.4 La ronde des mouvements

Un inventaire mené en cours de route a trouvé que la règle des deux mouvements
**n'est pas tenue partout**. Mesuré le 19 octobre :

- **13 déclarations de `transform`** dans `frontend/app/globals.css` ;
- **4 jeux d'images-clés** : `item-cascade`, `toast-enter`, `toast-exit`,
  `toast-progress` ;
- **12 fichiers de composants** employant `transition-all`, `transition-colors`,
  `transition-opacity`, `transition-transform`, `animate-in` ou
  `transition-duration`.

La barre de progression du toast est la seule exception nommée par les
spécifications. Tout le reste est à examiner un par un : chacun est soit un
mouvement à retirer, soit une exception à nommer dans une spécification. Ce
chantier n'a pas été ouvert parce qu'aucune demande ne le réclamait, mais il
est la dette la plus directement contraire à la vision.

---

## 4. Ce qui attend une décision du propriétaire

Rien ici n'est un défaut mesuré : ce sont des choix, et ils ne m'appartiennent
pas. Les onze premiers sont détaillés dans
`.superpowers/sdd/2026-10-11-parchemin-projets/decisions-du-proprietaire.md` ;
ceux qui suivent s'y ajoutent.

### Restées ouvertes du parchemin

1. **Les deux photos sont empilées, non côte à côte.** Mesuré : leur conteneur
   est une grille sans déclaration de colonnes. Depuis l'élargissement de la
   feuille à 110 caractères, chaque photo fait environ 910 pixels de large pour
   510 de haut, donc plus de 1000 pixels empilés, et le corps défile. Les
   `Image` déclarent `width={640}` sans attribut `sizes` : le navigateur peut
   servir une source de 640 pixels étirée à 910, donc **floue**. Deux colonnes
   sur écran large règlent les deux problèmes, à condition d'ajouter le `sizes`.
2. **Le logo LinkedIn des collaborateurs n'est pas fait.** La demande est
   enregistrée et arbitrée, l'implémentation ne l'est pas. Les deux décisions
   prises, à confirmer ou renverser : le logo sera **monochrome** et non dans le
   bleu de la marque, parce que la palette ne porte aucune couleur de marque ;
   et il portera le **nom de la personne** comme nom accessible, sans quoi un
   lecteur d'écran annoncerait « LinkedIn » N fois sans dire de qui.
3. **Trois arrêts de tabulation sur l'article de tête** : le titre, la photo et
   le bouton « Détails » ouvrent tous le parchemin. Si la redondance gêne, le
   candidat au retrait est la photo : c'est le plus faible des trois, il a fallu
   lui inventer un nom accessible, et son affordance était invisible.
4. **La validation des URL est plus laxiste au serveur qu'à l'affichage.** Le
   DTO accepte `http://` et les valeurs sans schéma ; le parchemin et le journal
   n'affichent que `https:`. Une adresse en `http:` est donc acceptée au
   backoffice et n'affiche rien, sans message. Resserrer refuserait des données
   déjà en base. Même question pour `linkedinUrl` et pour `name`, validé par
   `@IsString()` seul.
5. **Le bouton de fermeture du parchemin défile hors de l'écran** avec le corps.
   C'est ce qui rend le contenu atteignable au clavier sans `tabindex`, donc le
   choix se défend ; mais sur un parchemin long, il faut remonter pour fermer.
   Échap ferme toujours.
6. **L'attribut `data-defilement-propre` du parchemin est une ceinture par-dessus
   des bretelles.** Mesuré : la garde générique ne mord jamais pour lui, le
   drapeau de surcouche sortant plus tôt dans les quatre gestionnaires. À garder
   par précaution ou à ôter.

### Nées des derniers travaux

7. **La dérogation de lint de l'alignement du thème.** La correction
   d'hydratation fait un `setState` dans un effet, ce que
   `react-hooks/set-state-in-effect` interdit. La dérogation est assumée et
   justifiée. La solution architecturalement plus juste existe : dériver le
   thème par `useSyncExternalStore`, avec `getServerSnapshot` pour l'état
   déterministe et `getSnapshot` pour l'état réel, React se chargeant du second
   rendu. Elle réécrirait le fournisseur qui pilote l'incandescence, ce qui
   dépasse une correction de défaut.
8. **Une chaîne de test de couverture de police** (`typographie-annexe.md:218`)
   contenait le tiret cadratin **en tant que caractère à éprouver**, aux côtés
   du demi-cadratin qui n'est pas banni. Il est désormais désigné par `U+2014`
   avec une note. Si la chaîne doit rester recollable telle quelle, c'est à
   trancher.
9. **Seize tirets cadratins subsistent** dans la compétence tierce installée
   `ui-ux-pro-max`. Ce n'est pas le code du propriétaire, et une mise à jour de
   la compétence déferait le travail. La garde de dépôt les exclut pour cette
   raison.
10. **La feuille du parchemin plafonne à 110 caractères**, soit environ 960
    pixels, et la prose à 70. Ce sont deux nombres à bouger si le rendu ne
    convient pas. La règle typographique derrière : un panneau peut être large,
    une ligne de prose non, l'œil ne retrouvant plus le début de la ligne
    suivante au-delà d'environ 75 caractères.

---

## 5. Ce que nul test ne remplace

Quatre comportements sont **hors de portée des tests**, et c'est mesuré, pas
supposé : jsdom n'implémente ni `showModal` ni `close`, et ignore `inert`. Seule
leur **cause** est verrouillée. À vérifier dans un vrai navigateur :

- Échap ferme le parchemin.
- La tabulation ne sort pas du parchemin ouvert.
- À la fermeture, le focus revient sur le bouton qui a ouvert.
- Le reste de la page est bien inerte pour les lecteurs d'écran.
- Le corps du parchemin défile vraiment quand le contenu déborde.
- La cible du bouton de fermeture fait au moins 24 par 24 pixels : sa taille
  vient de classes utilitaires que jsdom ne met jamais en page.

**Videz `.next` avant de regarder.** Le cache a servi un mélange d'états à
plusieurs reprises pendant ces chantiers : le dossier portait une date du
5 octobre alors que 27 de ses morceaux étaient plus récents qu'un commit du 10.
Un avertissement de clé React manquante, rapporté par le navigateur, n'a jamais
pu être reproduit dans le source et pointe vers ce cache : la boucle de
`parcours-pagine.tsx:413` porte bien `key={s.id}`, et les identifiants de
section sont uniques par construction. Si l'avertissement revient après un cache
vide, il est réel et il faut le reprendre.

---

## 6. Les dettes connues

**D1. Prettier est inutilisable dans ce dépôt.** Le greffon
`prettier-plugin-tailwindcss` échoue sur tout fichier du frontend, le
`.prettierrc` racine désignant une feuille de style à un chemin qui n'existe
pas. Et ce même fichier déclare `semi: false` et `printWidth: 80` quand tout le
frontend est écrit avec points-virgules sur une centaine de colonnes. C'est ce
défaut qui explique les reformatages inattendus de `globals.css`.

**D2. Le backoffice n'a aucun harnais de test.** Pas de script `test`. Tout son
câblage ne tient que par le typage, qui ne voit pas un champ manquant dans un
objet littéral passé à une fonction d'envoi. Trouvé en déclarant une stérilité :
retirer l'envoi d'un champ du formulaire ne fait échouer absolument rien.

**D3. `npm run lint` depuis la racine modifie le dépôt.** Le script racine passe
par `--workspaces`, et celui du backend est `eslint ... --fix` : un seul appel a
reformaté neuf fichiers de `backend/src/` en guillemets simples. Employez
toujours la forme scopée, `npm run lint --workspace frontend`.

**D4. Le commentaire de tête de `frontend/lib/theme/script-initial.ts`** porte
encore une prémisse fausse, celle qui a causé le défaut d'hydratation : il
affirme que React retrouve la classe déjà en place. Le code est corrigé, le
commentaire non.

**D5. La garde typographique vit côté frontend mais couvre le backend.** Sous
mutation d'un fichier du backend, la suite du backend restait verte. Si
l'intégration continue ne lance qu'une des deux suites, il faut la doubler.

**D6. `.claude/` n'est pas balayé ni gardé.** `CLAUDE.md` a été nettoyé à la
main. L'exclusion de `.claude/skills/` est déjà inscrite dans la garde pour le
jour où le périmètre s'élargira.

---

## 7. Comment on travaille ici

Un successeur a besoin de savoir non seulement ce qui reste, mais comment ce qui
existe a été produit. La méthode a un coût et elle a payé.

**Spécification, puis plan, puis exécution par tâches**, chacune revue par un
relecteur frais avant la suivante, puis une revue de branche entière. Les
spécifications sont dans `docs/superpowers/specs/`, les plans dans
`docs/superpowers/plans/`.

**Chaque garde est prouvée par mutation.** On introduit le défaut que le test
doit attraper, on constate qu'il échoue **en nommant la bonne chose**, puis on
retire la mutation. Un test non prouvé ne compte pas. Sur le seul chantier du
parchemin, une centaine et demie de mutations ont été jouées, et les revues en
ont rejoué des dizaines elles-mêmes plutôt que de croire les rapports.

**Ce que cette discipline a trouvé**, et que rien d'autre n'aurait trouvé : une
douzaine d'assertions **vides par construction**, dont une qui cherchait une
chaîne sans accent quand le libellé en portait un ; des gardes qui bannissaient
un caractère en l'écrivant en clair, et qui étaient donc la dernière source de
ce caractère ; cinq gardes qui laissaient passer le trace de boite parce qu'elles comparaient
`> 0x2500` quand ce caractere **est** U+2500 ; et une fixture dont les trois projets
n'avaient pas de photo, donc un bouton jamais rendu, donc une action qu'on
pouvait retirer sans qu'un seul test ne bouge.

**Cinq pièges d'instrument se sont déclenchés**, et il faut les connaître :

1. Une mutation qui laisse une **erreur de syntaxe** empêche la collecte et
   ressemble à une mutation stérile : le total de tests est inférieur à
   l'attendu, sans une seule ligne d'échec. Vérifiez fichiers **et** tests
   collectés après chaque mutation.
2. Une mutation qui **n'enlève pas** la ligne visée ne mute rien, collecte
   entière comprise. Vérifiez que la ligne a disparu.
3. Une **sonde de vérification peut mentir** : une chaîne cherchée à deux
   espaces d'indentation peut être sous-chaîne d'une déclaration indentée à
   quatre. Assertez l'unicité de la chaîne avant de muter.
4. En CSS, une déclaration **ajoutée** en laissant l'originale plus bas ne mute
   rien : la dernière valeur gagne.
5. Un script de mutation qui **restaure par un mauvais chemin** laisse le code
   de production muté. Vérifiez `git status` avant de conclure.

**Et une règle née d'une trouvaille** : vérifiez qu'un correctif n'affaiblit pas
une garde qui mordait avant. En couvrant un chemin de fermeture par un
nettoyage, une passe a rendu stérile une mutation qui mordait la veille.

**Les décisions prises en cours de route sont écrites**, chacune avec ce qu'elle
coûte si elle est fausse, dans les fichiers `arbitrages.md` de
`.superpowers/sdd/`. Trente-trois pour le seul chantier du parchemin, et la
revue de branche en a jugé cinq fausses ou périmées. Un journal d'arbitrages qui
ne marque pas ses propres renversements fait autorité pour une règle morte.

---

## 8. Les règles de sécurité, qui ne se négocient pas

- La base `portfolio_db` contient les **données réelles** du propriétaire.
  Jamais de `prisma migrate reset`, jamais de `db push --force-reset`. Une
  migration additive se fait en trois temps : `migrate status` d'abord pour
  vérifier l'absence de dérive, relevé des lignes, puis
  `migrate dev --create-only` pour lire le SQL avant de l'appliquer par
  `migrate deploy`.
- **Aucun identifiant en clair dans un fichier suivi**, commentaires et
  commandes de vérification compris. `secrets.env` existe pour cela, en droits
  `600` et exclu du suivi : `set -a; . ./secrets.env; set +a` donne à `psql` et
  à Prisma ce qu'il leur faut sans qu'un secret passe en ligne de commande.
- Ne jamais arrêter les serveurs de développement du propriétaire, ne jamais
  faire de `git stash`, ne jamais committer sur `main`.
- **Pousser et fusionner demandent son accord explicite**, à chaque fois : une
  autorisation donnée pour un état ne vaut pas pour le suivant.
