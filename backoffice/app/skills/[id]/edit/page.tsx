"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchEntity, updateEntity, fetchEntities } from "@/lib/api";
import { toast } from "sonner";
import type { SkillDto, TechnologyDto } from "@portfolio/shared-types";

export default function EditSkillPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [technologies, setTechnologies] = useState<TechnologyDto[]>([]);
  const [data, setData] = useState<SkillDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchEntity<SkillDto>("skills", id), fetchEntities<TechnologyDto>("technologies")])
      .then(([skill, techs]) => { setData(skill); setTechnologies(techs); })
      .catch(() => toast.error("Erreur"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    try {
      await updateEntity("skills", id, { technologyId: data.technologyId, proficiency: data.proficiency, sortOrder: data.sortOrder });
      toast.success("Mis à jour");
      router.push("/skills");
    } catch { toast.error("Erreur"); } finally { setSaving(false); }
  }

  if (loading) return <p>Chargement...</p>;
  if (!data) return <p>Introuvable.</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Modifier la compétence</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Technologie</label>
          <select value={data.technologyId} onChange={(e) => setData({ ...data, technologyId: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
            {technologies.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Niveau (0-100)</label>
          <input type="number" value={data.proficiency ?? ""} onChange={(e) => setData({ ...data, proficiency: e.target.value === "" ? null : Number(e.target.value) })} min={0} max={100} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
          <p className="text-xs text-muted-foreground mt-1">Entier entre 0 et 100</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ordre</label>
          <input type="number" value={data.sortOrder} onChange={(e) => setData({ ...data, sortOrder: Number(e.target.value) })} min={0} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
          <p className="text-xs text-muted-foreground mt-1">Entier positif ou nul</p>
        </div>
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Sauvegarde..." : "Sauvegarder"}</button>
      </form>
    </div>
  );
}
