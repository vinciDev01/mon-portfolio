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
}
