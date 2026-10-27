"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { COURS_VIDE, CoursForm, corpsCours, type ValeursCours } from "@/components/cours-form";
import { toast } from "sonner";

export default function NouveauCoursPage() {
  const router = useRouter();
  const [valeurs, setValeurs] = useState<ValeursCours>(COURS_VIDE);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valeurs.fichier) {
      toast.error("Choisissez d'abord le PDF du cours");
      return;
    }
    setSaving(true);
    try {
      await createEntity("cours", corpsCours(valeurs));
      toast.success("Cours créé");
      router.push("/cours");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de création");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Nouveau cours</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <CoursForm valeurs={valeurs} onChange={setValeurs} />
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Création…" : "Créer"}
        </button>
      </form>
    </div>
  );
}
