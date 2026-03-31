"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchEntity, updateEntity } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import type { OrganizationDto } from "@portfolio/shared-types";

export default function EditOrganizationPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<OrganizationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEntity<OrganizationDto>("organizations", id).then(setData).catch(() => toast.error("Erreur")).finally(() => setLoading(false)); }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    try {
      await updateEntity("organizations", id, { label: data.label, logoPath: data.logoPath, websiteUrl: data.websiteUrl, sortOrder: data.sortOrder });
      toast.success("Organisation mise à jour");
      router.push("/organizations");
    } catch { toast.error("Erreur"); } finally { setSaving(false); }
  }

  if (loading) return <p>Chargement...</p>;
  if (!data) return <p>Introuvable.</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Modifier l&apos;organisation</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label className="block text-sm font-medium mb-1">Libellé</label><input type="text" value={data.label} onChange={(e) => setData({ ...data, label: e.target.value })} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <ImageUpload currentPath={data.logoPath} category="organizations" onUpload={(p) => setData({ ...data, logoPath: p })} label="Logo" />
        <div><label className="block text-sm font-medium mb-1">Site web</label><input type="url" value={data.websiteUrl || ""} onChange={(e) => setData({ ...data, websiteUrl: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Ordre</label><input type="number" value={data.sortOrder} onChange={(e) => setData({ ...data, sortOrder: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Sauvegarde..." : "Sauvegarder"}</button>
      </form>
    </div>
  );
}
