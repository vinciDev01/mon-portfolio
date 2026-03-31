"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { toast } from "sonner";

export default function NewPresentationPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createEntity("presentations", { title, subtitle: subtitle || null, description: description || null, sortOrder });
      toast.success("Présentation créée");
      router.push("/presentations");
    } catch { toast.error("Erreur"); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Nouvelle présentation</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label className="block text-sm font-medium mb-1">Titre</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Sous-titre</label><input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Ordre</label><input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Création..." : "Créer"}</button>
      </form>
    </div>
  );
}
