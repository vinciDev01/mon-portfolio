-- Le corps de la lettre devient une liste de sections : l'ancien corps
-- devient la premiere, sans titre.
ALTER TABLE "cv_versions" ADD COLUMN "lettre_sections" JSONB NOT NULL DEFAULT '[]';

UPDATE "cv_versions"
SET "lettre_sections" = jsonb_build_array(jsonb_build_object('titre', NULL, 'corps', "lettre_corps"))
WHERE "lettre_corps" IS NOT NULL AND btrim("lettre_corps") <> '';

ALTER TABLE "cv_versions" DROP COLUMN "lettre_corps";
