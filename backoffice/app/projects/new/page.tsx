"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity, fetchEntities } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import type { TechnologyDto } from "@portfolio/shared-types";

interface CollaboratorRow {
  firstName: string;
  lastName: string;
  email: string;
  linkedinUrl: string;
}

const emptyCollaborator = (): CollaboratorRow => ({
  firstName: "",
  lastName: "",
  email: "",
  linkedinUrl: "",
});

export default function NewProjectPage() {
  const router = useRouter();
  const [techs, setTechs] = useState<TechnologyDto[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photo1Path, setPhoto1Path] = useState<string | null>(null);
  const [photo2Path, setPhoto2Path] = useState<string | null>(null);
  const [demoUrl, setDemoUrl] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [technologyIds, setTechnologyIds] = useState<string[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorRow[]>([]);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntities<TechnologyDto>("technologies")
      .then(setTechs)
      .catch(() => {});
  }, []);

  function toggleTech(id: string) {
    setTechnologyIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function updateCollaborator(
    index: number,
    field: keyof CollaboratorRow,
    value: string,
  ) {
    setCollaborators((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  function removeCollaborator(index: number) {
    setCollaborators((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const collabs = collaborators
        .filter((c) => c.firstName && c.lastName)
        .map((c, i) => ({
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email || undefined,
          linkedinUrl: c.linkedinUrl || undefined,
          sortOrder: i,
        }));
      await createEntity("projects", {
        name,
        description: description || null,
        photo1Path,
        photo2Path,
        demoUrl: demoUrl || null,
        targetAudience: targetAudience || null,
        startDate: startDate || null,
        endDate: endDate || null,
        technologyIds,
        collaborators: collabs.length ? collabs : undefined,
        sortOrder,
      });
      toast.success("Projet créé");
      router.push("/projects");
    } catch {
      toast.error("Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Nouveau projet</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ImageUpload
            currentPath={photo1Path}
            category="projects"
            onUpload={setPhoto1Path}
            label="Photo 1"
          />
          <ImageUpload
            currentPath={photo2Path}
            category="projects"
            onUpload={setPhoto2Path}
            label="Photo 2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Lien démo</label>
          <input
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Public concerné
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Séparé par des virgules (ex: Agriculteurs, ONG, Étudiants)
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Date de fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Technologies</label>
          <div className="flex flex-wrap gap-2">
            {techs.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border cursor-pointer hover:bg-accent has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
              >
                <input
                  type="checkbox"
                  checked={technologyIds.includes(t.id)}
                  onChange={() => toggleTech(t.id)}
                  className="sr-only"
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        {/* Collaborators */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Collaborateurs
          </label>
          <div className="space-y-3">
            {collaborators.map((c, i) => (
              <div
                key={i}
                className="border border-border rounded-md p-3 space-y-2"
              >
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={c.firstName}
                    onChange={(e) =>
                      updateCollaborator(i, "firstName", e.target.value)
                    }
                    className="px-3 py-1.5 border border-border rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Nom"
                    value={c.lastName}
                    onChange={(e) =>
                      updateCollaborator(i, "lastName", e.target.value)
                    }
                    className="px-3 py-1.5 border border-border rounded-md text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="Email (optionnel)"
                    value={c.email}
                    onChange={(e) =>
                      updateCollaborator(i, "email", e.target.value)
                    }
                    className="px-3 py-1.5 border border-border rounded-md text-sm"
                  />
                  <input
                    type="url"
                    placeholder="LinkedIn (optionnel)"
                    value={c.linkedinUrl}
                    onChange={(e) =>
                      updateCollaborator(i, "linkedinUrl", e.target.value)
                    }
                    className="px-3 py-1.5 border border-border rounded-md text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCollaborator(i)}
                  className="text-xs text-destructive hover:underline"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCollaborators((prev) => [...prev, emptyCollaborator()])}
            className="mt-2 text-sm px-3 py-1.5 rounded border border-border hover:bg-accent"
          >
            + Ajouter un collaborateur
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ordre</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            min={0}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
        </div>
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
