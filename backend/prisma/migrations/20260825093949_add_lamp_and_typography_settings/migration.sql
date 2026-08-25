-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "accent_hue" INTEGER NOT NULL DEFAULT 128,
ADD COLUMN     "accent_saturation" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "animation_speed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "animations_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lamp_beam_angle" INTEGER NOT NULL DEFAULT 28,
ADD COLUMN     "lamp_dim_level" INTEGER NOT NULL DEFAULT 40,
ADD COLUMN     "lamp_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lamp_intensity" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "lamp_on_by_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "line_height" DOUBLE PRECISION NOT NULL DEFAULT 1.6,
ADD COLUMN     "respect_reduced_motion" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "section_spacing" INTEGER NOT NULL DEFAULT 120,
ADD COLUMN     "show_stats" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type_scale" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "zigzag_amplitude" INTEGER NOT NULL DEFAULT 50,
ALTER COLUMN "bg_color" SET DEFAULT '#131518',
ALTER COLUMN "text_color" SET DEFAULT '#E4E5E3',
ALTER COLUMN "font_size" SET DEFAULT 17,
ALTER COLUMN "font_family" SET DEFAULT 'IBM Plex Sans';

-- Bascule de l'enregistrement existant vers la nouvelle identité visuelle
UPDATE "site_settings"
SET "bg_color"    = '#131518',
    "text_color"  = '#E4E5E3',
    "font_size"   = 17,
    "font_family" = 'IBM Plex Sans',
    "show_services"     = false,
    "show_testimonials" = false,
    "show_stats"        = false;
