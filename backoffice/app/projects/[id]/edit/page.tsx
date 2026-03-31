"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchEntity, updateEntity, fetchEntities } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import type { ProjectDto, TechnologyDto } from "@portfolio/shared-types";

export default function EditProjectPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [techs, setTechs] = useState<TechnologyDto[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photo1Path, setPhoto1Path] = useState<string | null>(null);
  const [photo2Path, setPhoto2Path] = useState<string | null>(null);
  const [demoUrl, setDemoUrl] = useState("");
  const [technologyIds, setTechnologyIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchEntity<ProjectDto>("projects", id), fetchEntities<TechnologyDto>("technologies")])
      .then(([project, technologies]) => {
        setName(project.name); setDescription(project.description || "");
        setPhoto1Path(project.photo1Path); setPhoto2Path(project.photo2Path);
        setDemoUrl(project.demoUrl || ""); setSortOrder(project.sortOrder);
        setTechnologyIds(project.technologies?.map((t) => t.id) || []);
        setTechs(technologies);
      }).catch(() => toast.error("Erreur")).finally(() => setLoading(false));
  }, [id]);

  function toggleTech(techId: string) {
    setTechnologyIds((prev) => prev.includes(techId) ? prev.filter((t) => t !== techId) : [...prev, techId]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateEntity("projects", id, { name, description: description || null, photo1Path, photo2Path, demoUrl: demoUrl || null, technologyIds, sortOrder });
      toast.success("Mis à jour");
      router.push("/projects");
    } catch { toast.error("Erreur"); } finally { setSaving(false); }
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Modifier le projet</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label className="block text-sm font-medium mb-1">Nom</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <ImageUpload currentPath={photo1Path} category="projects" onUpload={setPhoto1Path} label="Photo 1" />
          <ImageUpload currentPath={photo2Path} category="projects" onUpload={setPhoto2Path} label="Photo 2" />
        </div>
        <div><label className="block text-sm font-medium mb-1">Lien démo</label><input type="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div>
          <label className="block text-sm font-medium mb-2">Technologies</label>
          <div className="flex flex-wrap gap-2">
            {techs.map((t) => (
              <label key={t.id} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border cursor-pointer hover:bg-accent has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                <input type="checkbox" checked={technologyIds.includes(t.id)} onChange={() => toggleTech(t.id)} className="sr-only" />
                {t.label}
              </label>
            ))}
          </div>
        </div>
        <div><label className="block text-sm font-medium mb-1">Ordre</label><input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Sauvegarde..." : "Sauvegarder"}</button>
      </form>
    </div>
  );
}
