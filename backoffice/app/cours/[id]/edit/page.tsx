"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchEntity, updateEntity } from "@/lib/api";
import { CoursForm, corpsCours, type ValeursCours } from "@/components/cours-form";
import { toast } from "sonner";
import type { CoursDto } from "@portfolio/shared-types";

export default function ModifierCoursPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [valeurs, setValeurs] = useState<ValeursCours | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntity<CoursDto>("cours", id)
      .then((c) =>
        setValeurs({
          titre: c.titre,
          titreCourt: c.titreCourt ?? "",
          description: c.description ?? "",
          niveau: c.niveau,
          pages: c.pages ? String(c.pages) : "",
          fichier: c.fichier,
          taille: c.taille,
          technologyId: c.technologyId,
          publique: c.publique,
          sortOrder: c.sortOrder,
        }),
      )
      .catch(() => toast.error("Erreur de chargement"));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valeurs) return;
    setSaving(true);
    try {
      // Un PDF remplace efface l'ancien du disque, cote serveur.
      await updateEntity("cours", id, corpsCours(valeurs));
      toast.success("Cours enregistré");
      router.push("/cours");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  if (!valeurs) return <p>Chargement…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Modifier le cours</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <CoursForm valeurs={valeurs} onChange={setValeurs} />
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
