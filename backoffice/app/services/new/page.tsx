"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity, fetchEntities } from "@/lib/api";
import { toast } from "sonner";
import type { OrganizationDto } from "@portfolio/shared-types";

export default function NewServicePage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEntities<OrganizationDto>("organizations").then(setOrgs).catch(() => {}); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createEntity("services", { label, description: description || null, organizationId: organizationId || null, sortOrder });
      toast.success("Service créé");
      router.push("/services");
    } catch { toast.error("Erreur"); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Nouveau service</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label className="block text-sm font-medium mb-1">Libellé</label><input type="text" value={label} onChange={(e) => setLabel(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div>
          <label className="block text-sm font-medium mb-1">Organisation (optionnel)</label>
          <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
            <option value="">-- Aucune --</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
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
