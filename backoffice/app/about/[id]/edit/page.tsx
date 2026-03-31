"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchEntity, updateEntity } from "@/lib/api";
import { toast } from "sonner";
import type { AboutDto } from "@portfolio/shared-types";

export default function EditAboutPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [content, setContent] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntity<AboutDto>("about", id).then((d) => { setContent(d.content); setSortOrder(d.sortOrder); })
      .catch(() => toast.error("Erreur")).finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateEntity("about", id, { content, sortOrder });
      toast.success("Mis à jour");
      router.push("/about");
    } catch { toast.error("Erreur"); } finally { setSaving(false); }
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Modifier le contenu</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label className="block text-sm font-medium mb-1">Contenu</label><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Ordre</label><input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Sauvegarde..." : "Sauvegarder"}</button>
      </form>
    </div>
  );
}
