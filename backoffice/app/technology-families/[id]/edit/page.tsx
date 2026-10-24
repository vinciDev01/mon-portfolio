"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchEntity, updateEntity } from "@/lib/api";
import { toast } from "sonner";
import type { TechnologyFamilyDto } from "@portfolio/shared-types";

export default function EditTechnologyFamilyPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntity<TechnologyFamilyDto>("technology-families", id)
      .then((c) => { setName(c.name); setSortOrder(c.sortOrder); })
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateEntity("technology-families", id, { name: name.trim(), sortOrder });
      toast.success("Mis à jour");
      router.push("/technology-families");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setSaving(false); }
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Modifier la famille</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label htmlFor="famille-nom" className="block text-sm font-medium mb-1">Nom</label><input id="famille-nom" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div>
          <label htmlFor="famille-ordre" className="block text-sm font-medium mb-1">Ordre</label>
          <input id="famille-ordre" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} min={0} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
        </div>
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Enregistrement..." : "Enregistrer"}</button>
      </form>
    </div>
  );
}
