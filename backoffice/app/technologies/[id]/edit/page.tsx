"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchEntity, updateEntity } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import type { TechnologyDto } from "@portfolio/shared-types";

export default function EditTechnologyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<TechnologyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntity<TechnologyDto>("technologies", id)
      .then(setData)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    try {
      await updateEntity("technologies", id, {
        label: data.label,
        logoPath: data.logoPath,
        sortOrder: data.sortOrder,
      });
      toast.success("Technologie mise à jour");
      router.push("/technologies");
    } catch {
      toast.error("Erreur de mise à jour");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Chargement...</p>;
  if (!data) return <p>Technologie introuvable.</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Modifier la technologie</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Libellé</label>
          <input
            type="text"
            value={data.label}
            onChange={(e) => setData({ ...data, label: e.target.value })}
            required
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
        </div>
        <ImageUpload currentPath={data.logoPath} category="technologies" onUpload={(p) => setData({ ...data, logoPath: p })} label="Logo" />
        <div>
          <label className="block text-sm font-medium mb-1">Ordre d&apos;affichage</label>
          <input
            type="number"
            value={data.sortOrder}
            onChange={(e) => setData({ ...data, sortOrder: Number(e.target.value) })}
            min={0}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">Entier positif ou nul</p>
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
