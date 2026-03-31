"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchEntities, deleteEntity } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import type { ExperienceDto } from "@portfolio/shared-types";

export default function ExperiencesPage() {
  const router = useRouter();
  const [items, setItems] = useState<ExperienceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchEntities<ExperienceDto>("experiences").then(setItems).catch(() => toast.error("Erreur")).finally(() => setLoading(false)); }, []);

  async function handleDelete() {
    if (!deleteId) return;
    try { await deleteEntity("experiences", deleteId); setItems((p) => p.filter((i) => i.id !== deleteId)); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
    setDeleteId(null);
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <PageHeader title="Expériences" addHref="/experiences/new" />
      <table className="w-full text-sm"><thead><tr className="border-b border-border text-left"><th className="py-3 px-2">Entreprise</th><th className="py-3 px-2">Poste</th><th className="py-3 px-2">Période</th><th className="py-3 px-2 text-right">Actions</th></tr></thead>
        <tbody>{items.map((item) => (
          <tr key={item.id} className="border-b border-border">
            <td className="py-3 px-2">{item.company}</td>
            <td className="py-3 px-2">{item.role}</td>
            <td className="py-3 px-2 text-xs text-muted-foreground">{new Date(item.startDate).toLocaleDateString("fr")} - {item.isCurrent ? "En cours" : item.endDate ? new Date(item.endDate).toLocaleDateString("fr") : ""}</td>
            <td className="py-3 px-2 text-right space-x-2">
              <button onClick={() => router.push(`/experiences/${item.id}/edit`)} className="text-xs px-3 py-1 rounded border border-border hover:bg-accent">Modifier</button>
              <button onClick={() => setDeleteId(item.id)} className="text-xs px-3 py-1 rounded bg-destructive text-white hover:bg-destructive/90">Supprimer</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {items.length === 0 && <p className="text-center text-muted-foreground py-8">Aucune expérience</p>}
      <ConfirmDialog open={!!deleteId} title="Supprimer" message="Voulez-vous vraiment supprimer ?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
