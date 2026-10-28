#!/bin/sh
# Sauvegarde la base et les fichiers televerses (images, CV, cours).
# A lancer depuis la racine du depot, sur le serveur :
#     ./deploiement/sauvegarder.sh
# Chaque execution cree sauvegardes/AAAA-MM-JJ_HHMM/ ; les 14 plus recentes
# sont gardees. Copiez ce dossier hors du serveur : une sauvegarde qui vit sur
# la meme machine disparait avec elle.
set -eu
# Les sauvegardes contiennent les donnees personnelles et le compte admin.
umask 077

dossier="sauvegardes/$(date +%Y-%m-%d_%H%M)"
mkdir -p "$dossier"

docker compose exec -T postgres pg_dump -U portfolio -d portfolio_db -Fc > "$dossier/base.dump"
docker compose exec -T backend tar -C /app -czf - uploads cours > "$dossier/fichiers.tar.gz"

ls -1d sauvegardes/*/ | sort | head -n -14 | xargs -r rm -rf
echo "Sauvegarde ecrite dans $dossier"
