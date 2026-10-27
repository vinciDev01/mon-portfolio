"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchEntity, updateEntity } from "@/lib/api";
import { toast } from "sonner";
import type { SkillDto } from "@portfolio/shared-types";
import { SkillForm, corpsCompetence, erreurCompetence, valeursDe, type ValeursCompetence } from "@/components/skill-form";

export default function EditSkillPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [valeurs, setValeurs] = useState<ValeursCompetence | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntity<SkillDto>("skills", id)
      .then((s) => setValeurs(valeursDe(s)))
      .catch(() => toast.error("Erreur"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valeurs) return;
    const erreur = erreurCompetence(valeurs);
    if (erreur) { toast.error(erreur); return; }
    setSaving(true);
    try {
      await updateEntity("skills", id, corpsCompetence(valeurs));
      toast.success("Mis à jour");
      router.push("/skills");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Chargement...</p>;
  if (!valeurs) return <p>Introuvable.</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Modifier la compétence</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <SkillForm valeurs={valeurs} onChange={setValeurs} />
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Sauvegarde..." : "Sauvegarder"}</button>
      </form>
    </div>
  );
}
