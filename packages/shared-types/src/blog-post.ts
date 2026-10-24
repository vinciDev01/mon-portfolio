import type { BlogCategoryDto } from "./blog-category";

export interface BlogPostDto {
  id: string;
  title: string;
  slug: string;
  coverImagePath: string | null;
  content: string;
  excerpt: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  sortOrder: number;
  createdAt: string;
  /** La categorie de l'article, ou `null` : il parait sous « Sans categorie ». */
  categoryId: string | null;
  category: BlogCategoryDto | null;
}
