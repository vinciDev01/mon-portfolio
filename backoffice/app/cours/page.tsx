"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchEntities, deleteEntity } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import type { CoursDto } from "@portfolio/shared-types";

const NIVEAUX: Record<string, string> = { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" };

/** Les cours, publics et masques, avec le nombre de telechargements : le
 *  compteur ne se voit qu'ici, jamais sur le site. */
export default function CoursPage() {
  const router = useRouter();
  const [items, setItems] = useState<CoursDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntities<CoursDto>("cours")
      .then(setItems)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteEntity("cours", deleteId);
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      toast.success("Cours supprimé");
    } catch {
      toast.error("Erreur de suppression");
    }
    setDeleteId(null);
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <PageHeader title="Cours" addHref="/cours/new" addLabel="Nouveau cours" />
      <table className="w-full text-sm [&_th]:pr-4 [&_td]:pr-4">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-3 px-2">Titre</th>
            <th className="py-3 px-2">Technologie</th>
            <th className="py-3 px-2">Famille</th>
            <th className="py-3 px-2">Niveau</th>
            <th className="py-3 px-2">Public</th>
            <th className="py-3 px-2">Téléchargements</th>
            <th className="py-3 px-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} className="border-b border-border">
              <td className="py-3 px-2 font-medium">{c.titre}</td>
              <td className="py-3 px-2">{c.technology.label}</td>
              <td className="py-3 px-2 text-muted-foreground">{c.technology.family?.name ?? "Autres"}</td>
              <td className="py-3 px-2">{NIVEAUX[c.niveau] ?? c.niveau}</td>
              <td className="py-3 px-2">{c.publique ? "Oui" : "Non"}</td>
              <td className="py-3 px-2 tabular-nums">{c.telechargements}</td>
              <td className="py-3 px-2 text-right space-x-2">
                <button onClick={() => router.push(`/cours/${c.id}/edit`)} className="text-xs px-3 py-1 rounded border border-border hover:bg-accent">Modifier</button>
                <button onClick={() => setDeleteId(c.id)} className="text-xs px-3 py-1 rounded bg-destructive text-white hover:bg-destructive/90">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun cours</p>}
      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer"
        message="Supprimer ce cours ? Son PDF est effacé lui aussi, et ne se télécharge plus."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
