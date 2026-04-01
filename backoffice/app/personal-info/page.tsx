"use client";

import { useEffect, useState } from "react";
import { fetchSingleton, updateSingleton } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import type { PersonalInfoDto } from "@portfolio/shared-types";

export default function PersonalInfoPage() {
  const [data, setData] = useState<PersonalInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSingleton<PersonalInfoDto>("personal-info")
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
      const payload = Object.fromEntries(
        Object.entries(rest).map(([k, v]) => [k, v === "" ? undefined : v]),
      );
      await updateSingleton("personal-info", payload);
      toast.success("Informations sauvegardées");
    } catch {
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Chargement...</p>;
  if (!data) return <p>Erreur de chargement.</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Informations personnelles</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <ImageUpload
          label="Photo de profil"
          currentPath={data.avatarPath}
          category="personal"
          onUpload={(p) => setData({ ...data, avatarPath: p })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prénom</label>
            <input
              type="text"
              value={data.surname}
              onChange={(e) => setData({ ...data, surname: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">Adresse email valide</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Téléphone</label>
          <input
            type="text"
            value={data.phone || ""}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Lien GitHub</label>
          <input
            type="url"
            value={data.githubUrl || ""}
            onChange={(e) => setData({ ...data, githubUrl: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">URL valide (ex: https://github.com/username)</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Lien LinkedIn</label>
          <input
            type="url"
            value={data.linkedinUrl || ""}
            onChange={(e) => setData({ ...data, linkedinUrl: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">URL valide (ex: https://linkedin.com/in/profil)</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            value={data.bio || ""}
            onChange={(e) => setData({ ...data, bio: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
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
