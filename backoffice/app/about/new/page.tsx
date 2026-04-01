"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { toast } from "sonner";

export default function NewAboutPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createEntity("about", { content, sortOrder });
      toast.success("Contenu créé");
      router.push("/about");
    } catch { toast.error("Erreur"); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Nouveau contenu À propos</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label className="block text-sm font-medium mb-1">Contenu</label><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
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
