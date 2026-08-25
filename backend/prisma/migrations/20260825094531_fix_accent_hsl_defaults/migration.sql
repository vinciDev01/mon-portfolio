-- AlterTable
ALTER TABLE "site_settings" ALTER COLUMN "accent_hue" SET DEFAULT 107,
ALTER COLUMN "accent_saturation" SET DEFAULT 16;

-- Correction des valeurs HSL de l'accent pour correspondre à #7E9B76
UPDATE "site_settings"
SET "accent_hue"        = 107,
    "accent_saturation" = 16;
