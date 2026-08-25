"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { CvSectionForm, type ValeursSection } from "@/components/cv-section-form";
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
    <div className="max-w-lg">
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
  );
}
