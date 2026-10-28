"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchEntity, updateEntity } from "@/lib/api";
import { toast } from "sonner";
import type { CvVersionDto } from "@portfolio/shared-types";
import { CvVersionForm, corpsVersion, valeursDeVersion, type ValeursVersion } from "@/components/cv-version-form";

export default function EditCvVersionPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [valeurs, setValeurs] = useState<ValeursVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntity<CvVersionDto>("cv-versions", id)
      .then((v) => setValeurs(valeursDeVersion(v)))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valeurs) return;
    setSaving(true);
    try {
      await updateEntity("cv-versions", id, corpsVersion(valeurs));
      toast.success("Version mise à jour");
      router.push("/cv-versions");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Chargement...</p>;
  if (!valeurs) return <p>Version introuvable.</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Modifier la version du CV</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <CvVersionForm valeurs={valeurs} onChange={setValeurs} />
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
}
