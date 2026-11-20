"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { toast } from "sonner";
import { CvVersionForm, VERSION_VIDE, corpsVersion } from "@/components/cv-version-form";
import { ApercuCv } from "@/components/apercu-cv";

export default function NewCvVersionPage() {
  const router = useRouter();
  const [valeurs, setValeurs] = useState(VERSION_VIDE);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createEntity("cv-versions", corpsVersion(valeurs));
      toast.success("Version créée");
      router.push("/cv-versions");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  // Le CV tel qu'il sera une fois la version creee ; le nom n'y figure pas.
  const { nom: _nom, ...brouillon } = corpsVersion(valeurs);
  void _nom;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Nouvelle version du CV</h1>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
        <form onSubmit={handleSubmit} className="space-y-6">
          <CvVersionForm valeurs={valeurs} onChange={setValeurs} />
          <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Création..." : "Créer"}
          </button>
        </form>
        <div className="xl:sticky xl:top-6 h-[85vh]">
          <ApercuCv brouillonVersion={brouillon} />
        </div>
      </div>
    </div>
  );
}
