-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "family_id" TEXT,
ADD COLUMN     "label" TEXT,
ALTER COLUMN "technology_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "technology_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;
