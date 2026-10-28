# Déploiement sur un VPS avec Docker Compose

Toute la pile tourne sur un seul serveur :

```
Internet ──► Caddy (80/443, HTTPS automatique)
              ├── exemple.dev        ──► frontend   (Next.js, 3000)
              ├── api.exemple.dev    ──► backend    (NestJS, 4000) ──► postgres
              └── admin.exemple.dev  ──► backoffice (Next.js, 3001)
```

Les fichiers à connaître :

| Fichier | Rôle |
|---|---|
| `Dockerfile` | Une cible par application : `backend`, `frontend`, `backoffice` |
| `docker-compose.yml` | Les cinq services, les volumes de données |
| `deploiement/Caddyfile` | Les trois adresses publiques et leurs en-têtes |
| `.env.production.example` | Le modèle du `.env` du serveur |
| `deploiement/sauvegarder.sh` | La sauvegarde de la base et des fichiers |

Les données vivent dans des volumes Docker : `postgres` (la base), `uploads`
(images, CV), `cours` (PDF des cours), `caddy_data` (certificats). Reconstruire
ou recréer les conteneurs ne les touche pas.

---

## 1. Le serveur

- Debian 12 ou Ubuntu 24.04, **2 Go de RAM au minimum** : les builds Next.js
  en consomment beaucoup. Avec 1 Go, ajoutez 2 Go de swap.
- Docker Engine et le plugin Compose : <https://docs.docker.com/engine/install/>.
- Pare-feu : seuls les ports 22, 80 et 443 sont ouverts.

## 2. Le nom de domaine

Chez le registraire, trois enregistrements `A` (et `AAAA` si le serveur a une
IPv6) vers l'adresse du serveur :

```
exemple.dev        A   203.0.113.10
api.exemple.dev    A   203.0.113.10
admin.exemple.dev  A   203.0.113.10
```

Attendez qu'ils répondent (`dig +short api.exemple.dev`) **avant** le premier
démarrage : Caddy demande les certificats tout de suite, et Let's Encrypt
limite les échecs répétés.

## 3. Premier déploiement

```bash
git clone <depot> portfolio && cd portfolio
cp .env.production.example .env && chmod 600 .env
nano .env        # domaines et secrets ; chaque ligne dit comment la générer

docker compose up -d --build                       # 5 à 10 minutes la première fois
docker compose exec backend node dist/prisma/seed.js   # réglages par défaut + compte admin
```

Les migrations s'appliquent seules à chaque démarrage du backend.

Puis, dans le backoffice (`https://admin.exemple.dev`) :

1. Connectez-vous avec `ADMIN_EMAIL` et `ADMIN_PASSWORD`.
2. **Sections du CV → Adresse du portfolio** : saisissez `https://exemple.dev`.
   Le QR code du CV en a besoin. Le référencement s'en sert aussi, et
   retombe sinon sur `DOMAINE_SITE`.
3. Retirez `ADMIN_PASSWORD` du `.env` : il ne sert qu'au seed.

### Reprendre le contenu du poste local

Plutôt que de tout ressaisir, transférez la base et les fichiers locaux. Sur
le poste de développement, à la racine du dépôt :

```bash
set -a; . ./secrets.env; set +a
pg_dump -Fc > base.dump
tar -czf fichiers.tar.gz uploads cours
scp base.dump fichiers.tar.gz serveur:portfolio/
```

Sur le serveur, après `docker compose up -d`, **sans lancer le seed** :

```bash
docker compose exec -T postgres pg_restore -U portfolio -d portfolio_db --clean --if-exists --no-owner < base.dump
docker compose exec -T backend tar -C /app -xzf - < fichiers.tar.gz
docker compose restart backend
rm base.dump fichiers.tar.gz
```

Le compte admin est alors celui du poste local, avec son mot de passe.

## 4. Mettre à jour

```bash
git pull
docker compose up -d --build
```

Seules les images modifiées sont reconstruites. Une adresse changée dans
`.env` (`DOMAINE_*`, `SCHEMA`) demande ce même `--build` : l'adresse de l'API
est inscrite dans le code envoyé au navigateur au moment du build.

## 5. Sauvegardes

```bash
./deploiement/sauvegarder.sh
```

Cette commande écrit `sauvegardes/<date>/base.dump` et `fichiers.tar.gz`, et
garde les 14 dernières. Pour une sauvegarde quotidienne à 3 h (`crontab -e`) :

```
0 3 * * * cd /home/<utilisateur>/portfolio && ./deploiement/sauvegarder.sh >> sauvegardes/journal.log 2>&1
```

**Copiez régulièrement `sauvegardes/` hors du serveur** (rsync, rclone vers
un stockage distant) : une sauvegarde restée sur la machine disparaît avec
elle.

Pour restaurer, utilisez les deux commandes `pg_restore` et `tar` de la
section 3, avec les fichiers d'une sauvegarde.

## 6. Diagnostiquer

```bash
docker compose ps                      # état des services
docker compose logs -f backend         # journaux d'un service
docker compose exec postgres psql -U portfolio portfolio_db
```

- **Le backend redémarre en boucle** : lisez ses journaux. `JWT_SECRET` ou
  `CORS_ORIGINS` invalide arrêtent volontairement le démarrage, avec un
  message qui dit quoi corriger.
- **Pas de certificat** : vérifiez le DNS, puis `docker compose logs caddy`.
- **Swagger** est coupé en production. Pour l'ouvrir ponctuellement, ajoutez
  `SWAGGER: "true"` à l'environnement du backend.

## 7. Essai local de la pile de production

Tout se lance sur le poste, sans domaine ni certificat :

```bash
cp .env.production.example .env.essai
# Dans .env.essai : DOMAINE_SITE=site.localhost, DOMAINE_API=api.localhost,
# DOMAINE_ADMIN=admin.localhost, SCHEMA=http, et des secrets générés.
docker compose -p portfolio-essai --env-file .env.essai up -d --build
docker compose -p portfolio-essai --env-file .env.essai exec backend node dist/prisma/seed.js
```

Ouvrez <http://site.localhost> et <http://admin.localhost>. Pour tout effacer, y
compris la base d'essai :
`docker compose -p portfolio-essai --env-file .env.essai down -v`.

L'essai prend les ports 80 et 443 du poste, et il est sans rapport avec
`npm run dev`, qui reste inchangé.

## Notes de fonctionnement

- **La page d'accueil est rendue à chaque visite**, pas au build : l'API
  n'est pas joignable pendant `docker build`. Les données restent en cache
  60 s, ce qui ne change rien pour le visiteur.
- **`/blog`, `/sitemap.xml`, `/robots.txt` et `/og`** sont produits au build
  sans données, puis régénérés avec le contenu réel dans la minute qui suit
  la première visite.
- **Les appels de l'API faits par le serveur** (rendu du portfolio) passent par
  l'adresse publique de l'API. Dans le réseau Docker, des alias la font
  pointer directement vers Caddy, sans sortir sur Internet.
