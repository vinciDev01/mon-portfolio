"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchEntity, updateEntity } from "@/lib/api";
import { toast } from "sonner";
import type { CvVersionDto } from "@portfolio/shared-types";
import { CvVersionForm, corpsVersion, valeursDeVersion, type ValeursVersion } from "@/components/cv-version-form";
import { ApercuCv } from "@/components/apercu-cv";

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

  // Le CV tel qu'il sera une fois la version enregistree ; le nom n'y
  // figure pas.
  const { nom: _nom, ...brouillon } = corpsVersion(valeurs);
  void _nom;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Modifier la version du CV</h1>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
        <form onSubmit={handleSubmit} className="space-y-6">
          <CvVersionForm valeurs={valeurs} onChange={setValeurs} />
          <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </form>
        <div className="xl:sticky xl:top-6 h-[85vh]">
          <ApercuCv versionCv={id} brouillonVersion={brouillon} />
        </div>
      </div>
    </div>
  );
}
