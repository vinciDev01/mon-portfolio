-- AlterTable
ALTER TABLE "cv_versions" ADD COLUMN     "lettre_corps" TEXT,
ADD COLUMN     "lettre_date" DATE,
ADD COLUMN     "lettre_destinataire" TEXT,
ADD COLUMN     "lettre_lieu" TEXT,
ADD COLUMN     "lettre_objet" TEXT;

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "lettre_en_tete" TEXT;
