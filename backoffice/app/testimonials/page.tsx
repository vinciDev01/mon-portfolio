"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchEntities, deleteEntity, updateEntity } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import type { TestimonialDto } from "@portfolio/shared-types";

export default function TestimonialsPage() {
  const router = useRouter();
  const [items, setItems] = useState<TestimonialDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntities<TestimonialDto>("testimonials")
      .then(setItems)
      .catch(() => toast.error("Erreur"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteEntity("testimonials", deleteId);
      setItems((p) => p.filter((i) => i.id !== deleteId));
      toast.success("Supprimé");
    } catch {
      toast.error("Erreur");
    }
    setDeleteId(null);
  }

  async function toggleApproval(item: TestimonialDto) {
    try {
      await updateEntity("testimonials", item.id, {
        isApproved: !item.isApproved,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isApproved: !i.isApproved } : i,
        ),
      );
      toast.success(item.isApproved ? "Rejeté" : "Approuvé");
    } catch {
      toast.error("Erreur");
    }
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <PageHeader title="Témoignages" />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-3 px-2">Nom</th>
            <th className="py-3 px-2">Entreprise</th>
            <th className="py-3 px-2">Statut</th>
            <th className="py-3 px-2">Date</th>
            <th className="py-3 px-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border">
              <td className="py-3 px-2">
                {item.firstName} {item.lastName}
              </td>
              <td className="py-3 px-2 text-xs text-muted-foreground">
                {item.company || "-"}
              </td>
              <td className="py-3 px-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${item.isApproved ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"}`}
                >
                  {item.isApproved ? "Approuvé" : "En attente"}
                </span>
              </td>
              <td className="py-3 px-2 text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString("fr-FR")}
              </td>
              <td className="py-3 px-2 text-right space-x-2">
                <button
                  onClick={() => toggleApproval(item)}
                  className={`text-xs px-3 py-1 rounded border border-border hover:bg-accent ${!item.isApproved ? "text-green-700" : "text-yellow-700"}`}
                >
                  {item.isApproved ? "Rejeter" : "Approuver"}
                </button>
                <button
                  onClick={() =>
                    router.push(`/testimonials/${item.id}/edit`)
                  }
                  className="text-xs px-3 py-1 rounded border border-border hover:bg-accent"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="text-xs px-3 py-1 rounded bg-destructive text-white hover:bg-destructive/90"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          Aucun témoignage
        </p>
      )}
      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer"
        message="Voulez-vous vraiment supprimer ce témoignage ?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
