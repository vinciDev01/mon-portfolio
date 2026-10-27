# La section Cours (étagère de livres) : plan de construction

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** une section « Cours » sur le portfolio, en étagère de bois : une planche par famille, un livre par cours PDF, qu'on ouvre puis télécharge ; gérée depuis le backoffice.

**Architecture:** un module NestJS `cours` (CRUD protégé, téléversement des PDF hors de `/uploads`, route publique de téléchargement qui vérifie la visibilité et compte). L'agrégat `/api/portfolio` livre les cours publics. Côté site, deux fonctions pures rangent les cours en planches et donnent la couleur de cuir. Deux composants dessinent l'étagère et le livre ouvert, ce dernier sur le modèle de `visionneuse-image.tsx`. Le backoffice reçoit la liste, avec le compteur, et le formulaire.

**Tech Stack:** NestJS 11, Prisma 6 / PostgreSQL, `pdf-lib` (nouvelle dépendance du backend, pour compter les pages), Next.js 16 (site et backoffice), Vitest (site), Jest (backend).

**Spec:** `docs/superpowers/specs/2026-10-27-cours-etagere-design.md`

## Global Constraints

- PDF uniquement, 50 Mo au plus par fichier de cours.
- Les PDF de cours sont rangés dans `<racine du dépôt>/cours/`, **jamais** dans `uploads/` (servi en statique).
- Un cours neuf vaut `publique = false`. Un cours masqué n'apparaît pas et son téléchargement répond 404.
- Supprimer une technologie qui a des cours : refusé (`onDelete: Restrict`), 409 avec un message lisible.
- Le compteur n'apparaît que dans le backoffice, jamais dans l'agrégat public.
- Aucun dégradé, aucun nouveau mouvement (l'animation `data-decouverte` existe déjà). Contraste 4,5:1 pour le texte des tranches sur chaque cuir, 3:1 pour les bordures signifiantes, thèmes clair et sombre. Cibles d'au moins 24 × 24 px.
- Textes de l'interface en fr, en et de. Titre et description des cours en une seule langue.
- Colonnes en snake_case (`@map`), un `sortOrder` par cours.
- La section se place **après Certifications** dans `SECTIONS`.
- Écrire `frontend/app/globals.css` en deux temps (ajout d'un commentaire puis retrait deux secondes après) : sinon le serveur de développement compile la version précédente.

## Review Focus

1. **Le titre d'un cours très long sur une tranche étroite :** la tranche reste lisible, avec un titre court ou une coupure propre, et le nom accessible garde le titre complet. Test à la tâche 5.
2. **Une adresse de téléchargement devinée** (`/api/cours/<id>/telecharger`) **pour un cours masqué, ou un id inexistant :** 404, et le compteur ne bouge pas. Test à la tâche 2.
3. **Un fichier `.pdf` qui n'en est pas un, ou un PDF illisible :** refusé à l'envoi pour le premier. Pour le second, pages à `null` et saisie manuelle possible. Tests à la tâche 2.
4. **Une famille sans aucun cours public :** aucune planche vide. **Une technologie sans famille :** planche « Autres » en dernier. Test à la tâche 4.
5. **Remplacer le PDF d'un cours :** l'ancien fichier est supprimé du disque, la taille et les pages sont mises à jour. Test à la tâche 3.

---

### Task 1: Le modèle Cours, les types partagés et le réglage d'affichage

**Files:**
- Modify: `backend/prisma/schema.prisma` (modèle `Cours`, relation `Technology.cours`, `SiteSettings.showCours`)
- Create: `backend/prisma/migrations/<horodatage>_cours/migration.sql` (via `npx prisma migrate dev --name cours`)
- Modify: `backend/src/site-settings/dto/update-site-settings.dto.ts` (+ spec)
- Create: `packages/shared-types/src/cours.ts` ; Modify: `packages/shared-types/src/index.ts`, `site-settings.ts`, `portfolio.ts`

**Interfaces:**
- Produces (Prisma) : `model Cours { id String @id @default(uuid()); titre String; titreCourt String? @map("titre_court"); description String? @db.Text; niveau String @default("debutant"); pages Int?; fichier String; taille Int; technologyId String @map("technology_id"); technology Technology @relation(fields:[technologyId], references:[id], onDelete: Restrict); publique Boolean @default(false); telechargements Int @default(0); sortOrder Int @default(0) @map("sort_order"); createdAt; updatedAt; @@map("cours") }`, avec `SiteSettings.showCours Boolean @default(false) @map("show_cours")`.
- Produces (types) : `type NiveauCours = "debutant" | "intermediaire" | "avance"`. `CoursPublicDto { id; titre; titreCourt: string | null; description: string | null; niveau: NiveauCours; pages: number | null; taille: number; updatedAt: string; sortOrder: number; technology: TechnologyDto }` (la `technology` porte sa `family`). `CoursDto extends CoursPublicDto { publique: boolean; telechargements: number; fichier: string; technologyId: string }`. `PortfolioData.cours: CoursPublicDto[]`. `SiteSettingsDto.showCours: boolean`.

- [ ] **Step 1: Test du DTO des réglages** dans `update-site-settings.dto.spec.ts` : `erreursSur('showCours', true)` donne `[]` et `erreursSur('showCours', 'oui')` contient `'showCours'`.
- [ ] **Step 2:** `npx jest src/site-settings` : ÉCHEC.
- [ ] **Step 3:** schéma et migration, puis `showCours?: boolean` (`@IsOptional() @IsBoolean()`) dans le DTO. Ajouter les types partagés et les exporter.
- [ ] **Step 4:** `npx jest` (backend) passe, `npx tsc --noEmit` passe dans `backend`, `frontend` et `backoffice`. Si un test du site fabrique un `PortfolioData` ou un `SiteSettingsDto` incomplet, le compléter.
- [ ] **Step 5:** commit `feat(cours): le modele Cours, ses types et le reglage d affichage`.

### Task 2: Les fichiers de cours : téléversement, rangement privé, téléchargement compté

**Files:**
- Create: `backend/src/cours/fichiers-cours.ts` (fonctions pures et disque) et `backend/src/cours/fichiers-cours.spec.ts`
- Create: `backend/src/cours/cours.controller.ts`, `cours.service.ts`, `cours.module.ts` (enregistré dans `app.module.ts`)
- Create: `backend/src/cours/cours-telechargement.spec.ts`
- Run: `npm i pdf-lib -w backend`

**Interfaces:**
- Consumes : le modèle `Cours` (tâche 1).
- Produces :
  - `RACINE_COURS = path.resolve(process.cwd(), '..', 'cours')` ;
  - `estUnPdf(buffer: Buffer): boolean`, qui vérifie la signature `%PDF-` des 5 premiers octets ;
  - `async compterPages(buffer: Buffer): Promise<number | null>`, via `PDFDocument.load(buffer, { ignoreEncryption: true })`, ou `null` en cas d'échec ;
  - `nomDeTelechargement(titre: string): string`, en ASCII et sans accents : `Java, des bases aux objets` donne `Java_des_bases_aux_objets.pdf` ;
  - route `POST /api/cours/fichier` (protégée, multer en mémoire, `limits.fileSize = 50 * 1024 * 1024`), qui renvoie `{ fichier: string; taille: number; pages: number | null }`, où `fichier` vaut `<uuid>.pdf` ;
  - route `GET /api/cours/:id/telecharger` (`@Public()`) ;
  - `CoursService.supprimerFichier(fichier: string): void`.

- [ ] **Step 1: Tests purs** (`fichiers-cours.spec.ts`) :
  - `estUnPdf(Buffer.from('%PDF-1.7...'))` donne `true`, et `estUnPdf(Buffer.from('<html>'))` donne `false` ;
  - `compterPages` sur un PDF de 3 pages, créé avec `PDFDocument.create()` puis 3 `addPage()`, donne `3`, et sur `Buffer.from('%PDF-cassé')` donne `null` ;
  - `nomDeTelechargement('Java, des bases aux objets')` donne `'Java_des_bases_aux_objets.pdf'`, et `nomDeTelechargement('  ')` donne `'cours.pdf'`.
- [ ] **Step 2: Tests du téléchargement** (`cours-telechargement.spec.ts`, Prisma et `res` simulés, comme `technologies-cv.spec.ts`) :
  - un cours `publique: false` lève `NotFoundException` et `update` n'est pas appelé ;
  - un id inconnu lève `NotFoundException` ;
  - un cours public appelle `prisma.cours.update({ where: { id }, data: { telechargements: { increment: 1 } } })`, puis envoie le fichier avec `Content-Type: application/pdf` et `Content-Disposition: attachment; filename="Java_des_bases_aux_objets.pdf"` ;
  - le chemin lu commence par `RACINE_COURS` et ne contient pas `uploads`.
- [ ] **Step 3:** `npx jest src/cours` : ÉCHEC.
- [ ] **Step 4: Implémenter.**
  - **Téléversement :** refuser `400 « Seuls les PDF sont acceptes »` si `!estUnPdf`, puis écrire dans `RACINE_COURS/<uuid>.pdf`.
  - **Téléchargement :** utiliser `res.sendFile` ou un flux, et ne lever 404 qu'après la vérification de visibilité.
  - **Dossier :** ajouter `cours/` à `.gitignore`, avec `.superpowers/`.
- [ ] **Step 5:** `npx jest` passe.
- [ ] **Step 6: Vérifier sur une API de test** (port 4100, arrêtée par son PID ensuite) :
  - un PDF réel s'envoie ;
  - un PNG renommé en `.pdf` reçoit 400 ;
  - `curl -I` sur `/uploads/cours/...` répond 404 ;
  - le téléchargement d'un cours public répond 200 et incrémente le compteur ;
  - celui d'un cours masqué répond 404.
- [ ] **Step 7:** commit `feat(cours): PDF ranges hors d uploads, telechargement verifie et compte`.

### Task 3: Le CRUD des cours, la garde sur les technologies, l'agrégat public

**Files:**
- Create: `backend/src/cours/dto/create-cours.dto.ts`, `update-cours.dto.ts` ; Modify: `cours.controller.ts`, `cours.service.ts`
- Modify: `backend/src/technologies/technologies.service.ts` (garde de suppression)
- Modify: `backend/src/portfolio/portfolio.service.ts`
- Test: `backend/src/cours/cours.service.spec.ts`, `backend/src/technologies/technologies-suppression.spec.ts`

**Interfaces:**
- Consumes : `RACINE_COURS` et `supprimerFichier` (tâche 2).
- Produces :
  - `CreateCoursDto { titre (IsNotEmpty, MaxLength 160); titreCourt? (MaxLength 40); description?; niveau (IsIn debutant | intermediaire | avance); pages? (Int, Min 1); fichier (Matches /^[0-9a-f-]{36}\.pdf$/); taille (Int, Min 1); technologyId; publique?; sortOrder? }` ;
  - les routes protégées `GET /api/cours` (inclut `technology: { include: { family: true } }`, tri `sortOrder` puis `titre`), `GET/PATCH/DELETE /api/cours/:id` et `POST /api/cours` ;
  - l'agrégat : `PortfolioData.cours`, avec les seuls cours `publique: true`, sans `fichier`, `publique` ni `telechargements`.

- [ ] **Step 1: Tests du service des cours** :
  - un PATCH avec un `fichier` différent supprime l'ancien fichier (`supprimerFichier` appelé avec l'ancien nom) ;
  - un PATCH sans `fichier` n'appelle pas `supprimerFichier` ;
  - `remove` supprime l'enregistrement puis le fichier ;
  - le DTO refuse `fichier: '../x.pdf'` et `niveau: 'expert'`.
- [ ] **Step 2: Test de la garde.** Si `prisma.technology.delete` lève `PrismaClientKnownRequestError` avec le code `P2003`, `remove` lève `ConflictException('Des cours utilisent cette technologie : deplacez-les ou supprimez-les d abord')`.
- [ ] **Step 3: Test de l'agrégat.** `getPortfolio` demande `cours.findMany` avec `where: { publique: true }`, et le résultat n'a aucune clé `telechargements`, `fichier` ni `publique`.
- [ ] **Step 4:** `npx jest` : ÉCHEC.
- [ ] **Step 5:** implémenter.
- [ ] **Step 6:** `npx jest` passe et `npx tsc --noEmit` passe.
- [ ] **Step 7:** commit `feat(cours): gestion des cours, technologie protegee, cours publics dans le portfolio`.

### Task 4: Les règles pures de l'étagère

**Files:**
- Create: `frontend/lib/cours/etagere.ts`, `frontend/lib/cours/etagere.test.ts`

**Interfaces:**
- Consumes : `CoursPublicDto` (tâche 1).
- Produces :
  - `type Planche = { famille: TechnologyFamilyDto | null; cours: CoursPublicDto[] }` ;
  - `rangerEnPlanches(cours: CoursPublicDto[]): Planche[]` : les familles dans l'ordre `sortOrder` puis le nom, « Autres » (`famille: null`) en dernier, aucune planche vide. Dans une planche, les cours sont triés par `sortOrder`, puis le `sortOrder` de la technologie, puis le titre ;
  - `CUIRS: readonly { fond: string; texte: string }[]` : au moins 6 cuirs sourds, chacun avec son texte de tranche ;
  - `cuirDe(technologyId: string): { fond: string; texte: string }` : déterministe, par un hachage de l'id modulo `CUIRS.length` ;
  - `tailleLisible(octets: number, locale: string): string` : `2_516_582` donne `"2,4 Mo"` en `fr`.

- [ ] **Step 1: Tests.**
  - **L'ordre des planches :** trois cours, deux familles d'ordres 1 et 0 et un cours sans famille, donnent les planches `[famille 0, famille 1, Autres]`.
  - **Pas de planche vide :** une famille sans cours n'apparaît pas.
  - **La couleur :** `cuirDe('x') === cuirDe('x')`, et sur 20 ids, au moins 4 cuirs différents sont employés.
  - **Le contraste :** pour chaque cuir de `CUIRS`, `ratioContraste(fond, texte) >= 4.5`, avec `@/lib/color/contrast`.
  - **La taille :** `tailleLisible(2516582, "fr")` donne `"2,4 Mo"`.
- [ ] **Step 2:** `npx vitest run lib/cours` : ÉCHEC.
- [ ] **Step 3:** implémenter.
- [ ] **Step 4:** les tests passent.
- [ ] **Step 5:** commit `feat(cours): ranger les cours en planches et donner son cuir a chaque livre`.

### Task 5: L'étagère et le livre ouvert sur le site

**Files:**
- Create: `frontend/components/portfolio/cours-section.tsx` (l'étagère), `frontend/components/portfolio/livre-ouvert.tsx` (la fenêtre)
- Modify: `frontend/lib/parcours/sections.ts` (`SECTIONS` : `{ id: "cours", cleTitre: "nav.cours", reglage: "showCours" }` après `certifications`, et `PICTOS.cours`, un livre ouvert en traits), `frontend/app/page.tsx` (entrée `cours` dans la table des contenus, `largeur="large"`), `frontend/lib/i18n/{fr,en,de}.json`, `frontend/app/globals.css`
- Test: `frontend/lib/cours/etagere-dom.test.ts` (jsdom) ; mettre à jour `sections.test.ts`, `colonne.test.ts` et le compte de clés de `journal.test.ts`

**Interfaces:**
- Consumes : `rangerEnPlanches`, `cuirDe` et `tailleLisible` (tâche 4), `PortfolioData.cours` (tâche 1), `useChangerSurcouche` (parcours-pagine).
- Produces :
  - `CoursSection({ cours }: { cours: CoursPublicDto[] })` ;
  - `LivreOuvert({ cours, surFermeture })`.

**Les clés de traduction** (fr, à adapter en en et de) :

| Clé | Texte (fr) |
|---|---|
| `nav.cours` | Cours |
| `cours.telecharger` | Télécharger le cours (PDF) |
| `cours.niveau` | Niveau |
| `cours.pages` | Pages |
| `cours.fichier` | Fichier |
| `cours.majLe` | Mis à jour |
| `cours.autres` | Autres |
| `cours.fermer` | Fermer le livre |
| `cours.niveau.debutant` | Débutant |
| `cours.niveau.intermediaire` | Intermédiaire |
| `cours.niveau.avance` | Avancé |
| `cours.livre` | {titre}, cours de {techno} |

- [ ] **Step 1: Tests DOM.**
  - **L'étagère :** une planche par famille, chaque planche avec un titre `h3` au nom de la famille. Chaque livre est un `button` dont `aria-label` vaut `t("cours.livre")` avec le titre complet. Sa tranche affiche `titreCourt ?? titre`, et sa couleur de fond vient de `cuirDe`.
  - **L'ouverture :** le clic sur un livre ouvre `dialog.livre-ouvert`, avec la famille, le titre, la technologie, la description, le niveau traduit, les pages, `tailleLisible`, la date et le lien `a[href$="/api/cours/<id>/telecharger"]` (attribut `download`). Le drapeau de surcouche vaut `true`.
  - **La fermeture :** la croix, Échap (`cancel`) et un clic sur le dialogue lui-même ferment le livre, et le drapeau repasse à `false`.
  - **Sans cours :** la section ne rend rien.
- [ ] **Step 2: Tests de feuille** (`bloc`, `valeur`, `cssNu` de `feuille-test.ts`) :
  - `.livre-ouvert` a `margin: auto`, à cause du preflight ;
  - aucune règle des cours ne contient `gradient` ;
  - la cible `.livre-cours` fait au moins 24 px de large ;
  - la rangée des livres est en `flex-wrap: wrap`, et chaque livre porte son segment de planche (`::after`), de sorte qu'une rangée repliée repose aussi sur une planche ;
  - un titre de tranche trop long est coupé (`text-overflow: ellipsis` ou `-webkit-line-clamp`), et son `button` garde le titre complet en `aria-label`.
- [ ] **Step 3:** `npx vitest run` : ÉCHEC.
- [ ] **Step 4: Implémenter** d'après les maquettes validées (`.superpowers/brainstorm/2316457-1793111752/content/etagere-styles.html`, direction A, et `livre-ouvert.html`). Prévoir un `.livre-ouvert` avec `margin: auto`, et écrire `globals.css` en deux temps, comme le veulent les Global Constraints.
- [ ] **Step 5:** `npx vitest run`, `npx tsc --noEmit` et `npx eslint` passent.
- [ ] **Step 6: Vérifier dans le navigateur** (Chromium sans interface de `~/.cache/ms-playwright`), sur la page servie et avec deux cours publics de test, à 1440 × 900, 1280 × 800 et 390 × 844 :
  - l'étagère, ouvrir un livre, télécharger ;
  - mesurer `scrollHeight` de `#cours`, qui doit tenir dans l'écran avec deux planches ;
  - aucune erreur en console ;
  - capture d'écran relue.
- [ ] **Step 7:** commit `feat(cours): l etagere de bois et le livre ouvert`.

### Task 6: Les cours dans le backoffice

**Files:**
- Create: `backoffice/app/cours/page.tsx`, `backoffice/app/cours/new/page.tsx`, `backoffice/app/cours/[id]/edit/page.tsx`, `backoffice/components/cours-form.tsx`
- Modify: `backoffice/components/sidebar-nav.tsx` (« Cours » dans le groupe Sections), `backoffice/app/site-settings/page.tsx` (`{ key: "showCours", label: "Cours" }` près de `showCertifications`), `backoffice/lib/api.ts` (`uploadCoursPdf(file: File): Promise<{ fichier: string; taille: number; pages: number | null }>`, via `appelerApi("/api/cours/fichier", …)`)

**Interfaces:**
- Consumes : les routes des tâches 2 et 3, `CoursDto`, `TechnologyDto`.
- Produces : les écrans. Aucune autre tâche n'en dépend.

- [ ] **Step 1: La liste.** Colonnes titre, technologie, famille, niveau, « Public » (Oui ou Non), « Téléchargements » (le compteur), puis actions. La suppression demande confirmation.
- [ ] **Step 2: Le formulaire.**
  - **Le PDF :** un champ fichier (`accept="application/pdf"`), téléversé dès sa sélection. Il affiche la taille et les pages lues, et le champ « Pages » est prérempli et modifiable.
  - **Les autres champs :** titre, titre court (aide « affiché sur la tranche s'il est trop long »), description, technologie (liste des technologies avec leur famille entre parenthèses), niveau, case « Public » (décochée par défaut) et ordre.
  - **À l'enregistrement :** une erreur de l'API s'affiche telle quelle.
- [ ] **Step 3:** `npx tsc --noEmit` et `npx eslint app/cours components/cours-form.tsx` passent.
- [ ] **Step 4: Vérifier dans le navigateur**, connecté avec un jeton :
  - créer un cours avec un vrai PDF, le rendre public, et le voir sur le site ;
  - un téléchargement incrémente le compteur dans la liste ;
  - supprimer la technologie de ce cours affiche le message 409 ;
  - supprimer ensuite le cours de test et son fichier.
- [ ] **Step 5:** commit `feat(cours): gestion des cours dans le backoffice, avec le compteur`.
