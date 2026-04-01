"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchEntity, updateEntity, deleteEntity } from "@/lib/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import type { ContactMessageDto } from "@portfolio/shared-types";

export default function ContactMessageDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [data, setData] = useState<ContactMessageDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetchEntity<ContactMessageDto>("contact-messages", id)
      .then((msg) => {
        setData(msg);
        if (!msg.isRead) {
          updateEntity("contact-messages", id, { isRead: true }).catch(() => {});
        }
      })
      .catch(() => toast.error("Erreur"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    try {
      await deleteEntity("contact-messages", id);
      toast.success("Supprimé");
      router.push("/contact-messages");
    } catch {
      toast.error("Erreur");
    }
  }

  if (loading) return <p>Chargement...</p>;
  if (!data) return <p>Message introuvable.</p>;

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push("/contact-messages")}
        className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
      >
        &larr; Retour
      </button>

      <h1 className="text-2xl font-bold mb-6">{data.subject}</h1>

      <div className="space-y-4 bg-card rounded-lg border border-border p-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">De :</span>{" "}
            <span className="font-medium">
              {data.firstName} {data.lastName}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Email :</span>{" "}
            <a href={`mailto:${data.email}`} className="font-medium hover:underline">
              {data.email}
            </a>
          </div>
          <div>
            <span className="text-muted-foreground">Date :</span>{" "}
            <span>{new Date(data.createdAt).toLocaleString("fr-FR")}</span>
          </div>
        </div>

        <hr className="border-border" />

        <p className="text-sm leading-relaxed whitespace-pre-line">
          {data.message}
        </p>
      </div>

      <button
        onClick={() => setShowDelete(true)}
        className="mt-6 px-4 py-2 text-sm rounded-md bg-destructive text-white hover:bg-destructive/90"
      >
        Supprimer
      </button>

      <ConfirmDialog
        open={showDelete}
        title="Supprimer"
        message="Voulez-vous vraiment supprimer ce message ?"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
