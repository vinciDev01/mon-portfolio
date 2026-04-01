"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchEntities, deleteEntity } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import type { ProjectRawDto } from "@portfolio/shared-types";

export default function ProjectsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ProjectRawDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchEntities<ProjectRawDto>("projects").then(setItems).catch(() => toast.error("Erreur")).finally(() => setLoading(false)); }, []);

  async function handleDelete() {
    if (!deleteId) return;
    try { await deleteEntity("projects", deleteId); setItems((p) => p.filter((i) => i.id !== deleteId)); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
    setDeleteId(null);
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <PageHeader title="Projets" addHref="/projects/new" />
      <table className="w-full text-sm"><thead><tr className="border-b border-border text-left"><th className="py-3 px-2">Nom</th><th className="py-3 px-2">Technologies</th><th className="py-3 px-2">Demo</th><th className="py-3 px-2 text-right">Actions</th></tr></thead>
        <tbody>{items.map((item) => (
          <tr key={item.id} className="border-b border-border">
            <td className="py-3 px-2">{item.name}</td>
            <td className="py-3 px-2 text-xs text-muted-foreground">{item.technologies?.map((pt) => pt.technology.label).join(", ") || "-"}</td>
            <td className="py-3 px-2 text-xs">{item.demoUrl ? "Oui" : "-"}</td>
            <td className="py-3 px-2 text-right space-x-2">
              <button onClick={() => router.push(`/projects/${item.id}/edit`)} className="text-xs px-3 py-1 rounded border border-border hover:bg-accent">Modifier</button>
              <button onClick={() => setDeleteId(item.id)} className="text-xs px-3 py-1 rounded bg-destructive text-white hover:bg-destructive/90">Supprimer</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {items.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun projet</p>}
      <ConfirmDialog open={!!deleteId} title="Supprimer" message="Voulez-vous vraiment supprimer ?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
