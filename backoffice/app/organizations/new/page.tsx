"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createEntity("organizations", { label, logoPath, websiteUrl: websiteUrl || null, sortOrder });
      toast.success("Organisation créée");
      router.push("/organizations");
    } catch { toast.error("Erreur de création"); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Nouvelle organisation</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label className="block text-sm font-medium mb-1">Libellé</label><input type="text" value={label} onChange={(e) => setLabel(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <ImageUpload currentPath={logoPath} category="organizations" onUpload={setLogoPath} label="Logo" />
        <div>
          <label className="block text-sm font-medium mb-1">Site web</label>
          <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
          <p className="text-xs text-muted-foreground mt-1">URL valide (ex: https://example.com)</p>
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
