/*
  Warnings:

  - You are about to drop the column `lamp_beam_angle` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `lamp_dim_level` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `lamp_enabled` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `lamp_intensity` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `lamp_on_by_default` on the `site_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "site_settings" DROP COLUMN "lamp_beam_angle",
DROP COLUMN "lamp_dim_level",
DROP COLUMN "lamp_enabled",
DROP COLUMN "lamp_intensity",
DROP COLUMN "lamp_on_by_default";
