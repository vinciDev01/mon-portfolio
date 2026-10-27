"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { toast } from "sonner";
import { COMPETENCE_VIDE, SkillForm, corpsCompetence, erreurCompetence } from "@/components/skill-form";

export default function NewSkillPage() {
  const router = useRouter();
  const [valeurs, setValeurs] = useState(COMPETENCE_VIDE);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const erreur = erreurCompetence(valeurs);
    if (erreur) { toast.error(erreur); return; }
    setSaving(true);
    try {
      await createEntity("skills", corpsCompetence(valeurs));
      toast.success("Compétence créée");
      router.push("/skills");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Nouvelle compétence</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <SkillForm valeurs={valeurs} onChange={setValeurs} />
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Création..." : "Créer"}</button>
      </form>
    </div>
  );
}
