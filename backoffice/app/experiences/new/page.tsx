"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { toast } from "sonner";

export default function NewExperiencePage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createEntity("experiences", {
        company, role, description: description || null,
        startDate: new Date(startDate).toISOString(),
        endDate: isCurrent ? null : endDate ? new Date(endDate).toISOString() : null,
        isCurrent, sortOrder,
      });
      toast.success("Expérience créée");
      router.push("/experiences");
    } catch { toast.error("Erreur"); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Nouvelle expérience</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label className="block text-sm font-medium mb-1">Entreprise</label><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Poste</label><input type="text" value={role} onChange={(e) => setRole(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Date de début</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Date de fin</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isCurrent} className="w-full px-3 py-2 border border-border rounded-md text-sm disabled:opacity-50" /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} /> Poste actuel</label>
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
