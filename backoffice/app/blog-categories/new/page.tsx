"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { toast } from "sonner";

export default function NewBlogCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createEntity("blog-categories", { name: name.trim(), sortOrder });
      toast.success("Catégorie créée");
      router.push("/blog-categories");
    } catch (err) {
      // Le nom est unique : l'API dit « Une categorie porte deja ce nom ».
      toast.error(err instanceof Error ? err.message : "Erreur de création");
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Nouvelle catégorie</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label htmlFor="categorie-nom" className="block text-sm font-medium mb-1">Nom</label><input id="categorie-nom" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div>
          <label htmlFor="categorie-ordre" className="block text-sm font-medium mb-1">Ordre</label>
          <input id="categorie-ordre" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} min={0} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
          <p className="text-xs text-muted-foreground mt-1">Ordre d&apos;affichage des groupes sur la page Blog</p>
        </div>
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Création..." : "Créer"}</button>
      </form>
    </div>
  );
}
