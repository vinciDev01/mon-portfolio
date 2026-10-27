-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "show_cours" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "cours" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "titre_court" TEXT,
    "description" TEXT,
    "niveau" TEXT NOT NULL DEFAULT 'debutant',
    "pages" INTEGER,
    "fichier" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "technology_id" TEXT NOT NULL,
    "publique" BOOLEAN NOT NULL DEFAULT false,
    "telechargements" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cours_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cours" ADD CONSTRAINT "cours_technology_id_fkey" FOREIGN KEY ("technology_id") REFERENCES "technologies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
