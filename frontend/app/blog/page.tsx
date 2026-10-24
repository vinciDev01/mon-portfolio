import Link from "next/link";
import { ExplorateurBlog } from "@/components/blog/explorateur-blog";
import type { BlogPostDto } from "@portfolio/shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getBlogPosts(): Promise<BlogPostDto[]> {
  try {
    const res = await fetch(`${API_URL}/api/blog`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json() as Promise<BlogPostDto[]>;
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();
  const published = posts.filter((p) => p.isPublished);

  return (
    <div>
      <header className="mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Retour au portfolio
        </Link>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Blog</h1>
        <p className="text-muted-foreground text-lg">
          {published.length} article{published.length !== 1 ? "s" : ""}
        </p>
      </header>

      {published.length === 0 ? (
        <p className="text-muted-foreground">Aucun article pour le moment.</p>
      ) : (
        <ExplorateurBlog articles={published} />
      )}
    </div>
  );
}
