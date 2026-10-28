-- CreateTable
CREATE TABLE "cv_versions" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "titre_poste" TEXT,
    "presentation" TEXT,
    "sections_masquees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "projet_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technologie_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "competence_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_versions_pkey" PRIMARY KEY ("id")
);
