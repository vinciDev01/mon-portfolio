"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { toast } from "sonner";

export default function NewTechnologyFamilyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createEntity("technology-families", { name: name.trim(), sortOrder });
      toast.success("Famille créée");
      router.push("/technology-families");
    } catch (err) {
      // Le nom est unique : l'API dit « Une categorie porte deja ce nom ».
      toast.error(err instanceof Error ? err.message : "Erreur de création");
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Nouvelle famille</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label htmlFor="famille-nom" className="block text-sm font-medium mb-1">Nom</label><input id="famille-nom" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div>
          <label htmlFor="famille-ordre" className="block text-sm font-medium mb-1">Ordre</label>
          <input id="famille-ordre" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} min={0} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
          <p className="text-xs text-muted-foreground mt-1">Ordre des familles dans le CV</p>
        </div>
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Création..." : "Créer"}</button>
      </form>
    </div>
  );
}
