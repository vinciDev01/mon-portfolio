"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateEntity } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import type { BlogPostDto } from "@portfolio/shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function EditBlogPostPage() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };

  const [postId, setPostId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [coverImagePath, setCoverImagePath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("portfolio-admin-token") : null;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${API_URL}/api/blog/${slug}`, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json() as Promise<BlogPostDto>;
      })
      .then((post) => {
        setPostId(post.id);
        setTitle(post.title);
        setPostSlug(post.slug);
        setCoverImagePath(post.coverImagePath);
        setContent(post.content);
        setExcerpt(post.excerpt || "");
        setIsPublished(post.isPublished);
        setSortOrder(post.sortOrder);
      })
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!postId) return;
    setSaving(true);
    try {
      await updateEntity("blog", postId, {
        title,
        slug: postSlug,
        coverImagePath: coverImagePath || null,
        content,
        excerpt: excerpt || null,
        isPublished,
        sortOrder,
      });
      toast.success("Article mis à jour");
      router.push("/blog");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-8">Modifier l&apos;article</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            type="text"
            value={postSlug}
            onChange={(e) => setPostSlug(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Identifiant unique dans l&apos;URL
          </p>
        </div>

        <ImageUpload
          label="Image de couverture"
          currentPath={coverImagePath}
          category="blog"
          onUpload={setCoverImagePath}
        />

        <div>
          <label className="block text-sm font-medium mb-1">Extrait</label>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
            placeholder="Résumé court de l'article"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="block text-sm font-medium mb-1">Contenu (Markdown)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="flex-1 w-full px-3 py-2 border border-border rounded-md text-sm font-mono resize-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-sm font-medium mb-1">Apercu</label>
            <div className="flex-1 px-3 py-2 border border-border rounded-md text-sm whitespace-pre-wrap min-h-[480px] bg-gray-50 overflow-auto">
              {content || <span className="text-muted-foreground italic">L&apos;apercu apparaitra ici...</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ordre</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              min={0}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-border"
              />
              Publier l&apos;article
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
}
