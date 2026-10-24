"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import { ChampFamille } from "@/components/champ-famille";
import { toast } from "sonner";

export default function NewTechnologyPage() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState(0);
  // Cochee par defaut : une technologie nouvelle sort dans le CV.
  const [showInCv, setShowInCv] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createEntity("technologies", { label, logoPath, sortOrder, showInCv, familyId: familyId || null });
      toast.success("Technologie créée");
      router.push("/technologies");
    } catch {
      toast.error("Erreur de création");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Nouvelle technologie</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Libellé</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
        </div>
        <ImageUpload currentPath={logoPath} category="technologies" onUpload={setLogoPath} label="Logo" />
        <ChampFamille valeur={familyId} surChangement={setFamilyId} />
        <div>
          <label className="block text-sm font-medium mb-1">Ordre d&apos;affichage</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            min={0}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">Entier positif ou nul</p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInCv}
            onChange={(e) => setShowInCv(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">Apparaît dans le CV</span>
            <span className="block text-xs text-muted-foreground">
              Décochée, la technologie reste sur le portfolio mais ne sort pas
              dans le CV téléchargeable.
            </span>
          </span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Création..." : "Créer"}
        </button>
      </form>
    </div>
  );
}
