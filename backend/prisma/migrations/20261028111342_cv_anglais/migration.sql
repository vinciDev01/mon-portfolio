-- AlterTable
ALTER TABLE "cours" ADD COLUMN     "titre_en" TEXT;

-- AlterTable
ALTER TABLE "cv_sections" ADD COLUMN     "lignes_en" TEXT,
ADD COLUMN     "titre_en" TEXT;

-- AlterTable
ALTER TABLE "experiences" ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "role_en" TEXT;

-- AlterTable
ALTER TABLE "presentations" ADD COLUMN     "description_en" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "cv_summary_en" TEXT,
ADD COLUMN     "description_en" TEXT;

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "cv_job_title_en" TEXT;

-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "label_en" TEXT;

-- AlterTable
ALTER TABLE "technology_families" ADD COLUMN     "name_en" TEXT;
