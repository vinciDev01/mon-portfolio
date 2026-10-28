# Une image par application, construites depuis la racine du monorepo :
#   docker build --target backend    .
#   docker build --target frontend   --build-arg NEXT_PUBLIC_API_URL=... .
#   docker build --target backoffice --build-arg NEXT_PUBLIC_API_URL=... .
# docker-compose.yml fait ces trois builds ; voir docs/deploiement.md.

FROM node:22-bookworm-slim AS base
# openssl : requis par le moteur de requetes de Prisma.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# --- Manifestes seuls : la couche d'installation ne se refait que s'ils changent.
FROM base AS manifestes
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY backoffice/package.json backoffice/

FROM manifestes AS deps
RUN npm ci

# ============================================================== backend
FROM deps AS build-backend
COPY packages packages
COPY backend backend
RUN cd backend && npx prisma generate && npm run build

FROM manifestes AS backend
ENV NODE_ENV=production
RUN npm ci --omit=dev --workspace backend && npm cache clean --force
COPY backend/prisma backend/prisma
RUN cd backend && npx prisma generate
COPY --from=build-backend /app/backend/dist backend/dist
# Le code resout les fichiers depuis le dossier du backend (../uploads,
# ../cours) : ces deux dossiers sont les volumes de donnees.
RUN mkdir -p /app/uploads /app/cours && chown node:node /app/uploads /app/cours
WORKDIR /app/backend
USER node
EXPOSE 4000
# Les migrations en attente s'appliquent avant chaque demarrage.
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/src/main.js"]

# ============================================================== Next.js
# NEXT_PUBLIC_* est inscrit dans le code envoye au navigateur au moment du
# build : changer d'adresse demande de reconstruire l'image.
FROM deps AS build-frontend
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
COPY packages packages
COPY frontend frontend
RUN npm run build --workspace frontend

FROM deps AS build-backoffice
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY packages packages
COPY backoffice backoffice
RUN npm run build --workspace backoffice

FROM base AS frontend
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build-frontend --chown=node:node /app/frontend/.next/standalone ./
COPY --from=build-frontend --chown=node:node /app/frontend/.next/static ./frontend/.next/static
COPY --from=build-frontend --chown=node:node /app/frontend/public ./frontend/public
USER node
EXPOSE 3000
CMD ["node", "frontend/server.js"]

FROM base AS backoffice
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0
COPY --from=build-backoffice --chown=node:node /app/backoffice/.next/standalone ./
COPY --from=build-backoffice --chown=node:node /app/backoffice/.next/static ./backoffice/.next/static
USER node
EXPOSE 3001
CMD ["node", "backoffice/server.js"]
