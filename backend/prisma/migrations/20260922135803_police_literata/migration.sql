-- AlterTable
ALTER TABLE "site_settings" ALTER COLUMN "font_family" SET DEFAULT 'Literata';

-- Migrer les lignes restees sur l'ancien defaut. La clause WHERE est
-- essentielle : une police choisie deliberement par le proprietaire doit
-- survivre a la migration.
UPDATE "site_settings" SET "font_family" = 'Literata' WHERE "font_family" = 'IBM Plex Sans';
