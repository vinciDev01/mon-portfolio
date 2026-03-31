"use client";

import { useEffect, useState } from "react";
import { fetchSingleton, updateSingleton, uploadFile } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import type { SiteSettingsDto } from "@portfolio/shared-types";

export default function SiteSettingsPage() {
  const [data, setData] = useState<SiteSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSingleton<SiteSettingsDto>("site-settings")
      .then(setData)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    try {
      const { id, ...rest } = data;
      await updateSingleton("site-settings", rest);
      toast.success("Paramètres sauvegardés");
    } catch {
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await uploadFile(file, "cv");
      setData((d) => d ? { ...d, cvFilePath: path } : d);
      toast.success("CV uploadé");
    } catch {
      toast.error("Erreur upload CV");
    }
  }

  if (loading) return <p>Chargement...</p>;
  if (!data) return <p>Erreur de chargement des paramètres.</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Paramètres du site</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <ImageUpload
            label="Favicon"
            currentPath={data.faviconPath}
            category="site"
            onUpload={(p) => setData({ ...data, faviconPath: p })}
          />
          <ImageUpload
            label="Logo"
            currentPath={data.logoPath}
            category="site"
            onUpload={(p) => setData({ ...data, logoPath: p })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Couleur de fond</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.bgColor}
                onChange={(e) => setData({ ...data, bgColor: e.target.value })}
                className="h-10 w-14 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={data.bgColor}
                onChange={(e) => setData({ ...data, bgColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Couleur du texte</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.textColor}
                onChange={(e) => setData({ ...data, textColor: e.target.value })}
                className="h-10 w-14 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={data.textColor}
                onChange={(e) => setData({ ...data, textColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Taille de police (px)</label>
            <input
              type="number"
              value={data.fontSize}
              onChange={(e) => setData({ ...data, fontSize: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Police</label>
            <input
              type="text"
              value={data.fontFamily}
              onChange={(e) => setData({ ...data, fontFamily: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Message Toast</label>
          <input
            type="text"
            value={data.toastMessage || ""}
            onChange={(e) => setData({ ...data, toastMessage: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Délai du toast (minutes)</label>
          <input
            type="number"
            value={Math.round(data.toastDelayMs / 60000)}
            onChange={(e) => setData({ ...data, toastDelayMs: Number(e.target.value) * 60000 })}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
            min={1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">CV (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleCvUpload}
            className="w-full text-sm"
          />
          {data.cvFilePath && (
            <p className="text-xs text-muted-foreground mt-1">Fichier actuel : {data.cvFilePath}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
}
