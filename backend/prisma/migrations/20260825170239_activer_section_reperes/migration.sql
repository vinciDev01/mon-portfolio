-- AlterTable
ALTER TABLE "site_settings" ALTER COLUMN "show_stats" SET DEFAULT true;

-- Le defaut de colonne ne vaut que pour les futures insertions : on bascule
-- aussi la ligne existante, sinon la section resterait masquee sur le site
-- deja installe.
UPDATE "site_settings" SET "show_stats" = true;
