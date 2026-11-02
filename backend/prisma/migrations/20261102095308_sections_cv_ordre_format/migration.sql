-- AlterTable
ALTER TABLE "cv_sections" ADD COLUMN     "format" TEXT NOT NULL DEFAULT 'puces';

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "cv_rangs_base" JSONB NOT NULL DEFAULT '{}';
