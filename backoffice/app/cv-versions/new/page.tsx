"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { toast } from "sonner";
import { CvVersionForm, VERSION_VIDE, corpsVersion } from "@/components/cv-version-form";

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

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Nouvelle version du CV</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <CvVersionForm valeurs={valeurs} onChange={setValeurs} />
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Création..." : "Créer"}
        </button>
      </form>
    </div>
  );
}
