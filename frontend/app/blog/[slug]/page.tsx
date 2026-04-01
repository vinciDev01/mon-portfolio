import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BlogPostDto } from "@portfolio/shared-types";
import type { Metadata } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getBlogPost(slug: string): Promise<BlogPostDto | null> {
  try {
    const res = await fetch(`${API_URL}/api/blog/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<BlogPostDto>;
  } catch {
    return null;
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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Article introuvable" };

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      ...(post.coverImagePath && {
        images: [{ url: `${API_URL}/uploads/${post.coverImagePath}` }],
      }),
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post || !post.isPublished) {
    notFound();
  }

  return (
    <article className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/blog"
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
          Retour au blog
        </Link>

        <time className="text-sm text-muted-foreground block mb-3">
          {formatDate(post.publishedAt ?? post.createdAt)}
        </time>

        <h1 className="text-3xl font-bold tracking-tight leading-tight mb-4">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-lg text-muted-foreground leading-relaxed">
            {post.excerpt}
          </p>
        )}
      </div>

      {post.coverImagePath && (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-10">
          <Image
            src={`${API_URL}/uploads/${post.coverImagePath}`}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
            priority
          />
        </div>
      )}

      <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-foreground prose-a:underline prose-code:text-sm prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-img:rounded-lg">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
          Retour au blog
        </Link>
      </div>
    </article>
  );
}
