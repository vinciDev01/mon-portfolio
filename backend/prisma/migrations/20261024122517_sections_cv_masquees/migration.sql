-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "cv_base_masquees" TEXT[] DEFAULT ARRAY[]::TEXT[];
