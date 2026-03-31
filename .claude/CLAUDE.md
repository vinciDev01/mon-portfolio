# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack portfolio website with all content configurable from a backoffice admin. Monorepo with three workspaces.

## Commands

### Root (monorepo)
- `npm run dev:backend` — Start backend (port 4000)
- `npm run dev:frontend` — Start frontend portfolio (port 3000)
- `npm run dev:backoffice` — Start backoffice admin (port 3001)
- `npm run build` — Build all workspaces
- `npm run lint` — Lint all workspaces

### Backend (`backend/`)
- `npm run dev` — NestJS watch mode
- `npm run build` — Compile TypeScript
- `npm run prisma:generate` — Generate Prisma client
- `npm run prisma:migrate` — Run migrations (`prisma migrate dev`)
- `npx prisma db seed` — Seed default SiteSettings and PersonalInfo

### Frontend (`frontend/`)
- `npm run dev` — Next.js dev with Turbopack (port 3000)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`

### Backoffice (`backoffice/`)
- `npm run dev` — Next.js dev with Turbopack (port 3001)
- `npm run build` — Production build

## Architecture

```
my-portfolio/
├── backend/           # NestJS + Prisma + PostgreSQL (port 4000)
├── frontend/          # Next.js 16 portfolio single page (port 3000)
├── backoffice/        # Next.js admin panel (port 3001)
├── packages/
│   └── shared-types/  # TypeScript interfaces shared across apps
└── uploads/           # Local file storage (gitignored)
```

### Backend (NestJS)
- **Database**: PostgreSQL via Prisma ORM. Schema at `backend/prisma/schema.prisma`.
- **API prefix**: All routes under `/api/`. Swagger docs at `/api/docs`.
- **Modules**: One NestJS module per entity — `PrismaModule` (global), `UploadModule`, `SiteSettingsModule`, `PersonalInfoModule`, `TechnologiesModule`, `OrganizationsModule`, `PresentationsModule`, `SkillsModule`, `ExperiencesModule`, `CertificationsModule`, `ProjectsModule`, `ServicesModule`, `AboutModule`, `PortfolioModule`.
- **Singleton entities**: `SiteSettings` and `PersonalInfo` use GET/PATCH (no id). Seeded via `prisma/seed.ts`.
- **CRUD entities**: Standard REST (GET list, GET :id, POST, PATCH :id, DELETE :id).
- **Aggregated endpoint**: `GET /api/portfolio` returns all data in one call (used by frontend).
- **File uploads**: `POST /api/upload` with multer, converts images to webp via sharp. Files stored under `uploads/{category}/{uuid}.webp`. Static served at `/uploads/`.
- **CORS**: Allows origins `localhost:3000` and `localhost:3001`.

### Shared Types (`packages/shared-types`)
- Exported as `@portfolio/shared-types`. Key type: `PortfolioData` (aggregated response).
- Raw TypeScript source (no build step), consumed directly via `"main": "./src/index.ts"`.

### Frontend Portfolio (Next.js)
- Single page app. `app/page.tsx` is an async server component fetching `PortfolioData` from backend.
- ISR with 60s revalidation.
- Sections: Header, Presentation, Skills, Experience, Certifications, Projects, Services, About, Footer.
- `SeeMoreList<T>` client component handles "Voir plus" pagination.
- `ToastNotification` client component shows configurable timed toast.
- CV download via `/api/download-cv` route handler (proxies backend file).
- Default theme: khaki background (#F0E68C), black text. Theme toggle via next-themes.
- Path alias: `@/*` maps to project root.
- shadcn/ui with radix-maia style, Hugeicons icon library.

### Backoffice Admin (Next.js)
- Sidebar navigation layout with CRUD pages for every entity.
- Singleton pages (site-settings, personal-info): edit form only.
- CRUD pages (all others): list table + new form + edit form.
- `ImageUpload` component handles file uploads with preview.
- `ConfirmDialog` for delete confirmations.
- Clean white/gray admin theme (not khaki).
- Uses `lib/api.ts` helpers: `fetchEntities`, `createEntity`, `updateEntity`, `deleteEntity`, `uploadFile`.

## Key Conventions

- All database column names use snake_case (`@map`), TypeScript uses camelCase.
- Every sortable entity has a `sortOrder` field for display ordering.
- File paths in DB are relative (e.g., `technologies/uuid.webp`). Backend prepends `/uploads/` when serving.
- Project-Technology is a M2M relation via `ProjectTechnology` join table. Create/update projects expects `technologyIds: string[]`.
- Environment: `backend/.env` for `DATABASE_URL`, `PORT`. Frontend/backoffice use `.env.local` for `NEXT_PUBLIC_API_URL`.

## Setup

1. Ensure PostgreSQL is running with database `portfolio_db`
2. `npm install` (root — installs all workspaces)
3. `cd backend && npx prisma migrate dev && npx prisma db seed`
4. `npm run dev:backend` then `npm run dev:frontend` and `npm run dev:backoffice`
