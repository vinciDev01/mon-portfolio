import Link from "next/link";
import Image from "next/image";
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

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const posts = await getBlogPosts();
  const published = posts.filter((p) => p.isPublished);

  return (
    <div>
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Blog</h1>
        <p className="text-muted-foreground text-lg">
          {published.length} article{published.length !== 1 ? "s" : ""}
        </p>
      </header>

      {published.length === 0 ? (
        <p className="text-muted-foreground">Aucun article pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {published.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-xl border border-border overflow-hidden bg-card hover:shadow-md transition-shadow"
            >
              {post.coverImagePath && (
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <Image
                    src={`${API_URL}/uploads/${post.coverImagePath}`}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2 p-5 flex-1">
                <time className="text-xs text-muted-foreground">
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </time>
                <h2 className="font-semibold text-lg leading-snug group-hover:underline decoration-1 underline-offset-2">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
