"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchEntities, deleteEntity } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import type { BlogPostDto } from "@portfolio/shared-types";

export default function BlogPage() {
  const router = useRouter();
  const [items, setItems] = useState<BlogPostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntities<BlogPostDto>("blog/all")
      .then(setItems)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteEntity("blog", deleteId);
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      toast.success("Article supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
    setDeleteId(null);
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <PageHeader title="Blog" addHref="/blog/new" />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-3 px-2">Titre</th>
            <th className="py-3 px-2">Slug</th>
            <th className="py-3 px-2">Statut</th>
            <th className="py-3 px-2">Date</th>
            <th className="py-3 px-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border">
              <td className="py-3 px-2 font-medium">{item.title}</td>
              <td className="py-3 px-2 text-xs text-muted-foreground">{item.slug}</td>
              <td className="py-3 px-2">
                {item.isPublished ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Publié
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Brouillon
                  </span>
                )}
              </td>
              <td className="py-3 px-2 text-xs text-muted-foreground">
                {item.publishedAt
                  ? new Date(item.publishedAt).toLocaleDateString("fr-FR")
                  : new Date(item.createdAt).toLocaleDateString("fr-FR")}
              </td>
              <td className="py-3 px-2 text-right space-x-2">
                <button
                  onClick={() => router.push(`/blog/${item.slug}/edit`)}
                  className="text-xs px-3 py-1 rounded border border-border hover:bg-accent"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="text-xs px-3 py-1 rounded bg-destructive text-white hover:bg-destructive/90"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Aucun article</p>
      )}
      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer l'article"
        message="Voulez-vous vraiment supprimer cet article ? Cette action est irréversible."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
