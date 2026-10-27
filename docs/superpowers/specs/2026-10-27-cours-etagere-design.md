# La section Cours : une étagère de livres téléchargeables

Date : 27 octobre 2026. Statut : décrite, à planifier.

## Intention

Le propriétaire du portfolio veut partager ses cours. Ce sont des supports en
PDF, organisés par famille de technologies, que le visiteur peut télécharger.
La section doit garder l'ambiance du site, chaleureuse et un peu médiévale :
une **étagère de bibliothèque en bois**, avec des livres reliés rangés sur des
planches.

Le geste visé : le visiteur parcourt l'étagère des yeux, repère un livre à sa
tranche, l'ouvre, lit de quoi il parle, et le télécharge.

## Ce qui a été décidé avec le propriétaire

### L'étagère (direction « A, la bibliothèque de bois »)

- Une section **« Cours »**, avec son entrée dans la colonne de navigation,
  placée **après Certifications** (et donc avant Projets).
- **Une planche par famille de technologies.** Ce sont les familles déjà
  gérées dans le backoffice (« Familles de technologies », modèle
  `TechnologyFamily`), dans leur ordre `sortOrder`. Une plaquette gravée au
  nom de la famille surmonte sa planche.
- **Chaque livre est un cours**, rattaché à **une technologie**. Le nom de la
  technologie, ou le titre court du cours (voir « Laissé au constructeur »),
  figure sur la tranche, écrit verticalement.
- Les livres sont **debout**, de hauteurs et d'épaisseurs légèrement
  variées, reliés de cuir aux couleurs sourdes.
- **Couleur du cuir : automatique**, une couleur par technologie, toujours la
  même : tous les livres Java ont la même reliure. Rien à saisir.
- **Planche pleine : une rangée de plus.** Quand les livres d'une famille
  dépassent la largeur, ils passent sur une deuxième planche de la même
  famille, comme dans une vraie bibliothèque.
- Planches en bois **en aplats**, comme sur la maquette validée : pas de
  dégradé, selon la règle du site.

### Le livre ouvert, au clic

Validé sur maquette. Un clic sur un livre ouvre une fenêtre qui montre le
livre ouvert, sur deux pages couleur parchemin séparées par une reliure :

- **page de gauche** : la famille (petites capitales), le titre, la
  technologie (étiquette), la description, ouverte par une lettrine ;
- **page de droite** : niveau, nombre de pages, format et taille du fichier,
  date de mise à jour, puis le bouton **« Télécharger le cours (PDF) »**.

### Les cours

- **Format : PDF uniquement.**
- **Visibilité au cas par cas** : chaque cours est public ou masqué depuis le
  backoffice. Un cours masqué n'apparaît pas sur l'étagère et ne se
  télécharge pas.
- **Compteur de téléchargements**, affiché **dans la liste des cours du
  backoffice seulement**, jamais sur le site.

## Objectifs

1. Le propriétaire charge un PDF, le rattache à une technologie, lui donne un
   titre et une description, et le cours apparaît sur la bonne planche.
2. Le visiteur trouve un cours, l'ouvre et le télécharge en deux clics.
3. La section ressemble à une étagère, pas à une liste de fichiers.

## Non-objectifs

- Pas de lecture du PDF dans la page : on télécharge.
- Pas de compte visiteur, pas de paiement, pas de progression de lecture.
- Pas d'autres formats que le PDF.
- Pas de compteur visible du public.

## Anti-objectifs (échec même si « ça marche »)

- Une grille de cartes ou un tableau de fichiers avec une icône PDF : ce
  serait une liste de téléchargements, pas une étagère.
- Un cours masqué qu'on peut quand même télécharger en devinant son adresse.
- Des titres illisibles sur les tranches : la tranche doit se lire.
- Une étagère qui casse les règles du site : dégradé, couleur d'alerte,
  mouvement gratuit.

## Contraintes du site à respecter

Elles sont tirées de `docs/feuille-de-route.md` et du code existant.

- **Aucun dégradé.** Le relief se fait par aplats, comme le bois de la
  maquette.
- **Pas de nouveau mouvement gratuit.** L'apparition à la première arrivée
  existe déjà (`data-decouverte`) et s'applique d'elle-même. L'ouverture du
  livre est une fenêtre, comme la visionneuse des certifications.
- **Contraste chiffré** : 4,5:1 pour le texte (titres des tranches compris,
  sur chaque couleur de cuir), 3:1 pour les bordures signifiantes, dans les
  deux thèmes, clair et sombre.
- **Cibles d'au moins 24 × 24 px.** Un livre est une cible ; un livre fin
  reste cliquable.
- **Accessibilité** : chaque livre est un bouton dont le nom accessible dit
  le titre et la technologie. La fenêtre suit le modèle de la visionneuse
  des certifications et du parchemin des projets (`showModal`, fermeture par
  Échap, par la croix et par un clic hors du livre, focus rendu au livre,
  pagination suspendue).
- **Mouvement réduit** respecté.
- **Trilingue** (fr, en, de) pour tous les textes de l'interface.
- **Sécurité des fichiers** : seuls les PDF sont acceptés au téléversement.
  Le téléchargement d'un cours masqué est refusé côté serveur.
- **Tenir sur un écran** quand c'est possible, comme les autres sections ;
  sinon la section défile de l'intérieur.
- La section se montre ou se masque depuis les réglages du site, comme les
  autres (`showCours`, ou nom équivalent).
- Monorepo : backend NestJS + Prisma, types dans `packages/shared-types`,
  backoffice Next.js, site Next.js. Les noms de colonnes en snake_case, un
  champ `sortOrder` pour ordonner.

## Choix faits par l'assistant (à vérifier en lisant)

- **Le niveau** (Débutant, Intermédiaire, Avancé) et le **nombre de pages**
  sont des champs du cours. Le nombre de pages est lu dans le PDF au
  téléversement, avec une saisie possible si la lecture échoue.
- **La taille du fichier** est lue au téléversement, pas saisie.
- **La date de mise à jour** est celle de la dernière modification du cours
  ou de son fichier.
- **La limite de taille** des PDF de cours passe de 10 Mo, la limite actuelle
  de `/api/upload`, à **50 Mo**, pour la seule catégorie des cours.
- **Le fichier** se télécharge par une route dédiée qui vérifie que le cours
  est public, compte le téléchargement, puis envoie le PDF sous un nom lisible
  (titre du cours). Elle ne passe pas par l'adresse statique `/uploads/` :
  sinon, un cours masqué resterait accessible et le compteur ne verrait rien.
- **La palette des cuirs** est un petit jeu fixe de couleurs sourdes
  (bordeaux, vert forêt, bleu nuit, ocre, prune, brun…). Une technologie y
  reçoit toujours la même couleur, dérivée de son identifiant, et chaque cuir
  porte un texte de tranche qui tient 4,5:1.
- **Les PDF de cours sont rangés hors du dossier `/uploads`**, que le backend
  sert en statique (`backend/src/main.ts`). Rangés dedans, un cours masqué
  resterait téléchargeable par son adresse. Seule la route dédiée les lit, et
  c'est la seule route de cours marquée `@Public()`. Les autres restent
  derrière le garde JWT, comme le reste du backoffice.
- **Supprimer une technologie qui a des cours est refusé** (`onDelete:
  Restrict`). Le backoffice affiche un message clair qui invite à déplacer
  ou supprimer les cours d'abord. Une cascade effacerait des fichiers sans
  prévenir.
- **Un cours neuf est masqué par défaut**, comme un article de blog pas encore
  publié. Un PDF à moitié décrit n'apparaît pas sur le site dès
  l'enregistrement.
- **Titre et description en une seule langue**, comme les autres contenus
  saisis au backoffice. Seuls les textes de l'interface sont traduits.
- **Les familles sans cours** ne montrent pas de planche vide. Les cours
  dont la technologie n'a pas de famille vont sur une planche « Autres », en
  dernier, comme dans le CV.

## Laissé au constructeur

- Ce qu'affiche la tranche : le titre du cours, ou un titre court dédié s'il
  est trop long pour la hauteur du livre. Le nom accessible, lui, garde le
  titre complet.
- Les proportions exactes des livres (hauteurs, épaisseurs, variations), les
  dimensions des planches et de la plaquette.
- L'ordre des livres sur une planche : un `sortOrder` par cours, ou à défaut
  l'ordre des technologies puis le titre.
- La mise en page sur téléphone : planches plus étroites, et rangées
  supplémentaires selon la règle « une rangée de plus ».
- La forme exacte de l'écran du backoffice : liste avec le compteur,
  formulaire avec le téléversement du PDF, la technologie, le niveau, la
  visibilité et l'ordre.

## Maquettes de référence

Les maquettes validées sont dans
`.superpowers/brainstorm/2316457-1793111752/content/` :
`etagere-styles.html` (direction A retenue) et `livre-ouvert.html`.
