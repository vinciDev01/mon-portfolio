"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchEntities, deleteEntity, updateEntity } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import type { ContactMessageDto } from "@portfolio/shared-types";

export default function ContactMessagesPage() {
  const router = useRouter();
  const [items, setItems] = useState<ContactMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntities<ContactMessageDto>("contact-messages")
      .then(setItems)
      .catch(() => toast.error("Erreur"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteEntity("contact-messages", deleteId);
      setItems((p) => p.filter((i) => i.id !== deleteId));
      toast.success("Supprimé");
    } catch {
      toast.error("Erreur");
    }
    setDeleteId(null);
  }

  async function toggleRead(item: ContactMessageDto) {
    try {
      await updateEntity("contact-messages", item.id, { isRead: !item.isRead });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isRead: !i.isRead } : i)),
      );
    } catch {
      toast.error("Erreur");
    }
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <PageHeader title="Messages de contact" />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-3 px-2">Nom</th>
            <th className="py-3 px-2">Email</th>
            <th className="py-3 px-2">Sujet</th>
            <th className="py-3 px-2">Statut</th>
            <th className="py-3 px-2">Date</th>
            <th className="py-3 px-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={`border-b border-border ${!item.isRead ? "font-semibold" : ""}`}
            >
              <td className="py-3 px-2">
                {item.firstName} {item.lastName}
              </td>
              <td className="py-3 px-2 text-xs">{item.email}</td>
              <td className="py-3 px-2 text-xs">{item.subject}</td>
              <td className="py-3 px-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${item.isRead ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}
                >
                  {item.isRead ? "Lu" : "Non lu"}
                </span>
              </td>
              <td className="py-3 px-2 text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString("fr-FR")}
              </td>
              <td className="py-3 px-2 text-right space-x-2">
                <button
                  onClick={() => router.push(`/contact-messages/${item.id}`)}
                  className="text-xs px-3 py-1 rounded border border-border hover:bg-accent"
                >
                  Voir
                </button>
                <button
                  onClick={() => toggleRead(item)}
                  className="text-xs px-3 py-1 rounded border border-border hover:bg-accent"
                >
                  {item.isRead ? "Non lu" : "Lu"}
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
          Aucun message
        </p>
      )}
      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer"
        message="Voulez-vous vraiment supprimer ce message ?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
