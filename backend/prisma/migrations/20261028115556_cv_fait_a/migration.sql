-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "cv_date_fait_a" DATE,
ADD COLUMN     "cv_espace_signature" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cv_fait_a" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cv_lieu" TEXT;
