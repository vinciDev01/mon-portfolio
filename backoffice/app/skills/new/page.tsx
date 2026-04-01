"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity, fetchEntities } from "@/lib/api";
import { toast } from "sonner";
import type { TechnologyDto } from "@portfolio/shared-types";

export default function NewSkillPage() {
  const router = useRouter();
  const [technologies, setTechnologies] = useState<TechnologyDto[]>([]);
  const [technologyId, setTechnologyId] = useState("");
  const [proficiency, setProficiency] = useState<number | "">("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEntities<TechnologyDto>("technologies").then(setTechnologies).catch(() => {}); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!technologyId) { toast.error("Sélectionnez une technologie"); return; }
    setSaving(true);
    try {
      await createEntity("skills", { technologyId, proficiency: proficiency === "" ? null : proficiency, sortOrder });
      toast.success("Compétence créée");
      router.push("/skills");
    } catch { toast.error("Erreur"); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Nouvelle compétence</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Technologie</label>
          <select value={technologyId} onChange={(e) => setTechnologyId(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
            <option value="">-- Sélectionner --</option>
            {technologies.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Niveau (0-100)</label>
          <input type="number" value={proficiency} onChange={(e) => setProficiency(e.target.value === "" ? "" : Number(e.target.value))} min={0} max={100} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
          <p className="text-xs text-muted-foreground mt-1">Entier entre 0 et 100</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ordre</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} min={0} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
          <p className="text-xs text-muted-foreground mt-1">Entier positif ou nul</p>
        </div>
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Création..." : "Créer"}</button>
      </form>
    </div>
  );
}
