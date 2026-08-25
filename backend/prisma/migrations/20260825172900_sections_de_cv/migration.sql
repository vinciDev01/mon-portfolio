-- AlterTable
ALTER TABLE "personal_info" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "adresse_publique" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nationalite" TEXT;

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "cv_font_family" TEXT NOT NULL DEFAULT 'serif';

-- CreateTable
CREATE TABLE "cv_sections" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "lignes" TEXT NOT NULL,
    "publique" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_sections_pkey" PRIMARY KEY ("id")
);
