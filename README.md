# Portfolio

Site portfolio dont **tout le contenu se pilote depuis un backoffice** : textes,
projets, expériences, certifications, réglages visuels, et le CV téléchargeable.

Monorepo de trois applications et d'un paquet de types partagés.

| Application | Rôle | Port |
|---|---|---|
| `backend/` | API REST NestJS + Prisma + PostgreSQL | 4000 |
| `frontend/` | Le site public, Next.js | 3000 |
| `backoffice/` | L'administration, Next.js | 3001 |
| `packages/shared-types/` | Types TypeScript partagés, sans étape de build | — |

---

## 1. Prérequis

- **Node.js 20** ou supérieur
- **PostgreSQL 14** ou supérieur, avec une base `portfolio_db`
- **openssl**, pour générer les secrets

---

## 2. Installation

```bash
git clone <votre-depot> && cd my-portfolio
npm install                    # installe les quatre workspaces d'un coup
```

Copiez ensuite les gabarits d'environnement et remplissez-les :

```bash
cp backend/.env.example    backend/.env
cp frontend/.env.example   frontend/.env.local
cp backoffice/.env.example backoffice/.env.local
```

Générez les deux secrets du backend :

```bash
openssl rand -base64 48   # → JWT_SECRET
openssl rand -base64 24   # → ADMIN_PASSWORD
```

Puis préparez la base :

```bash
cd backend
npx prisma migrate deploy   # applique les migrations existantes
npx prisma db seed          # crée les données initiales et l'administrateur
```

---

## 3. Variables d'environnement

### `backend/.env`

| Variable | Rôle | Si elle manque |
|---|---|---|
| `DATABASE_URL` | Connexion PostgreSQL | Prisma échoue |
| `PORT` | Port d'écoute de l'API | 4000 par défaut |
| `UPLOAD_DIR` | Où sont écrits les fichiers téléversés | `../uploads` |
| `JWT_SECRET` | Signature des jetons d'authentification | **Le serveur refuse de démarrer** |
| `ADMIN_EMAIL` | Identifiant de l'administrateur | **Le seed échoue** |
| `ADMIN_PASSWORD` | Mot de passe de l'administrateur | **Le seed échoue** |

`JWT_SECRET` est validé au démarrage : il est refusé s'il fait moins de
32 caractères, s'il est composé de trop peu de caractères distincts, ou s'il
correspond à une valeur de gabarit connue.

Ce refus est délibéré. Un repli silencieux signifierait qu'un déploiement ayant
oublié la variable tourne avec un secret que n'importe quel lecteur du dépôt
peut retrouver — et fabriquer un jeton administrateur devient alors trivial. Un
serveur qui ne démarre pas se remarque en quelques secondes ; un serveur ouvert
ne se remarque jamais.

Le mot de passe de `DATABASE_URL` doit être encodé en pourcentage : `@` s'écrit
`%40`, `:` s'écrit `%3A`.

### `frontend/.env.local` et `backoffice/.env.local`

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_API_URL` | Adresse du backend, **telle que le navigateur doit la joindre** |

Le préfixe `NEXT_PUBLIC_` place la valeur dans le bundle envoyé au navigateur.
N'y mettez jamais de secret.

---

## 4. Lancer en développement

Trois terminaux, depuis la racine :

```bash
npm run dev:backend      # http://localhost:4000  — Swagger sur /api/docs
npm run dev:frontend     # http://localhost:3000
npm run dev:backoffice   # http://localhost:3001
```

Démarrez le backend en premier : le site rend ses pages côté serveur en
interrogeant l'API.

Connectez-vous au backoffice sur `http://localhost:3001/login` avec les
identifiants d'`ADMIN_EMAIL` et `ADMIN_PASSWORD`.

---

## 5. Base de données

```bash
cd backend
npx prisma migrate dev --name ma_migration   # créer et appliquer
npx prisma migrate dev --create-only         # créer sans appliquer, pour l'éditer
npx prisma migrate deploy                    # appliquer en production
npx prisma studio                            # explorer les données
```

**N'utilisez jamais `prisma migrate reset` sur une base contenant des données
réelles** : la commande la vide et rejoue le seed.

Une valeur `@default` d'un champ Prisma ne s'applique qu'aux **insertions
futures**. Pour modifier aussi les lignes existantes, complétez le fichier de
migration à la main :

```sql
UPDATE "site_settings" SET "show_stats" = true;
```

---

## 6. Tests

```bash
npm run test                # les deux suites : backend (Jest) et frontend (Vitest)
npm run test -w backend
npm run test -w frontend
npm run typecheck -w frontend
```

Les tests couvrent ce qui se vérifie mécaniquement plutôt que l'apparence :
géométrie du faisceau de la lampe, intégration de son ressort, ratios de
contraste de la palette, bornes de validation de l'API, ordre des sections du
CV, et la règle de confidentialité de l'adresse postale.

---

## 7. Mise en production

```bash
npm run build              # construit les trois applications
cd backend && npx prisma migrate deploy
```

Avant tout déploiement :

- définissez `JWT_SECRET` avec une valeur **propre à cet environnement** ;
- définissez `ADMIN_EMAIL` et `ADMIN_PASSWORD` ;
- pointez `NEXT_PUBLIC_API_URL` vers l'API publique, pas vers `localhost` ;
- vérifiez la liste des origines autorisées dans `backend/src/main.ts`, qui
  n'accepte aujourd'hui que `localhost:3000` et `localhost:3001`.

---

## 8. Sécurité : ce qui ne doit jamais être commité

Les fichiers `.env` sont ignorés par git, et doivent le rester. Ne les
remplacez pas par des valeurs en dur dans le code « le temps d'un test ».

Ne mettez jamais dans un fichier suivi par git :

- un mot de passe, y compris celui d'une base locale ;
- un secret de signature, y compris à titre d'exemple ;
- une commande de vérification contenant un identifiant en clair.

Un secret commité reste dans l'historique même après correction : un commit
ultérieur n'efface pas les précédents. Si cela arrive, il faut réécrire
l'historique **avant** de pousser — et, une fois poussé, considérer le secret
comme compromis et le remplacer.

---

## 9. Points d'attention connus

- **Les couches de cascade CSS.** `frontend/app/globals.css` place les sélecteurs
  de balises dans `@layer base` et les classes du projet dans `@layer components`.
  Une règle écrite hors couche l'emporterait sur tous les utilitaires Tailwind.
- **Les variables de réglage se posent sur `<html>`**, pas sur `<body>` : les
  règles qui les consomment vivent dans un bloc `:root`, et un `var()` se résout
  sur l'élément où la règle s'applique.
- **Le site rend ses pages avec une revalidation de 60 secondes.** Un réglage
  modifié dans le backoffice n'apparaît pas immédiatement.
