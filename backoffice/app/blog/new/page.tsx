"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NewBlogPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [coverImagePath, setCoverImagePath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createEntity("blog", {
        title,
        slug,
        coverImagePath: coverImagePath || null,
        content,
        excerpt: excerpt || null,
        isPublished,
        sortOrder,
      });
      toast.success("Article créé");
      router.push("/blog");
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-8">Nouvel article</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
            placeholder="Mon article de blog"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md text-sm font-mono"
            placeholder="mon-article-de-blog"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Identifiant unique dans l&apos;URL (auto-généré depuis le titre)
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
              placeholder="# Mon titre&#10;&#10;Contenu en markdown..."
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-sm font-medium mb-1">Apercu</label>
            <div
              className="flex-1 px-3 py-2 border border-border rounded-md text-sm whitespace-pre-wrap min-h-[480px] bg-gray-50 overflow-auto"
            >
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
          {saving ? "Création..." : "Créer"}
        </button>
      </form>
    </div>
  );
}
