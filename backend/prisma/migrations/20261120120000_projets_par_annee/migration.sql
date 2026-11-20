-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN "cv_projets_par_annee" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "cv_versions" ADD COLUMN "projets_par_annee" BOOLEAN;
