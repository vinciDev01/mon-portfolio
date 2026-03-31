"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchEntity, updateEntity } from "@/lib/api";
import { toast } from "sonner";
import type { PresentationDto } from "@portfolio/shared-types";

export default function EditPresentationPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<PresentationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEntity<PresentationDto>("presentations", id).then(setData).catch(() => toast.error("Erreur")).finally(() => setLoading(false)); }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    try {
      await updateEntity("presentations", id, { title: data.title, subtitle: data.subtitle, description: data.description, sortOrder: data.sortOrder });
      toast.success("Mis à jour");
      router.push("/presentations");
    } catch { toast.error("Erreur"); } finally { setSaving(false); }
  }

  if (loading) return <p>Chargement...</p>;
  if (!data) return <p>Introuvable.</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Modifier la présentation</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label className="block text-sm font-medium mb-1">Titre</label><input type="text" value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Sous-titre</label><input type="text" value={data.subtitle || ""} onChange={(e) => setData({ ...data, subtitle: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={data.description || ""} onChange={(e) => setData({ ...data, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Ordre</label><input type="number" value={data.sortOrder} onChange={(e) => setData({ ...data, sortOrder: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Sauvegarde..." : "Sauvegarder"}</button>
      </form>
    </div>
  );
}
