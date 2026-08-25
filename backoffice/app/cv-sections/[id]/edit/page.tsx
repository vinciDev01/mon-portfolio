"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchEntity, updateEntity } from "@/lib/api";
import { CvSectionForm, type ValeursSection } from "@/components/cv-section-form";
import { toast } from "sonner";
import type { CvSectionDto } from "@portfolio/shared-types";

export default function EditerSectionCvPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [valeurs, setValeurs] = useState<ValeursSection | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntity<CvSectionDto>("cv-sections", id)
      .then((s) =>
        setValeurs({
          titre: s.titre,
          lignes: s.lignes,
          publique: s.publique,
          sortOrder: s.sortOrder,
        }),
      )
      .catch(() => toast.error("Erreur de chargement"));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valeurs) return;
    setSaving(true);
    try {
      await updateEntity("cv-sections", id, valeurs);
      toast.success("Section enregistrée");
      router.push("/cv-sections");
    } catch {
      toast.error("Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  if (!valeurs) return <p>Chargement…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Modifier la section</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <CvSectionForm valeurs={valeurs} onChange={setValeurs} />
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
