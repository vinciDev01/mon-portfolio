-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "availability_label" TEXT,
ADD COLUMN     "availability_status" TEXT NOT NULL DEFAULT 'available',
ADD COLUMN     "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notification_email" TEXT,
ADD COLUMN     "seo_description" TEXT,
ADD COLUMN     "seo_image_path" TEXT,
ADD COLUMN     "seo_title" TEXT;

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cover_image_path" TEXT,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");
