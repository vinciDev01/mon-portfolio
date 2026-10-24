-- Les familles de technologies deviennent une liste geree.
-- Les familles deja saisies en texte libre sont reprises telles quelles,
-- dans l'ordre ou elles paraissaient au CV (premiere technologie de chacune),
-- puis chaque technologie est reliee a la sienne. Aucune famille n'est perdue.

-- CreateTable
CREATE TABLE "technology_families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technology_families_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "technology_families_name_key" ON "technology_families"("name");

-- AlterTable
ALTER TABLE "technologies" ADD COLUMN "family_id" TEXT;

-- Reprise des familles saisies
INSERT INTO "technology_families" ("id", "name", "sort_order", "updated_at")
SELECT gen_random_uuid()::text, s.nom, (ROW_NUMBER() OVER (ORDER BY s.premier, s.nom) - 1)::int, CURRENT_TIMESTAMP
FROM (
    SELECT btrim("family") AS nom, MIN("sort_order") AS premier
    FROM "technologies"
    WHERE "family" IS NOT NULL AND btrim("family") <> ''
    GROUP BY btrim("family")
) AS s;

UPDATE "technologies" AS t
SET "family_id" = f."id"
FROM "technology_families" AS f
WHERE btrim(t."family") = f."name";

-- AlterTable
ALTER TABLE "technologies" DROP COLUMN "family";

-- AddForeignKey
ALTER TABLE "technologies" ADD CONSTRAINT "technologies_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "technology_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;
