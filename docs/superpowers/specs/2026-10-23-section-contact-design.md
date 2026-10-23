# La section contact

## 0. Ce que le proprietaire a demande, et ce qui a ete decide

Sa demande, mot pour mot : « La section contact. Revoir l'affichage pour un
meilleur rendu que celui-ci. »

Aucun critere n'accompagnait la demande. Le diagnostic a donc ete fait et
mesure avant toute proposition, et il a montre que le defaut n'est pas
esthetique. Trois decisions ont ensuite ete prises par le proprietaire.

| Question | Decision |
|---|---|
| Que contient la section | Ses coordonnees ET le formulaire, en deux volets |
| Comment se disent le succes et l'erreur | Par la forme et le mot, sans couleur neuve |
| Le formulaire doit-il tenir dans l'ecran | Oui, quitte a resserrer |
| Son adresse est-elle cliquable | Oui, par un lien `mailto:` |

**Le diagnostic, mesure sur `frontend/components/portfolio/contact-section.tsx`
avant ce chantier.** Cinq defauts, dont aucun n'est une question de gout :

1. **La section n'est pas sur le systeme de couleurs du site.** Elle emploie
   `text-muted-foreground`, `border-border` et `bg-background`, qui sont les
   jetons de shadcn, quand le reste du site travaille avec `--texte`,
   `--surface`, `--fond` et `--bordure-signifiante`. Aucun des contrastes
   mesures ne la couvre.
2. **Elle importe du vert et du rouge de Tailwind** : `bg-green-100`,
   `dark:bg-green-900/30`, `text-green-600`, `dark:text-green-400`,
   `text-red-500`. La palette du site ne porte aucune couleur d'alerte.
3. **Elle ne montre aucune coordonnee.** La fiche personnelle porte `email`,
   `phone`, `githubUrl` et `linkedinUrl` ; la section n'offre qu'un formulaire.
   Un visiteur qui prefere ecrire depuis son propre logiciel de courrier n'a
   rien a cliquer.
4. **Rien n'est annonce aux lecteurs d'ecran, et le focus se perd.** L'etat
   passe de repos a envoi puis a succes ou erreur sans aucun `aria-live`, et le
   succes REMPLACE tout le formulaire : le focus se retrouve sur un bouton qui
   n'existe plus, donc la tabulation repart du haut de la page.
5. **Details d'usage** : aucun attribut d'auto-remplissage, donc pas de saisie
   automatique du nom ni du courriel ; rien n'indique quels champs sont
   obligatoires hors l'attribut HTML ; et la zone de message est figee a cinq
   lignes en `resize-none`.

## 1. Les couts assumes

**Le courriel du proprietaire est expose en clair, et c'est une exception
nommee.** La specification du parchemin interdit d'afficher les courriels des
collaborateurs, au motif qu'« exposer une adresse en clair invite les
moissonneurs ». Cette regle vise les adresses de TIERS, confiees au site sans
que leur proprietaire ait choisi de les publier. Celle du proprietaire est son
propre choix, et le but meme d'une section contact est qu'on le joigne. La
regle du parchemin n'est donc pas renversee, elle est bornee : elle protege les
adresses d'autrui, pas celle du maitre des lieux. Aucune obfuscation
(JavaScript, entites HTML, image) n'est tentee : elles genent les lecteurs
d'ecran plus qu'elles ne genent les moissonneurs.

**Le formulaire reste monte apres un envoi reussi.** L'ancien comportement le
remplacait, ce qui perdait le focus. Le garder coute un formulaire visible dont
le visiteur n'a plus besoin ; cela evite un saut de mise en page et une perte de
place au clavier, et rend inutile le bouton « envoyer un autre message », dont
la cle `contact.sendAnother` devient donc orpheline.

**Le backoffice n'a aucun harnais de test.** Rien dans ce chantier ne touche au
backoffice, mais le module backend `contact-messages` qui recoit le formulaire
n'est pas modifie non plus : ce chantier ne corrige pas la validation cote
serveur, dette inscrite a la feuille de route.

## 2. La decomposition

Le fichier actuel fait 98 lignes qui melangent les regles, l'etat et le rendu.
Il devient quatre unites, sur le modele qui a servi le parchemin : les regles
pures d'un cote, testables sans DOM, le rendu de l'autre.

| Fichier | Responsabilite | Nature |
|---|---|---|
| `frontend/lib/parcours/contact.ts` | quels canaux existent, comment chacun devient un `href` | pur, sans React |
| `frontend/components/portfolio/coordonnees.tsx` | le volet des canaux directs | rendu |
| `frontend/components/portfolio/formulaire-contact.tsx` | le formulaire, son etat, ses annonces | client |
| `frontend/components/portfolio/contact-section.tsx` | la coquille et les deux volets | rendu |

**Le module pur est le point d'appui.** `canaux(infos)` rend les canaux
presents dans l'ordre de lecture, chacun en `{ cle, libelle, valeur, href }`,
exactement la forme que `credits()` rend dans le parchemin. La question « quel
canal parait » cesse ainsi d'etre une suite de conditions dans le rendu et
devient une propriete constatable par un test categorique.

**`ContactSection` recoit desormais une prop.** Elle n'en prenait aucune ;
elle prend `personalInfo: PersonalInfoDto`. `app/page.tsx` est un composant
SERVEUR et lui passe donc une donnee, jamais une fonction. `SectionShell`
fournit deja le numero, le titre et le zigzag : la section ne rend que son
corps.

## 3. Les deux volets

Disposition : `grid-cols-1 md:grid-cols-2`, le motif deja employe par les
sections services, stats et competences. Sur telephone les volets s'empilent,
**les coordonnees en premier** : un visiteur presse doit trouver le canal
direct avant le formulaire.

### 3.1 Les canaux directs

Quatre canaux au plus, dans cet ordre de lecture :

| Canal | Champ | `href` | Regle |
|---|---|---|---|
| Courriel | `email` | `mailto:` | non nul au schema, mais **peut valoir la chaine vide** |
| Telephone | `phone` | `tel:` | blancs retires, absent si vide |
| LinkedIn | `linkedinUrl` | tel quel | **`https:` seul**, sinon absent |
| GitHub | `githubUrl` | tel quel | **`https:` seul**, sinon absent |

`email` est declare `string` et non `string | null` dans
`packages/shared-types/src/personal-info.ts`, ce qui le rend non nul SANS le
rendre non vide : le backoffice peut enregistrer une chaine vide. Il suit donc
la meme regle du blanc que les trois autres, et un courriel vide fait
disparaitre son canal comme n'importe quel autre.

**La regle `https:` est celle du parchemin, et c'est la meme fonction.** Un
canal dont l'adresse n'est pas exploitable NE PARAIT PAS : jamais de lien mort,
jamais de libelle sans lien dessous. Une chaine de blancs compte comme une
absence, le backoffice pouvant enregistrer un champ efface sans le mettre a nul.

Chaque canal montre son libelle ET sa valeur : « Courriel » puis l'adresse,
« Telephone » puis le numero. Pour LinkedIn et GitHub, la valeur affichee est le
nom du service et non l'URL entiere, qui n'apprend rien et casse la mise en page.

Le nom accessible de chaque lien contient son libelle et sa valeur, jamais
« Lien » seul repete : c'est la regle de WCAG 2.4.4 deja tenue par les credits
du parchemin.

### 3.2 Le formulaire

Cinq champs, inchanges dans leur nature, et le meme point d'envoi :
`POST {API}/api/contact-messages` avec `firstName`, `lastName`, `email`,
`subject`, `message`.

Ce qui change :

- **Prenom et nom sur une seule ligne**, pour tenir dans l'ecran.
- **La zone de message passe de cinq lignes a trois**, et grandit a la saisie
  plutot que d'etre figee en `resize-none`.
- **Les attributs d'auto-remplissage** : `given-name`, `family-name`, `email`.
  Leur absence empeche aujourd'hui toute saisie automatique.
- **Les champs obligatoires sont marques visiblement**, et pas seulement par
  l'attribut HTML : la contrainte ne doit pas se decouvrir a l'envoi.
- **Le titre est allege** : il partage desormais la place avec un second volet.

## 4. Le succes et l'erreur

**Aucune couleur neuve n'entre dans la palette.** Pas de vert, pas de rouge,
pas de jeton d'alerte. Un etat se dit par trois choses a la fois, et c'est la
regle qui a produit le drapeau de disponibilite et les bandes du parchemin : une
bordure `--bordure-signifiante`, un glyphe DESSINE en SVG, et un texte
explicite.

| Etat | Glyphe | Texte |
|---|---|---|
| Succes | une coche | `contact.success` et `contact.successDetail` |
| Erreur | un point d'exclamation | `contact.error`, puis `contact.errorFallback` |

Le glyphe est dessine, teinte par `currentColor`, et porte `aria-hidden="true"` :
le sens vit dans le texte, pas dans l'image. En couleurs forcees il suit l'encre
du navigateur, ce qui est le comportement voulu, donc aucun
`forced-color-adjust`.

**Le message parait AU-DESSUS du formulaire conserve**, dans une region
`aria-live="polite"`, et le focus se deplace sur lui. Cela corrige le defaut 4
du diagnostic : plus de formulaire qui disparait sous le focus, plus de
tabulation qui repart du haut.

**En cas d'erreur, le message renvoie vers le canal direct.** Un envoi qui
echoue laisse aujourd'hui le visiteur sans recours ; le volet des coordonnees
est a cote, autant le dire. Cela demande **une cle neuve**,
`contact.errorFallback`, a creer dans les trois dictionnaires en parite exacte :
les cles existantes ne portent que le message d'echec, sans le recours. C'est la
seule cle que ce chantier ajoute.

## 5. Accessibilite

Six exigences, aucune native ici : il n'y a pas de `<dialog>` dans cette
section, donc rien ne vient du navigateur.

- La region d'etat est `aria-live="polite"` et recoit le focus au changement.
- Le bouton d'envoi annonce son etat d'envoi en cours, et reste identifiable :
  il ne devient pas une roue muette.
- Chaque champ a un `<label>` lie par `htmlFor`, et les champs obligatoires sont
  signales autrement que par la couleur (critere 1.4.1).
- Le nom accessible de chaque lien de canal contient son texte visible
  (critere 2.5.3), et dit de quel canal il s'agit (critere 2.4.4).
- Les cibles font au moins 24 par 24 pixels (critere 2.5.8). Les liens en ligne
  dans un paragraphe en sont exemptes.
- 4,5:1 pour le texte et 3:1 pour les bordures signifiantes, **dans les deux
  palettes**, calcules depuis les jetons et jamais epingles.

**Mouvement reduit** : la section n'introduit aucun mouvement, donc rien a
prevoir. Le site n'autorise que l'incandescence de l'ampoule et la transition
entre sections, et ce chantier n'en consomme aucun.

## 6. Verification

Les tests constatent des proprietes, jamais des orthographes. Ils lisent une
valeur de propriete CSS par son nom, ou constatent un fait sur le DOM rendu ;
ils ne cherchent pas une chaine dans le source d'un fichier.

| Ce qui est verifie | Comment |
|---|---|
| Un canal sans valeur exploitable ne parait pas | sur la sortie de `canaux()`, et sur le DOM |
| Une valeur faite de blancs compte comme absente | sur `canaux()`, pour les quatre champs |
| Un LinkedIn ou GitHub non `https:` ne produit aucun lien | `javascript:`, `http:`, sans schema, `https:` nu |
| L'ordre de lecture des canaux | sur la sortie de `canaux()`, pas seulement leur presence |
| Le courriel produit un `mailto:`, le telephone un `tel:` | sur le DOM rendu |
| La region d'etat est `aria-live` et recoit le focus | sur le DOM, apres un envoi simule |
| Le formulaire SURVIT a un envoi reussi | sur le DOM : les champs sont toujours la |
| Les attributs d'auto-remplissage sont poses | sur le DOM, les trois |
| Aucune couleur hors palette | balayage du bloc : ni `green`, ni `red`, ni jeton shadcn |
| Aucun mouvement, aucun degrade | balayage des regles de la section |
| Les six contrastes, dans les deux palettes | calcules depuis les jetons |
| Les trois dictionnaires en parite exacte | comparaison des jeux de cles |

**Chaque garde est prouvee par mutation** : on introduit le defaut qu'elle doit
attraper, on constate qu'elle echoue EN NOMMANT la bonne chose, puis on retire
la mutation. Un test non prouve ne compte pas.

**Deux pieges a eviter, mesures sur les chantiers precedents.** Une fixture dont
les donnees ne declenchent jamais la branche testee rend la garde vide : la
fixture doit donc porter au moins un canal present ET un canal absent, sinon la
moitie des gardes ne verra jamais son cas. Et une assertion dont la chaine ne
figure nulle part est vide par construction : les libelles cherches doivent etre
lus dans le dictionnaire, accents compris, jamais recopies a la main.

## 7. Ce que ce chantier ne contient pas

- **La validation cote serveur.** Le module `contact-messages` du backend n'est
  pas touche. Son DTO reste ce qu'il est, et l'ecart entre ce qu'il accepte et
  ce que l'affichage filtre est inscrit a la feuille de route.
- **Le backoffice.** Les messages recus se consultent la ou ils se consultaient.
- **Une protection anti-robot.** Ni captcha, ni pot de miel, ni limitation de
  cadence : ce sont des sujets de serveur, et les ajouter au client seul
  donnerait une securite apparente.
- **La cle `contact.sendAnother`**, devenue orpheline, n'est pas supprimee des
  trois dictionnaires dans ce chantier : la retirer demande de verifier qu'aucun
  autre composant ne la lit, et la parite des trois fichiers est verrouillee par
  un test. Elle est signalee, pas traitee.
