"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { CvSectionForm, type ValeursSection } from "@/components/cv-section-form";
import { ApercuCv } from "@/components/apercu-cv";
import { toast } from "sonner";

export default function NouvelleSectionCvPage() {
  const router = useRouter();
  const [valeurs, setValeurs] = useState<ValeursSection>({
    titre: "",
    lignes: "",
    publique: true,
    sortOrder: 20,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createEntity("cv-sections", valeurs);
      toast.success("Section créée");
      router.push("/cv-sections");
    } catch {
      toast.error("Erreur de création");
    } finally {
      setSaving(false);
    }
  }

  return (
    // Le formulaire a gauche, le CV a droite : l'apercu suit la saisie.
    <div className="grid gap-8 xl:grid-cols-[minmax(0,32rem)_minmax(420px,1fr)] items-start">
      <div>
      <h1 className="text-2xl font-bold mb-8">Nouvelle section du CV</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <CvSectionForm valeurs={valeurs} onChange={setValeurs} />
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Création…" : "Créer"}
        </button>
      </form>
      </div>
      <aside className="xl:sticky xl:top-8 h-[80vh]">
        <ApercuCv brouillon={valeurs} />
      </aside>
    </div>
  );
}
